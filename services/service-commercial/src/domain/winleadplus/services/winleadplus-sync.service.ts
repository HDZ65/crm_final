import { status } from '@grpc/grpc-js';
import { NatsService } from '@crm/shared-kernel';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { ContratService } from '../../../infrastructure/persistence/typeorm/repositories/contrats';
import { WinLeadPlusConfigService } from '../../../infrastructure/persistence/typeorm/repositories/winleadplus/winleadplus-config.service';
import { WinLeadPlusMappingService } from '../../../infrastructure/persistence/typeorm/repositories/winleadplus/winleadplus-mapping.service';
import { WinLeadPlusSyncLogService } from '../../../infrastructure/persistence/typeorm/repositories/winleadplus/winleadplus-sync-log.service';
import { LigneContratEntity } from '../../contrats/entities/ligne-contrat.entity';
import { WinLeadPlusConfigEntity } from '../entities/winleadplus-config.entity';
import { WinLeadPlusMappingEntity } from '../entities/winleadplus-mapping.entity';
import {
  WinLeadPlusSyncLogEntity,
  WinLeadPlusSyncStatus,
} from '../entities/winleadplus-sync-log.entity';
import {
  WinLeadPlusMapperService,
  type WinLeadPlusAbonnement,
  type WinLeadPlusMappedClient,
  type WinLeadPlusProspect,
} from './winleadplus-mapper.service';

interface SyncOptions {
  token?: string;
  apiEndpoint?: string;
}

interface ClientCreateResponse {
  id?: string;
  client_id?: string;
  clientId?: string;
}

export interface WinLeadPlusSyncStatusView {
  isSyncing: boolean;
  currentSyncId?: string;
  lastSyncAt?: string;
}

export interface SaveWinLeadPlusConfigInput {
  id?: string;
  organisationId?: string;
  apiEndpoint?: string;
  enabled?: boolean;
  syncIntervalMinutes?: number;
  apiToken?: string;
}

const DEFAULT_WINLEADPLUS_ENDPOINT = 'https://winleadplus.com/api/prospects';
const DEFAULT_UUID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class WinLeadPlusSyncService {
  private readonly logger = new Logger(WinLeadPlusSyncService.name);
  private isScheduledSyncRunning = false;

  constructor(
    private readonly mapper: WinLeadPlusMapperService,
    private readonly configRepository: WinLeadPlusConfigService,
    private readonly mappingRepository: WinLeadPlusMappingService,
    private readonly syncLogRepository: WinLeadPlusSyncLogService,
    private readonly contratService: ContratService,
    @InjectRepository(LigneContratEntity)
    private readonly ligneContratRepository: Repository<LigneContratEntity>,
    @Optional() private readonly natsService?: NatsService,
  ) {}

  async syncProspects(
    organisationId: string,
    dryRun = false,
    options?: SyncOptions,
  ): Promise<WinLeadPlusSyncLogEntity> {
    if (!organisationId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisationId is required',
      });
    }

    const config = await this.getConfig(organisationId);
    const apiEndpoint = this.resolveApiEndpoint(options?.apiEndpoint || config.apiEndpoint);
    const token = this.resolveApiToken(options?.token, config.apiToken);

    if (!token) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'WinLeadPlus API token is missing',
      });
    }

    const runningSync = await this.syncLogRepository.findRunning(organisationId);
    if (runningSync) {
      this.logger.warn(
        `Sync already running for organisation ${organisationId} (syncId=${runningSync.id})`,
      );
      return runningSync;
    }

    const syncLog = await this.syncLogRepository.create({
      organisationId,
      startedAt: new Date(),
    });

    try {
      const prospects = await this.fetchProspects(apiEndpoint, token);
      syncLog.totalProspects = prospects.length;

      for (const prospect of prospects) {
        const prospectId = this.resolveProspectId(prospect);
        if (prospectId === null) {
          syncLog.skipped += 1;
          this.pushSyncError(syncLog, 'unknown', 'Missing or invalid idProspect');
          continue;
        }

        try {
          const existingMapping = await this.mappingRepository.findByProspectId(
            organisationId,
            prospectId,
          );
          const dataHash = this.mapper.computeDataHash(prospect);

          if (existingMapping?.dataHash === dataHash) {
            syncLog.skipped += 1;
            continue;
          }

          const mappedClient = this.mapper.mapProspectToClient(prospect);
          if (dryRun) {
            if (existingMapping) {
              syncLog.updated += 1;
            } else {
              syncLog.created += 1;
            }
            continue;
          }

          let crmClientId: string;
          if (existingMapping) {
            crmClientId = existingMapping.crmClientId;
            await this.publishClientUpdate(organisationId, crmClientId, mappedClient);
            syncLog.updated += 1;
          } else {
            crmClientId = await this.publishClientCreate(organisationId, mappedClient);
            syncLog.created += 1;
          }

          const contratIds = await this.syncProspectContrats(
            organisationId,
            prospect,
            crmClientId,
            mappedClient.commercial_id,
          );

          await this.saveMapping(
            organisationId,
            prospectId,
            crmClientId,
            contratIds,
            dataHash,
            existingMapping,
          );
        } catch (error) {
          syncLog.skipped += 1;
          const message = error instanceof Error ? error.message : String(error);
          this.pushSyncError(syncLog, String(prospectId), message);
          this.logger.error(
            `Prospect sync failed for organisation ${organisationId}, prospect ${prospectId}: ${message}`,
          );
        }
      }

      syncLog.markSuccess();
      config.lastSyncAt = new Date();
      await this.configRepository.save(config);
      return this.syncLogRepository.save(syncLog);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.pushSyncError(syncLog, 'global', message);
      syncLog.markFailed({ message });
      this.logger.error(`WinLeadPlus sync failed for organisation ${organisationId}: ${message}`);
      return this.syncLogRepository.save(syncLog);
    }
  }

  async getConfig(organisationId: string): Promise<WinLeadPlusConfigEntity> {
    const existing = await this.configRepository.findByOrganisationId(organisationId);
    if (existing) {
      return existing;
    }

    const created = new WinLeadPlusConfigEntity();
    created.organisationId = organisationId;
    created.apiEndpoint = DEFAULT_WINLEADPLUS_ENDPOINT;
    created.enabled = true;
    created.syncIntervalMinutes = 60;
    created.lastSyncAt = null;
    created.apiToken = process.env.WINLEADPLUS_API_TOKEN || null;
    return this.configRepository.save(created);
  }

  async hasConfig(organisationId: string): Promise<boolean> {
    const config = await this.configRepository.findByOrganisationId(organisationId);
    return config !== null && config.enabled;
  }

  async saveConfig(input: SaveWinLeadPlusConfigInput): Promise<WinLeadPlusConfigEntity> {
    let config: WinLeadPlusConfigEntity | null = null;

    if (input.id) {
      config = await this.configRepository.findById(input.id);
      if (!config) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `WinLeadPlus config ${input.id} not found`,
        });
      }
    } else if (input.organisationId) {
      config = await this.configRepository.findByOrganisationId(input.organisationId);
    }

    if (!config) {
      if (!input.organisationId) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'organisationId is required when creating a config',
        });
      }

      config = new WinLeadPlusConfigEntity();
      config.organisationId = input.organisationId;
      config.lastSyncAt = null;
      config.apiToken = null;
    }

    if (input.apiEndpoint !== undefined) {
      config.apiEndpoint = this.resolveApiEndpoint(input.apiEndpoint);
    }
    if (input.enabled !== undefined) {
      config.enabled = input.enabled;
    }
    if (input.syncIntervalMinutes !== undefined) {
      config.syncIntervalMinutes = input.syncIntervalMinutes;
    }
    if (input.apiToken !== undefined) {
      config.apiToken = input.apiToken || null;
    }

    if (!config.apiEndpoint) {
      config.apiEndpoint = DEFAULT_WINLEADPLUS_ENDPOINT;
    }

    if (!config.syncIntervalMinutes || config.syncIntervalMinutes <= 0) {
      config.syncIntervalMinutes = 60;
    }

    return this.configRepository.save(config);
  }

  async testConnection(
    organisationId: string,
    options?: SyncOptions,
  ): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig(organisationId);
    const endpoint = this.resolveApiEndpoint(options?.apiEndpoint || config.apiEndpoint);
    const token = this.resolveApiToken(options?.token, config.apiToken);

    if (!token) {
      return {
        success: false,
        message: 'Missing API token for WinLeadPlus test connection',
      };
    }

    try {
      const url = new URL(endpoint);
      url.searchParams.set('limit', '1');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          message: `WinLeadPlus API returned HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        message: 'WinLeadPlus connection successful',
      };
    } catch (error) {
      return {
        success: false,
        message: `WinLeadPlus connection failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async getSyncStatus(organisationId: string): Promise<WinLeadPlusSyncStatusView> {
    const running = await this.syncLogRepository.findRunning(organisationId);
    const latest = await this.syncLogRepository.findLatestByOrganisation(organisationId);

    return {
      isSyncing: Boolean(running),
      currentSyncId: running?.id,
      lastSyncAt: latest?.startedAt ? latest.startedAt.toISOString() : undefined,
    };
  }

  async getSyncLogs(organisationId: string, limit?: number): Promise<WinLeadPlusSyncLogEntity[]> {
    const logs = await this.syncLogRepository.findAll({ organisationId });
    if (!limit || limit <= 0) {
      return logs;
    }
    return logs.slice(0, limit);
  }

  @Cron('0 * * * *', {
    name: 'winleadplus-hourly-sync',
    timeZone: 'Europe/Paris',
  })
  async handleHourlySync(): Promise<void> {
    if (this.isScheduledSyncRunning) {
      this.logger.warn('Hourly WinLeadPlus sync is already running, skipping');
      return;
    }

    this.isScheduledSyncRunning = true;

    try {
      const configs = await this.configRepository.findAllEnabled();
      if (configs.length === 0) {
        this.logger.log('No enabled WinLeadPlus config found for hourly sync');
        return;
      }

      for (const config of configs) {
        try {
          const log = await this.syncProspects(config.organisationId, false, {
            token: config.apiToken || undefined,
            apiEndpoint: config.apiEndpoint,
          });
          this.logger.log(
            `Hourly WinLeadPlus sync completed for ${config.organisationId} (status=${log.status}, created=${log.created}, updated=${log.updated}, skipped=${log.skipped})`,
          );
        } catch (error) {
          this.logger.error(
            `Hourly WinLeadPlus sync failed for ${config.organisationId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } finally {
      this.isScheduledSyncRunning = false;
    }
  }

  private resolveApiEndpoint(endpoint?: string | null): string {
    const raw = String(endpoint || '').trim();
    if (!raw) {
      return DEFAULT_WINLEADPLUS_ENDPOINT;
    }

    if (raw.includes('/api/prospects')) {
      return raw;
    }

    const clean = raw.replace(/\/+$/, '');
    return `${clean}/api/prospects`;
  }

  private resolveApiToken(overrideToken?: string, configToken?: string | null): string {
    const token = String(overrideToken || configToken || process.env.WINLEADPLUS_API_TOKEN || '').trim();
    return token;
  }

  private async fetchProspects(endpoint: string, token: string): Promise<WinLeadPlusProspect[]> {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WinLeadPlus API returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    if (Array.isArray(payload)) {
      return payload as WinLeadPlusProspect[];
    }

    if (payload && typeof payload === 'object') {
      const candidate = payload as Record<string, unknown>;
      const sources = [candidate.data, candidate.prospects, candidate.items, candidate.results];
      for (const source of sources) {
        if (Array.isArray(source)) {
          return source as WinLeadPlusProspect[];
        }
      }
    }

    throw new Error('WinLeadPlus API payload does not contain a prospects array');
  }

  private resolveProspectId(prospect: WinLeadPlusProspect): number | null {
    const value = prospect.idProspect;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number.parseInt(value.trim(), 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private async publishClientCreate(
    organisationId: string,
    client: WinLeadPlusMappedClient,
  ): Promise<string> {
    if (!this.natsService || !this.natsService.isConnected()) {
      throw new Error('NATS is not connected for WinLeadPlus client creation');
    }

    const payload = {
      organisation_id: organisationId,
      type_client: client.type_client,
      nom: client.nom,
      prenom: client.prenom,
      date_naissance: client.date_naissance,
      compte_code: client.compte_code,
      partenaire_id: client.partenaire_id,
      telephone: client.telephone,
      email: client.email,
      statut: client.statut,
      canal_acquisition: client.canal_acquisition,
      source: client.source,
      iban: client.iban,
      mandat_sepa: client.mandat_sepa,
      commercial_id: client.commercial_id,
      adresse: client.adresse,
    };

    const response = await this.natsService.request<typeof payload, ClientCreateResponse>(
      'client.create.from-winleadplus',
      payload,
      10000,
    );

    const clientId = this.extractClientId(response);
    if (!clientId) {
      throw new Error('client.create.from-winleadplus did not return a client id');
    }

    return clientId;
  }

  private async publishClientUpdate(
    organisationId: string,
    clientId: string,
    client: WinLeadPlusMappedClient,
  ): Promise<void> {
    if (!this.natsService || !this.natsService.isConnected()) {
      throw new Error('NATS is not connected for WinLeadPlus client update');
    }

    await this.natsService.publish('client.update.from-winleadplus', {
      organisation_id: organisationId,
      client_id: clientId,
      fields: {
        nom: client.nom,
        prenom: client.prenom,
        date_naissance: client.date_naissance,
        telephone: client.telephone,
        email: client.email,
        iban: client.iban,
        mandat_sepa: client.mandat_sepa,
        canal_acquisition: client.canal_acquisition,
        source: client.source,
        commercial_id: client.commercial_id,
        adresse: client.adresse,
      },
    });
  }

  private extractClientId(response: ClientCreateResponse | null | undefined): string {
    const candidate =
      response?.id ||
      response?.client_id ||
      response?.clientId ||
      (response as unknown as Record<string, unknown> | null)?.['crm_client_id'];

    return typeof candidate === 'string' ? candidate : '';
  }

  private async syncProspectContrats(
    organisationId: string,
    prospect: WinLeadPlusProspect,
    clientId: string,
    fallbackCommercialId?: string,
  ): Promise<string[]> {
    const contrats = Array.isArray(prospect.contrats) ? prospect.contrats : [];
    const abonnementItems = Array.isArray(prospect.abonnements) ? prospect.abonnements : [];
    const contratIds: string[] = [];

    for (const contrat of contrats) {
      const mapped = this.mapper.mapContratToContrat(contrat, clientId);
      const commercialId = mapped.commercialId || fallbackCommercialId || DEFAULT_UUID;

      const existing = await this.findContratByReference(organisationId, mapped.reference);
      const notes = this.composeContractNotes(mapped.notes);

      let contratId: string;
      if (existing) {
        const updated = await this.contratService.update({
          id: existing.id,
          reference: mapped.reference,
          titre: mapped.titre,
          statut: mapped.statut,
          dateDebut: mapped.dateDebut,
          dateSignature: mapped.dateSignature,
          montant: mapped.montant,
          devise: mapped.devise,
          frequenceFacturation: mapped.frequenceFacturation,
          fournisseur: mapped.fournisseur,
          clientId,
          commercialId,
          notes,
        });
        contratId = updated.id;
      } else {
        const created = await this.contratService.create({
          organisationId,
          reference: mapped.reference,
          titre: mapped.titre,
          statut: mapped.statut,
          dateDebut: mapped.dateDebut,
          dateSignature: mapped.dateSignature,
          montant: mapped.montant,
          devise: mapped.devise,
          frequenceFacturation: mapped.frequenceFacturation,
          fournisseur: mapped.fournisseur,
          clientId,
          commercialId,
          notes,
        });
        contratId = created.id;
      }

      contratIds.push(contratId);
      await this.syncContratLignes(contratId, abonnementItems);
    }

    return contratIds;
  }

  private async syncContratLignes(
    contratId: string,
    abonnements: WinLeadPlusAbonnement[],
  ): Promise<void> {
    await this.ligneContratRepository.delete({ contratId });

    for (const abonnement of abonnements) {
      const mappedLigne = this.mapper.mapAbonnementToLigneContrat(abonnement, contratId);

      const ligne = this.ligneContratRepository.create({
        contratId,
        produitId: this.toPseudoUuid(mappedLigne.metadata.offre_id || mappedLigne.nom),
        periodeFacturationId: DEFAULT_UUID,
        quantite: mappedLigne.quantite,
        prixUnitaire: mappedLigne.prix_unitaire,
        canalVente: JSON.stringify({
          source: mappedLigne.metadata.source,
          nom: mappedLigne.nom,
          categorie: mappedLigne.metadata.categorie,
          offre_id: mappedLigne.metadata.offre_id,
        }),
      });

      await this.ligneContratRepository.save(ligne);
    }
  }

  private async findContratByReference(
    organisationId: string,
    reference: string,
  ): Promise<{ id: string } | null> {
    try {
      const contrat = await this.contratService.findByReference(organisationId, reference);
      return { id: contrat.id };
    } catch (error) {
      if (error instanceof RpcException) {
        const rpcError = error.getError() as { code?: number };
        if (rpcError?.code === status.NOT_FOUND) {
          return null;
        }
      }
      throw error;
    }
  }

  private composeContractNotes(existing?: string): string {
    const sourceTag = '[source:WinLeadPlus]';
    if (!existing || !existing.trim()) {
      return sourceTag;
    }
    if (existing.includes(sourceTag)) {
      return existing;
    }
    return `${sourceTag} ${existing}`;
  }

  private async saveMapping(
    organisationId: string,
    prospectId: number,
    crmClientId: string,
    contratIds: string[],
    dataHash: string,
    existing?: WinLeadPlusMappingEntity | null,
  ): Promise<void> {
    const mapping = existing || new WinLeadPlusMappingEntity();
    mapping.organisationId = organisationId;
    mapping.winleadplusProspectId = prospectId;
    mapping.crmClientId = crmClientId;
    mapping.crmContratIds = contratIds;
    mapping.dataHash = dataHash;
    mapping.lastSyncedAt = new Date();

    await this.mappingRepository.save(mapping);
  }

  private pushSyncError(
    syncLog: WinLeadPlusSyncLogEntity,
    prospectId: string,
    message: string,
  ): void {
    syncLog.errors = [
      ...(Array.isArray(syncLog.errors) ? syncLog.errors : []),
      {
        prospectId,
        message,
        at: new Date().toISOString(),
      },
    ];
  }

  private toPseudoUuid(source: string): string {
    const value = String(source || 'winleadplus').trim() || 'winleadplus';
    const base = Buffer.from(value)
      .toString('hex')
      .padEnd(32, '0')
      .slice(0, 32);

    return `${base.slice(0, 8)}-${base.slice(8, 12)}-${base.slice(12, 16)}-${base.slice(16, 20)}-${base.slice(20, 32)}`;
  }
}

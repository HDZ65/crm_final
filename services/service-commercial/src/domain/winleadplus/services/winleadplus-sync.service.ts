import { status } from '@grpc/grpc-js';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';

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
  type WinLeadPlusMappedClient,
  type WinLeadPlusMappedLigneContrat,
  type WinLeadPlusProspect,
  type WinLeadPlusSouscription,
} from './winleadplus-mapper.service';
import { WinLeadPlusCoreGrpcClient } from './winleadplus-core-grpc-client';

interface SyncOptions {
  token?: string;
  apiEndpoint?: string;
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

  private readonly grpcClient: WinLeadPlusCoreGrpcClient;

  constructor(
    private readonly mapper: WinLeadPlusMapperService,
    private readonly configRepository: WinLeadPlusConfigService,
    private readonly mappingRepository: WinLeadPlusMappingService,
    private readonly syncLogRepository: WinLeadPlusSyncLogService,
    private readonly contratService: ContratService,
    @InjectRepository(LigneContratEntity)
    private readonly ligneContratRepository: Repository<LigneContratEntity>,
  ) {
    this.grpcClient = new WinLeadPlusCoreGrpcClient();
  }

  // ============================================================================
  // COMMERCIAL ID RESOLUTION (no apporteur creation)
  // ============================================================================

  private resolveCommercialId(prospect: WinLeadPlusProspect): string {
    const id =
      this.toText(prospect.commercialId) ||
      this.toText(prospect.commercial?.id) ||
      this.toText((prospect as Record<string, unknown>)['commercial_id']);
    return id || DEFAULT_UUID;
  }

  // ============================================================================
  // MAIN SYNC
  // ============================================================================

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

      // Track all prospect IDs returned by the API for delete detection
      const returnedProspectIds = new Set<number>();

      // === UPSERT PHASE ===
      for (const prospect of prospects) {
        const prospectId = this.resolveProspectId(prospect);
        if (prospectId === null) {
          syncLog.skipped += 1;
          this.pushSyncError(syncLog, 'unknown', 'Missing or invalid idProspect');
          continue;
        }

        returnedProspectIds.add(prospectId);

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
          const commercialId = this.resolveCommercialId(prospect);

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
            await this.updateClientViaGrpc(crmClientId, mappedClient);
            syncLog.updated += 1;
          } else {
            crmClientId = await this.createOrFindClientViaGrpc(organisationId, mappedClient);
            syncLog.created += 1;
          }

          if (mappedClient.adresse) {
            try {
              await this.grpcClient.createAdresse({
                client_base_id: crmClientId,
                ligne1: mappedClient.adresse.ligne1,
                ligne2: mappedClient.adresse.ligne2 || undefined,
                code_postal: mappedClient.adresse.code_postal || undefined,
                ville: mappedClient.adresse.ville || undefined,
                pays: mappedClient.adresse.pays || undefined,
                type: 'PRINCIPALE',
              });
            } catch (adresseErr) {
              this.logger.warn(
                `Address creation skipped for client ${crmClientId}: ${adresseErr instanceof Error ? adresseErr.message : String(adresseErr)}`,
              );
            }
          }

          const contratIds = await this.syncProspectContrats(
            organisationId,
            prospect,
            crmClientId,
            commercialId,
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

      // === DELETE PHASE ===
      await this.deletePhase(organisationId, returnedProspectIds, dryRun, syncLog);

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

  // ============================================================================
  // DELETE PHASE
  // ============================================================================

  private async deletePhase(
    organisationId: string,
    returnedProspectIds: Set<number>,
    dryRun: boolean,
    syncLog: WinLeadPlusSyncLogEntity,
  ): Promise<void> {
    const allMappings = await this.mappingRepository.findAll({ organisationId });

    for (const mapping of allMappings) {
      if (returnedProspectIds.has(mapping.winleadplusProspectId)) {
        continue; // Still in the API, keep it
      }

      if (dryRun) {
        syncLog.deleted += 1;
        continue;
      }

      try {
        // 1. Delete contrats + their lignes (local DB)
        for (const contratId of mapping.crmContratIds || []) {
          await this.deleteContratWithDependencies(contratId);
        }

        // 2. Delete client via gRPC (service-core)
        try {
          await this.grpcClient.deleteClient({ id: mapping.crmClientId });
        } catch (deleteErr) {
          // Client may already be deleted — log and continue
          this.logger.warn(
            `Client delete skipped for ${mapping.crmClientId}: ${deleteErr instanceof Error ? deleteErr.message : String(deleteErr)}`,
          );
        }

        // 3. Delete the mapping
        await this.mappingRepository.delete(mapping.id);

        syncLog.deleted += 1;
        this.logger.log(
          `Deleted stale prospect ${mapping.winleadplusProspectId} → client ${mapping.crmClientId}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.pushSyncError(
          syncLog,
          String(mapping.winleadplusProspectId),
          `Delete failed: ${message}`,
        );
        this.logger.error(
          `Failed to delete stale prospect ${mapping.winleadplusProspectId}: ${message}`,
        );
      }
    }
  }

  private async deleteContratWithDependencies(contratId: string): Promise<void> {
    // Delete lignes first (child records)
    await this.ligneContratRepository.delete({ contratId });

    // Delete contrat
    try {
      await this.contratService.delete(contratId);
    } catch (err) {
      // Contrat may already be deleted
      const rpcErr = err as { code?: number };
      if (rpcErr?.code !== status.NOT_FOUND) {
        throw err;
      }
    }
  }

  // ============================================================================
  // CONTRAT SYNC
  // ============================================================================

  private async syncProspectContrats(
    organisationId: string,
    prospect: WinLeadPlusProspect,
    clientId: string,
    commercialId: string,
  ): Promise<string[]> {
    const souscriptions = this.normalizeSouscriptions(prospect);
    const contratIds: string[] = [];

    for (const souscription of souscriptions) {
      const contrats = this.normalizeContrats(souscription);

      for (const contrat of contrats) {
        try {
          const mapped = this.mapper.mapSouscriptionContratToContrat(
            contrat,
            souscription,
            clientId,
            commercialId,
          );
          const resolvedCommercialId = mapped.commercialId || commercialId || DEFAULT_UUID;

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
              commercialId: resolvedCommercialId,
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
              commercialId: resolvedCommercialId,
              notes,
            });
            contratId = created.id;
          }

          contratIds.push(contratId);

          if (souscription.offre) {
            const mappedLigne = this.mapper.mapSouscriptionOffreToLigneContrat(
              souscription.offre,
              contratId,
            );
            if (mappedLigne) {
              await this.syncContratLignesFromOffre(contratId, mappedLigne);
            }
          }
        } catch (contratErr) {
          this.logger.error(
            `Contrat sync failed for contrat ${(contrat as any).id ?? (contrat as any).idContrat ?? 'unknown'}: ${contratErr instanceof Error ? contratErr.message : String(contratErr)}`,
          );
          // Continue with next contrat — don't fail the whole prospect
        }
      }
    }

    return contratIds;
  }

  // ============================================================================
  // SOUSCRIPTION / CONTRAT NORMALIZATION
  // ============================================================================

  private normalizeSouscriptions(prospect: WinLeadPlusProspect): WinLeadPlusSouscription[] {
    const raw = prospect as Record<string, unknown>;
    const candidates = [
      prospect.Souscription,
      raw['souscription'],
      raw['souscriptions'],
      raw['Souscriptions'],
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length > 0) {
        return candidate;
      }
    }
    return [];
  }

  private normalizeContrats(souscription: WinLeadPlusSouscription): any[] {
    const raw = souscription as Record<string, unknown>;
    const candidates = [
      souscription.contrats,
      raw['Contrats'],
      raw['contrat'],
      raw['Contrat'],
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length > 0) {
        return candidate;
      }
    }
    return [];
  }

  // ============================================================================
  // CONFIG / STATUS / LOGS
  // ============================================================================

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

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

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

  private async createOrFindClientViaGrpc(
    organisationId: string,
    client: WinLeadPlusMappedClient,
  ): Promise<string> {
    const searchResult = await this.grpcClient.search({
      organisation_id: organisationId,
      telephone: client.telephone,
      nom: client.nom,
    });

    if (searchResult.found && searchResult.client?.id) {
      await this.grpcClient.update({
        id: searchResult.client.id,
        ...this.buildEnrichedClientPayload(client),
      });
      return searchResult.client.id;
    }

    try {
      const created = await this.grpcClient.create({
        organisation_id: organisationId,
        type_client: client.type_client,
        nom: client.nom,
        prenom: client.prenom,
        compte_code: client.compte_code,
        partenaire_id: client.partenaire_id || DEFAULT_UUID,
        telephone: client.telephone,
        email: client.email || undefined,
        statut: client.statut,
        canal_acquisition: client.canal_acquisition || undefined,
        source: client.source,
        ...this.buildEnrichedClientPayload(client),
      });

      return created.id;
    } catch (createErr: unknown) {
      const rpcErr = createErr as { code?: number; details?: string };
      if (rpcErr?.code === status.ALREADY_EXISTS) {
        for (const searchNom of [client.nom, '']) {
          try {
            const retrySearch = await this.grpcClient.search({
              organisation_id: organisationId,
              telephone: client.telephone,
              nom: searchNom,
            });
            if (retrySearch.found && retrySearch.client?.id) {
              await this.grpcClient.update({
                id: retrySearch.client.id,
                ...this.buildEnrichedClientPayload(client),
              });
              return retrySearch.client.id;
            }
          } catch {
            // search variant failed, try next
          }
        }
      }
      throw createErr;
    }
  }

  private async updateClientViaGrpc(clientId: string, client: WinLeadPlusMappedClient): Promise<void> {
    await this.grpcClient.update({
      id: clientId,
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      email: client.email || undefined,
      canal_acquisition: client.canal_acquisition || undefined,
      source: client.source,
      ...this.buildEnrichedClientPayload(client),
    });
  }

  private buildEnrichedClientPayload(client: WinLeadPlusMappedClient) {
    return {
      date_naissance: client.date_naissance || undefined,
      iban: client.iban || undefined,
      bic: client.bic || undefined,
      mandat_sepa: client.mandat_sepa,
      civilite: client.civilite || undefined,
      csp: client.csp || undefined,
      regime_social: client.regime_social || undefined,
      lieu_naissance: client.lieu_naissance || undefined,
      pays_naissance: client.pays_naissance || undefined,
      etape_courante: client.etape_courante || undefined,
      is_politically_exposed: client.is_politically_exposed,
      numss: client.numss || undefined,
    };
  }

  private async syncContratLignesFromOffre(
    contratId: string,
    mappedLigne: WinLeadPlusMappedLigneContrat,
  ): Promise<void> {
    await this.ligneContratRepository.delete({ contratId });

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

  private toText(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '';
  }
}

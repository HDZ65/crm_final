import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { DomainException, NatsService } from '@crm/shared-kernel';
import {
  AddressSnapshotEntity,
  FulfillmentBatchEntity,
  FulfillmentBatchLineEntity,
  FulfillmentBatchLineStatus,
  FulfillmentBatchStatus,
  FulfillmentCutoffConfigEntity,
  PreferenceSnapshotEntity,
} from '../entities';
import type {
  IFulfillmentBatchLineRepository,
  IFulfillmentBatchRepository,
  IFulfillmentCutoffConfigRepository,
} from '../repositories';

const SUBSCRIPTION_CHARGED_EVENT = 'SUBSCRIPTION_CHARGED';

export interface FulfillmentCreateExpeditionAddress {
  line1: string;
  line2?: string;
  postal_code: string;
  city: string;
  country: string;
}

export interface FulfillmentCreateExpeditionRequest {
  organisation_id: string;
  client_base_id: string;
  transporteur_compte_id: string;
  contrat_id?: string;
  reference_commande: string;
  produit_id?: string;
  nom_produit?: string;
  poids?: number;
  destination: FulfillmentCreateExpeditionAddress;
  date_expedition?: string;
  date_livraison_estimee?: string;
}

export interface FulfillmentDispatchMetadata {
  transporteurCompteId?: string;
  contratId?: string | null;
  nomProduit?: string;
  poids?: number;
  referenceCommande?: string;
}

export interface FulfillmentChargedSubscription extends FulfillmentDispatchMetadata {
  organisationId: string;
  societeId: string;
  subscriptionId: string;
  clientId: string;
  produitId: string;
  quantite: number;
}

export interface SubscriptionChargedEventPayload {
  organisationId?: string;
  societeId?: string;
  subscriptionId: string;
  clientId?: string;
  produitId?: string;
  quantite?: number;
  transporteurCompteId?: string;
  contratId?: string | null;
  nomProduit?: string;
  poids?: number;
  referenceCommande?: string;
}

export interface FulfillmentChargedSubscriptionSourcePort {
  listDueChargedSubscriptions(params: {
    organisationId: string;
    societeId: string;
    batchDate: Date;
  }): Promise<FulfillmentChargedSubscription[]>;

  findBySubscriptionId?(subscriptionId: string): Promise<FulfillmentChargedSubscription | null>;
}

export interface FulfillmentClientAddress {
  rue: string;
  codePostal: string;
  ville: string;
  pays: string;
}

export interface FulfillmentAddressSourcePort {
  getClientAddress(organisationId: string, clientId: string): Promise<FulfillmentClientAddress>;
}

export interface FulfillmentPreferenceSourcePort {
  getSubscriptionPreferences(
    organisationId: string,
    subscriptionId: string,
  ): Promise<Record<string, unknown>>;
}

export interface IFulfillmentAddressSnapshotRepository {
  create(params: {
    organisationId: string;
    clientId: string;
    rue: string;
    codePostal: string;
    ville: string;
    pays: string;
    capturedAt: Date;
  }): Promise<AddressSnapshotEntity>;

  findById(id: string): Promise<AddressSnapshotEntity | null>;
}

export interface IFulfillmentPreferenceSnapshotRepository {
  create(params: {
    organisationId: string;
    subscriptionId: string;
    preferenceData: Record<string, unknown>;
    capturedAt: Date;
  }): Promise<PreferenceSnapshotEntity>;
}

export interface FulfillmentExpeditionBridgePort {
  createExpedition(request: FulfillmentCreateExpeditionRequest): Promise<{ id: string }>;
}

export interface FulfillmentBatchServiceOptions {
  now?: () => Date;
  resolveOrganisationIdForSociete?: (societeId: string) => Promise<string | null>;
  defaultOrganisationId?: string;
  defaultTransporteurCompteId?: string;
}

@Injectable()
export class FulfillmentBatchService implements OnModuleInit {
  private readonly logger = new Logger(FulfillmentBatchService.name);
  private readonly pendingCandidatesByBatchId = new Map<
    string,
    Map<string, FulfillmentChargedSubscription>
  >();
  private readonly dispatchMetadataByLineId = new Map<string, FulfillmentDispatchMetadata>();

  constructor(
    private readonly batchRepository: IFulfillmentBatchRepository,
    private readonly batchLineRepository: IFulfillmentBatchLineRepository,
    private readonly cutoffConfigRepository: IFulfillmentCutoffConfigRepository,
    private readonly addressSnapshotRepository: IFulfillmentAddressSnapshotRepository,
    private readonly preferenceSnapshotRepository: IFulfillmentPreferenceSnapshotRepository,
    private readonly chargedSubscriptionSource: FulfillmentChargedSubscriptionSourcePort,
    private readonly addressSource: FulfillmentAddressSourcePort,
    private readonly preferenceSource: FulfillmentPreferenceSourcePort,
    private readonly expeditionBridge: FulfillmentExpeditionBridgePort,
    @Optional() private readonly natsService?: NatsService,
    private readonly options: FulfillmentBatchServiceOptions = {},
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.natsService || !this.natsService.isConnected()) {
      return;
    }

    await this.natsService.subscribe<SubscriptionChargedEventPayload>(
      SUBSCRIPTION_CHARGED_EVENT,
      async (payload) => {
        await this.handleSubscriptionCharged(payload);
      },
    );
  }

  async createBatch(organisationId: string, societeId: string): Promise<FulfillmentBatchEntity> {
    return this.batchRepository.create({
      organisationId,
      societeId,
      batchDate: this.now(),
      status: FulfillmentBatchStatus.OPEN,
    });
  }

  async getOpenBatch(societeId: string): Promise<FulfillmentBatchEntity> {
    return this.getOrCreateOpenBatch(societeId);
  }

  async lockBatch(batchId: string): Promise<FulfillmentBatchEntity> {
    const batch = await this.requireBatch(batchId);
    this.assertTransition(batch, FulfillmentBatchStatus.OPEN, FulfillmentBatchStatus.LOCKED);

    const dueCandidates = await this.chargedSubscriptionSource.listDueChargedSubscriptions({
      organisationId: batch.organisationId,
      societeId: batch.societeId,
      batchDate: batch.batchDate,
    });
    const pendingCandidates = this.consumePendingCandidates(batch.id);
    const candidates = this.mergeCandidates(dueCandidates, pendingCandidates);

    const capturedAt = this.now();
    let createdLineCount = 0;

    for (const candidate of candidates) {
      const address = await this.addressSource.getClientAddress(
        batch.organisationId,
        candidate.clientId,
      );
      const preferences = await this.preferenceSource.getSubscriptionPreferences(
        batch.organisationId,
        candidate.subscriptionId,
      );

      const addressSnapshot = await this.addressSnapshotRepository.create({
        organisationId: batch.organisationId,
        clientId: candidate.clientId,
        rue: address.rue,
        codePostal: address.codePostal,
        ville: address.ville,
        pays: address.pays,
        capturedAt,
      });

      const preferenceSnapshot = await this.preferenceSnapshotRepository.create({
        organisationId: batch.organisationId,
        subscriptionId: candidate.subscriptionId,
        preferenceData: this.cloneRecord(preferences),
        capturedAt,
      });

      const line = await this.batchLineRepository.create({
        organisationId: batch.organisationId,
        batchId: batch.id,
        subscriptionId: candidate.subscriptionId,
        clientId: candidate.clientId,
        produitId: candidate.produitId,
        quantite: candidate.quantite,
        addressSnapshotId: addressSnapshot.id,
        preferenceSnapshotId: preferenceSnapshot.id,
        lineStatus: FulfillmentBatchLineStatus.TO_PREPARE,
      });

      this.dispatchMetadataByLineId.set(line.id, {
        transporteurCompteId: candidate.transporteurCompteId,
        contratId: candidate.contratId,
        nomProduit: candidate.nomProduit,
        poids: candidate.poids,
        referenceCommande: candidate.referenceCommande,
      });

      createdLineCount += 1;
    }

    return this.batchRepository.update(batch.id, {
      status: FulfillmentBatchStatus.LOCKED,
      lockedAt: capturedAt,
      lineCount: createdLineCount,
    });
  }

  async dispatchBatch(batchId: string): Promise<FulfillmentBatchEntity> {
    const batch = await this.requireBatch(batchId);
    this.assertTransition(batch, FulfillmentBatchStatus.LOCKED, FulfillmentBatchStatus.DISPATCHED);

    const { lines } = await this.batchLineRepository.findByBatchId(batch.id);

    for (const line of lines) {
      const addressSnapshot = await this.addressSnapshotRepository.findById(line.addressSnapshotId);
      if (!addressSnapshot) {
        throw new DomainException(
          `Address snapshot ${line.addressSnapshotId} not found`,
          'FULFILLMENT_ADDRESS_SNAPSHOT_NOT_FOUND',
          {
            lineId: line.id,
            snapshotId: line.addressSnapshotId,
          },
        );
      }

      const expedition = await this.expeditionBridge.createExpedition(
        this.toCreateExpeditionRequest(batch, line, addressSnapshot),
      );

      await this.batchLineRepository.update(line.id, {
        lineStatus: FulfillmentBatchLineStatus.SHIPPED,
        expeditionId: expedition.id,
        errorMessage: null,
      });
    }

    return this.batchRepository.update(batch.id, {
      status: FulfillmentBatchStatus.DISPATCHED,
      dispatchedAt: this.now(),
    });
  }

  async completeBatch(batchId: string): Promise<FulfillmentBatchEntity> {
    const batch = await this.requireBatch(batchId);
    this.assertTransition(batch, FulfillmentBatchStatus.DISPATCHED, FulfillmentBatchStatus.COMPLETED);

    return this.batchRepository.update(batch.id, {
      status: FulfillmentBatchStatus.COMPLETED,
      completedAt: this.now(),
    });
  }

  async handleSubscriptionCharged(payload: SubscriptionChargedEventPayload): Promise<void> {
    const candidate = await this.resolveCandidateFromChargedEvent(payload);
    const openBatch = await this.getOrCreateOpenBatch(candidate.societeId, candidate.organisationId);

    const pendingCount = this.enqueuePendingCandidate(openBatch.id, candidate);

    await this.batchRepository.update(openBatch.id, {
      lineCount: pendingCount,
    });
  }

  async runCutoffJob(
    organisationId: string,
    referenceDate: Date = this.now(),
  ): Promise<FulfillmentBatchEntity[]> {
    const configs = await this.cutoffConfigRepository.findActiveByOrganisationId(organisationId);
    const lockedBatches: FulfillmentBatchEntity[] = [];

    for (const config of configs) {
      if (!this.isCutoffReached(config, referenceDate)) {
        continue;
      }

      const openBatch = await this.batchRepository.findOpenBySocieteId(config.societeId);
      if (!openBatch) {
        continue;
      }

      const lockedBatch = await this.lockBatch(openBatch.id);
      lockedBatches.push(lockedBatch);
      this.logger.log(`Batch ${lockedBatch.id} auto-locked for societe ${config.societeId}`);
    }

    return lockedBatches;
  }

  private async getOrCreateOpenBatch(
    societeId: string,
    organisationId?: string,
  ): Promise<FulfillmentBatchEntity> {
    const existing = await this.batchRepository.findOpenBySocieteId(societeId);
    if (existing) {
      return existing;
    }

    const resolvedOrganisationId =
      organisationId || (await this.resolveOrganisationIdForSociete(societeId));
    return this.createBatch(resolvedOrganisationId, societeId);
  }

  private async resolveOrganisationIdForSociete(societeId: string): Promise<string> {
    if (this.options.resolveOrganisationIdForSociete) {
      const resolved = await this.options.resolveOrganisationIdForSociete(societeId);
      if (resolved) {
        return resolved;
      }
    }

    const configs = await this.cutoffConfigRepository.findBySocieteId(societeId);
    if (configs.length > 0) {
      const activeConfig = configs.find((config) => config.active) || configs[0];
      return activeConfig.organisationId;
    }

    if (this.options.defaultOrganisationId) {
      return this.options.defaultOrganisationId;
    }

    throw new DomainException(
      `Cannot resolve organisation for societe ${societeId}`,
      'FULFILLMENT_ORGANISATION_NOT_RESOLVED',
      { societeId },
    );
  }

  private async requireBatch(batchId: string): Promise<FulfillmentBatchEntity> {
    const batch = await this.batchRepository.findById(batchId);
    if (!batch) {
      throw new DomainException(`Batch ${batchId} not found`, 'FULFILLMENT_BATCH_NOT_FOUND', {
        batchId,
      });
    }
    return batch;
  }

  private assertTransition(
    batch: FulfillmentBatchEntity,
    expectedStatus: FulfillmentBatchStatus,
    targetStatus: FulfillmentBatchStatus,
  ): void {
    if (batch.status === expectedStatus) {
      return;
    }

    throw new DomainException(
      `Invalid transition from ${batch.status} to ${targetStatus}`,
      'FULFILLMENT_INVALID_TRANSITION',
      {
        batchId: batch.id,
        currentStatus: batch.status,
        expectedStatus,
        targetStatus,
      },
    );
  }

  private mergeCandidates(
    dueCandidates: FulfillmentChargedSubscription[],
    pendingCandidates: FulfillmentChargedSubscription[],
  ): FulfillmentChargedSubscription[] {
    const bySubscriptionId = new Map<string, FulfillmentChargedSubscription>();

    for (const candidate of dueCandidates) {
      bySubscriptionId.set(candidate.subscriptionId, candidate);
    }

    for (const candidate of pendingCandidates) {
      bySubscriptionId.set(candidate.subscriptionId, candidate);
    }

    return Array.from(bySubscriptionId.values());
  }

  private enqueuePendingCandidate(batchId: string, candidate: FulfillmentChargedSubscription): number {
    let bySubscriptionId = this.pendingCandidatesByBatchId.get(batchId);

    if (!bySubscriptionId) {
      bySubscriptionId = new Map<string, FulfillmentChargedSubscription>();
      this.pendingCandidatesByBatchId.set(batchId, bySubscriptionId);
    }

    bySubscriptionId.set(candidate.subscriptionId, candidate);
    return bySubscriptionId.size;
  }

  private consumePendingCandidates(batchId: string): FulfillmentChargedSubscription[] {
    const bySubscriptionId = this.pendingCandidatesByBatchId.get(batchId);
    if (!bySubscriptionId) {
      return [];
    }

    this.pendingCandidatesByBatchId.delete(batchId);
    return Array.from(bySubscriptionId.values());
  }

  private async resolveCandidateFromChargedEvent(
    payload: SubscriptionChargedEventPayload,
  ): Promise<FulfillmentChargedSubscription> {
    const fromSource = this.chargedSubscriptionSource.findBySubscriptionId
      ? await this.chargedSubscriptionSource.findBySubscriptionId(payload.subscriptionId)
      : null;

    const organisationId = payload.organisationId || fromSource?.organisationId;
    const societeId = payload.societeId || fromSource?.societeId;
    const clientId = payload.clientId || fromSource?.clientId;
    const produitId = payload.produitId || fromSource?.produitId;
    const quantite = payload.quantite ?? fromSource?.quantite;

    if (!organisationId || !societeId || !clientId || !produitId || quantite === undefined) {
      throw new DomainException(
        `SUBSCRIPTION_CHARGED payload is incomplete for subscription ${payload.subscriptionId}`,
        'FULFILLMENT_SUBSCRIPTION_CHARGED_PAYLOAD_INVALID',
        {
          payload,
        },
      );
    }

    return {
      organisationId,
      societeId,
      subscriptionId: payload.subscriptionId,
      clientId,
      produitId,
      quantite,
      transporteurCompteId: payload.transporteurCompteId || fromSource?.transporteurCompteId,
      contratId: payload.contratId ?? fromSource?.contratId,
      nomProduit: payload.nomProduit || fromSource?.nomProduit,
      poids: payload.poids ?? fromSource?.poids,
      referenceCommande: payload.referenceCommande || fromSource?.referenceCommande,
    };
  }

  private toCreateExpeditionRequest(
    batch: FulfillmentBatchEntity,
    line: FulfillmentBatchLineEntity,
    addressSnapshot: AddressSnapshotEntity,
  ): FulfillmentCreateExpeditionRequest {
    const metadata = this.dispatchMetadataByLineId.get(line.id);
    const transporteurCompteId =
      metadata?.transporteurCompteId || this.options.defaultTransporteurCompteId;

    if (!transporteurCompteId) {
      throw new DomainException(
        `No transporteur_compte_id found for line ${line.id}`,
        'FULFILLMENT_TRANSPORTEUR_ACCOUNT_REQUIRED',
        {
          batchId: batch.id,
          lineId: line.id,
        },
      );
    }

    return {
      organisation_id: batch.organisationId,
      client_base_id: line.clientId,
      transporteur_compte_id: transporteurCompteId,
      contrat_id: metadata?.contratId || undefined,
      reference_commande: metadata?.referenceCommande || `${batch.id}-${line.id}`,
      produit_id: line.produitId,
      nom_produit: metadata?.nomProduit,
      poids: metadata?.poids,
      destination: {
        line1: addressSnapshot.rue,
        postal_code: addressSnapshot.codePostal,
        city: addressSnapshot.ville,
        country: addressSnapshot.pays,
      },
      date_expedition: this.now().toISOString(),
    };
  }

  private isCutoffReached(config: FulfillmentCutoffConfigEntity, referenceDate: Date): boolean {
    const cutoffMinutes = this.parseCutoffTime(config.cutoffTime);
    const current = this.getZonedDayAndMinutes(referenceDate, config.timezone);

    if (current.dayOfWeek > config.cutoffDayOfWeek) {
      return true;
    }

    if (current.dayOfWeek < config.cutoffDayOfWeek) {
      return false;
    }

    return current.minutes >= cutoffMinutes;
  }

  private parseCutoffTime(cutoffTime: string): number {
    const parts = cutoffTime.split(':');
    if (parts.length !== 2) {
      throw new DomainException(`Invalid cutoff_time: ${cutoffTime}`, 'FULFILLMENT_CUTOFF_TIME_INVALID', {
        cutoffTime,
      });
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new DomainException(`Invalid cutoff_time: ${cutoffTime}`, 'FULFILLMENT_CUTOFF_TIME_INVALID', {
        cutoffTime,
      });
    }

    return hours * 60 + minutes;
  }

  private getZonedDayAndMinutes(
    referenceDate: Date,
    timezone: string,
  ): { dayOfWeek: number; minutes: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(referenceDate);

    const weekdayToken = parts.find((part) => part.type === 'weekday')?.value;
    const hourToken = parts.find((part) => part.type === 'hour')?.value;
    const minuteToken = parts.find((part) => part.type === 'minute')?.value;

    if (!weekdayToken || hourToken === undefined || minuteToken === undefined) {
      throw new DomainException(
        `Unable to evaluate cutoff time in timezone ${timezone}`,
        'FULFILLMENT_CUTOFF_TIMEZONE_EVAL_FAILED',
        {
          timezone,
        },
      );
    }

    const dayOfWeek = this.weekdayToMondayIndex(weekdayToken);
    const hours = Number(hourToken) % 24;
    const minutes = Number(minuteToken);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      throw new DomainException(
        `Unable to parse time in timezone ${timezone}`,
        'FULFILLMENT_CUTOFF_TIMEZONE_PARSE_FAILED',
        {
          timezone,
          hourToken,
          minuteToken,
        },
      );
    }

    return {
      dayOfWeek,
      minutes: hours * 60 + minutes,
    };
  }

  private weekdayToMondayIndex(weekdayToken: string): number {
    const mapping: Record<string, number> = {
      Mon: 0,
      Tue: 1,
      Wed: 2,
      Thu: 3,
      Fri: 4,
      Sat: 5,
      Sun: 6,
    };

    const mapped = mapping[weekdayToken];
    if (mapped === undefined) {
      throw new DomainException(
        `Unsupported weekday token: ${weekdayToken}`,
        'FULFILLMENT_WEEKDAY_TOKEN_UNSUPPORTED',
        {
          weekdayToken,
        },
      );
    }

    return mapped;
  }

  private now(): Date {
    return this.options.now?.() || new Date();
  }

  private cloneRecord(source: Record<string, unknown>): Record<string, unknown> {
    return JSON.parse(JSON.stringify(source)) as Record<string, unknown>;
  }
}

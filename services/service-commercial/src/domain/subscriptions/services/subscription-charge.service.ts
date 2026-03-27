import { credentials, type ServiceError } from '@grpc/grpc-js';
import {
  IdempotenceService,
  type IdempotenceStore,
  getServiceUrl,
  loadGrpcPackage,
  NatsService,
} from '@crm/shared-kernel';
import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  StoreSource,
  SubscriptionPlanType,
  SubscriptionStatus,
  type SubscriptionEntity,
} from '../entities/subscription.entity';
import { SubscriptionTriggeredBy } from '../entities/subscription-history.entity';
import type { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';

const SUBSCRIPTION_CHARGED_EVENT = 'SUBSCRIPTION_CHARGED';
const SUBSCRIPTION_CHARGE_FAILED_EVENT = 'SUBSCRIPTION_CHARGE_FAILED';
const SUBSCRIPTION_CHARGE_IDEMPOTENCE_EVENT = 'SUBSCRIPTION_CHARGE';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_PSP_NAME = 'GOCARDLESS';

const DEFAULT_FACTURE_STATUT_ID = 'SUBSCRIPTION_PENDING';
const DEFAULT_FACTURE_EMISSION_ID = 'SUBSCRIPTION_AUTO';
const DEFAULT_FACTURE_ADRESSE_ID = '';
const DEFAULT_FACTURE_PRODUIT_ID = '';
const DEFAULT_FACTURE_TAUX_TVA = 20;

const WEB_DIRECT_SOURCES = new Set<StoreSource>([StoreSource.WEB_DIRECT, StoreSource.NONE]);

export interface SubscriptionChargeSchedulingPort {
  getDueSubscriptions(organisationId: string, beforeDate: Date): Promise<SubscriptionEntity[]>;
  calculateNextChargeAt(frequency: string, currentPeriodEnd: Date | string): Date | string;
}

export interface CreateSubscriptionPaymentIntentInput {
  organisationId: string;
  societeId: string;
  clientId: string;
  pspName: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
}

export interface SubscriptionPaymentIntent {
  id: string;
  status?: string;
  pspPaymentId?: string;
}

export interface SubscriptionPaymentClient {
  createPaymentIntent(input: CreateSubscriptionPaymentIntentInput): Promise<SubscriptionPaymentIntent>;
}

export interface CreateSubscriptionFactureInput {
  organisationId: string;
  dateEmission: string;
  clientBaseId: string;
  contratId: string | null;
  amount: number;
  currency: string;
  subscriptionId: string;
}

export interface SubscriptionFacture {
  id: string;
  numero?: string;
}

export interface SubscriptionFactureClient {
  createFacture(input: CreateSubscriptionFactureInput): Promise<SubscriptionFacture>;
}

export interface SubscriptionChargeOptions {
  maxRetries?: number;
  pspName?: string;
  now?: () => Date;
  resolveSocieteId?: (subscription: SubscriptionEntity) => string;
}

export interface SubscriptionChargeResult {
  subscriptionId: string;
  idempotencyKey: string;
  status: 'CHARGED' | 'FAILED' | 'SKIPPED';
  paymentIntentId?: string;
  invoiceId?: string;
  retryCount?: number;
  reason?: string;
}

export interface ChargeResult {
  processedCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  results: SubscriptionChargeResult[];
}

export type SubscriptionChargeBatchResult = ChargeResult;

interface CreatePaymentIntentGrpcRequest {
  organisation_id: string;
  societe_id: string;
  client_id?: string;
  psp_name: string;
  amount: number;
  currency: string;
  idempotency_key?: string;
  metadata: Record<string, string>;
}

interface PaymentIntentGrpcResponse {
  id: string;
  status?: string;
  psp_payment_id?: string;
}

interface PaymentServiceGrpcContract {
  CreatePaymentIntent(
    request: CreatePaymentIntentGrpcRequest,
    callback: (error: ServiceError | null, response?: PaymentIntentGrpcResponse) => void,
  ): void;
}

interface CreateFactureGrpcLine {
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
  description: string;
  taux_tva: number;
}

interface CreateFactureGrpcRequest {
  organisation_id: string;
  date_emission: string;
  statut_id: string;
  emission_facture_id: string;
  client_base_id: string;
  contrat_id: string;
  client_partenaire_id: string;
  adresse_facturation_id: string;
  lignes: CreateFactureGrpcLine[];
}

interface CreateFactureGrpcResponse {
  id: string;
  numero?: string;
}

interface FactureServiceGrpcContract {
  Create(
    request: CreateFactureGrpcRequest,
    callback: (error: ServiceError | null, response?: CreateFactureGrpcResponse) => void,
  ): void;
}

function resolvePaymentGrpcUrl(): string {
  return process.env.FINANCE_GRPC_URL || process.env.PAYMENTS_GRPC_URL || getServiceUrl('payments');
}

function resolveFactureGrpcUrl(): string {
  return process.env.FINANCE_GRPC_URL || process.env.FACTURES_GRPC_URL || getServiceUrl('factures');
}

export class PaymentServiceGrpcClient implements SubscriptionPaymentClient {
  private readonly client: PaymentServiceGrpcContract;

  constructor(url: string = resolvePaymentGrpcUrl()) {
    const grpcPackage = loadGrpcPackage('payments');
    const PaymentServiceConstructor = grpcPackage?.payment?.PaymentService;

    if (!PaymentServiceConstructor) {
      throw new Error('PaymentService gRPC constructor not found in payments proto package');
    }

    this.client = new PaymentServiceConstructor(url, credentials.createInsecure());
  }

  async createPaymentIntent(
    input: CreateSubscriptionPaymentIntentInput,
  ): Promise<SubscriptionPaymentIntent> {
    const request: CreatePaymentIntentGrpcRequest = {
      organisation_id: input.organisationId,
      societe_id: input.societeId,
      client_id: input.clientId,
      psp_name: input.pspName,
      amount: input.amount,
      currency: input.currency,
      idempotency_key: input.idempotencyKey,
      metadata: input.metadata,
    };

    const response = await new Promise<PaymentIntentGrpcResponse>((resolve, reject) => {
      this.client.CreatePaymentIntent(request, (error, payload) => {
        if (error) {
          reject(error);
          return;
        }

        if (!payload) {
          reject(new Error('CreatePaymentIntent returned an empty response'));
          return;
        }

        resolve(payload);
      });
    });

    return {
      id: response.id,
      status: response.status,
      pspPaymentId: response.psp_payment_id,
    };
  }
}

export interface FactureServiceGrpcClientOptions {
  url?: string;
  statutId?: string;
  emissionFactureId?: string;
  adresseFacturationId?: string;
  defaultProduitId?: string;
  defaultTauxTva?: number;
}

export class FactureServiceGrpcClient implements SubscriptionFactureClient {
  private readonly client: FactureServiceGrpcContract;
  private readonly statutId: string;
  private readonly emissionFactureId: string;
  private readonly adresseFacturationId: string;
  private readonly defaultProduitId: string;
  private readonly defaultTauxTva: number;

  constructor(options: FactureServiceGrpcClientOptions = {}) {
    const grpcPackage = loadGrpcPackage('factures');
    const FactureServiceConstructor = grpcPackage?.factures?.FactureService;

    if (!FactureServiceConstructor) {
      throw new Error('FactureService gRPC constructor not found in factures proto package');
    }

    const url = options.url || resolveFactureGrpcUrl();

    this.client = new FactureServiceConstructor(url, credentials.createInsecure());
    this.statutId =
      options.statutId || process.env.SUBSCRIPTION_FACTURE_STATUT_ID || DEFAULT_FACTURE_STATUT_ID;
    this.emissionFactureId =
      options.emissionFactureId ||
      process.env.SUBSCRIPTION_FACTURE_EMISSION_ID ||
      DEFAULT_FACTURE_EMISSION_ID;
    this.adresseFacturationId =
      options.adresseFacturationId ||
      process.env.SUBSCRIPTION_FACTURE_ADRESSE_ID ||
      DEFAULT_FACTURE_ADRESSE_ID;
    this.defaultProduitId =
      options.defaultProduitId ||
      process.env.SUBSCRIPTION_FACTURE_PRODUIT_ID ||
      DEFAULT_FACTURE_PRODUIT_ID;

    const parsedTauxTva = Number(
      options.defaultTauxTva ??
        process.env.SUBSCRIPTION_FACTURE_TAUX_TVA ??
        DEFAULT_FACTURE_TAUX_TVA,
    );
    this.defaultTauxTva = Number.isNaN(parsedTauxTva)
      ? DEFAULT_FACTURE_TAUX_TVA
      : parsedTauxTva;
  }

  async createFacture(input: CreateSubscriptionFactureInput): Promise<SubscriptionFacture> {
    const request: CreateFactureGrpcRequest = {
      organisation_id: input.organisationId,
      date_emission: input.dateEmission,
      statut_id: this.statutId,
      emission_facture_id: this.emissionFactureId,
      client_base_id: input.clientBaseId,
      contrat_id: input.contratId || '',
      client_partenaire_id: '',
      adresse_facturation_id: this.adresseFacturationId,
      lignes: [
        {
          produit_id: this.defaultProduitId,
          quantite: 1,
          prix_unitaire: this.round(input.amount),
          description: `Abonnement ${input.subscriptionId} (${input.currency})`,
          taux_tva: this.defaultTauxTva,
        },
      ],
    };

    const response = await new Promise<CreateFactureGrpcResponse>((resolve, reject) => {
      this.client.Create(request, (error, payload) => {
        if (error) {
          reject(error);
          return;
        }

        if (!payload) {
          reject(new Error('CreateFacture returned an empty response'));
          return;
        }

        resolve(payload);
      });
    });

    return {
      id: response.id,
      numero: response.numero,
    };
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}

export class InMemorySubscriptionChargeIdempotencyStore implements IdempotenceStore {
  private readonly keys = new Set<string>();

  async isEventProcessed(eventId: string): Promise<boolean> {
    return this.keys.has(eventId);
  }

  async markEventProcessed(eventId: string): Promise<void> {
    this.keys.add(eventId);
  }
}

type ChargeFailureTransitionPolicy = 'ON_MAX_RETRIES' | 'ALWAYS';

interface ProcessSubscriptionChargeOptions {
  allowedStatuses: SubscriptionStatus[];
  failureTransitionPolicy: ChargeFailureTransitionPolicy;
  failureReason: string;
  source: 'RECURRING' | 'TRIAL_CONVERSION';
}

@Injectable()
export class SubscriptionChargeService {
  private readonly logger = new Logger(SubscriptionChargeService.name);
  private readonly idempotenceService: IdempotenceService;

  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly schedulingService: SubscriptionChargeSchedulingPort,
    private readonly lifecycleService: SubscriptionLifecycleService,
    private readonly paymentClient: SubscriptionPaymentClient = new PaymentServiceGrpcClient(),
    private readonly factureClient: SubscriptionFactureClient = new FactureServiceGrpcClient(),
    private readonly idempotencyStore: IdempotenceStore =
      new InMemorySubscriptionChargeIdempotencyStore(),
    @Optional() private readonly natsService?: NatsService,
    private readonly options: SubscriptionChargeOptions = {},
  ) {
    this.idempotenceService = new IdempotenceService(this.idempotencyStore);
  }

  async processCharges(organisationId: string): Promise<ChargeResult> {
    const now = this.now();
    const dueSubscriptions = await this.schedulingService.getDueSubscriptions(organisationId, now);
    const results: SubscriptionChargeResult[] = [];

    for (const subscription of dueSubscriptions) {
      if (subscription.organisationId !== organisationId) {
        results.push(
          this.buildSkippedResult(
            subscription.id,
            this.safeIdempotencyKey(subscription),
            'ORGANISATION_MISMATCH',
          ),
        );
        continue;
      }

      const result = await this.processSubscriptionCharge(subscription, now, {
        allowedStatuses: [SubscriptionStatus.ACTIVE],
        failureTransitionPolicy: 'ON_MAX_RETRIES',
        failureReason: 'recurring_charge_failed',
        source: 'RECURRING',
      });

      results.push(result);
    }

    return this.buildBatchResult(results);
  }

  async chargeTrialConversion(subscription: SubscriptionEntity): Promise<SubscriptionChargeResult> {
    return this.processSubscriptionCharge(subscription, this.now(), {
      allowedStatuses: [SubscriptionStatus.TRIAL],
      failureTransitionPolicy: 'ALWAYS',
      failureReason: 'trial_conversion_payment_failed',
      source: 'TRIAL_CONVERSION',
    });
  }

  private async processSubscriptionCharge(
    subscription: SubscriptionEntity,
    now: Date,
    options: ProcessSubscriptionChargeOptions,
  ): Promise<SubscriptionChargeResult> {
    if (!this.isWebDirectSubscription(subscription)) {
      return this.buildSkippedResult(
        subscription.id,
        this.safeIdempotencyKey(subscription),
        'STORE_SOURCE_EXCLUDED',
      );
    }

    if (subscription.planType === SubscriptionPlanType.FREE_AVOD) {
      return this.buildSkippedResult(
        subscription.id,
        this.safeIdempotencyKey(subscription),
        'FREE_PLAN_NO_CHARGE',
      );
    }

    const status = subscription.status as SubscriptionStatus;
    if (!options.allowedStatuses.includes(status)) {
      return this.buildSkippedResult(
        subscription.id,
        this.safeIdempotencyKey(subscription),
        'STATUS_NOT_ELIGIBLE',
      );
    }

    if (!subscription.nextChargeAt) {
      return this.buildSkippedResult(
        subscription.id,
        this.safeIdempotencyKey(subscription),
        'NEXT_CHARGE_AT_MISSING',
      );
    }

    const idempotencyKey = this.buildIdempotencyKey(subscription.id, subscription.nextChargeAt);
    const alreadyProcessed = await this.idempotenceService.isProcessed(idempotencyKey);

    if (alreadyProcessed) {
      return this.buildSkippedResult(subscription.id, idempotencyKey, 'ALREADY_CHARGED');
    }

    try {
      const paymentIntent = await this.paymentClient.createPaymentIntent(
        this.buildPaymentIntentInput(subscription, idempotencyKey),
      );

      const chargedAt = now.toISOString();
      const nextChargeAt = this.schedulingService.calculateNextChargeAt(
        subscription.frequency,
        this.toIsoDate(subscription.nextChargeAt),
      );

      subscription.nextChargeAt = this.toDate(nextChargeAt, 'nextChargeAt');
      subscription.retryCount = 0;

      const savedSubscription = await this.subscriptionRepository.save(subscription);

      const facture = await this.factureClient.createFacture({
        organisationId: savedSubscription.organisationId,
        dateEmission: chargedAt,
        clientBaseId: savedSubscription.clientId,
        contratId: savedSubscription.contratId,
        amount: Number(savedSubscription.amount || 0),
        currency: savedSubscription.currency || 'EUR',
        subscriptionId: savedSubscription.id,
      });

      await this.idempotenceService.markProcessed(
        idempotencyKey,
        SUBSCRIPTION_CHARGE_IDEMPOTENCE_EVENT,
      );

      await this.publishEvent(SUBSCRIPTION_CHARGED_EVENT, {
        subscriptionId: savedSubscription.id,
        organisationId: savedSubscription.organisationId,
        clientId: savedSubscription.clientId,
        amount: Number(savedSubscription.amount || 0),
        currency: savedSubscription.currency || 'EUR',
        invoiceId: facture.id,
        paymentIntentId: paymentIntent.id,
        idempotencyKey,
        chargedAt,
        nextChargeAt: savedSubscription.nextChargeAt
          ? this.toIsoDate(savedSubscription.nextChargeAt)
          : null,
        source: options.source,
      });

      return {
        subscriptionId: savedSubscription.id,
        idempotencyKey,
        status: 'CHARGED',
        paymentIntentId: paymentIntent.id,
        invoiceId: facture.id,
      };
    } catch (error) {
      const reason = this.errorMessage(error);
      const nextRetryCount = Number(subscription.retryCount || 0) + 1;

      subscription.retryCount = nextRetryCount;
      let savedSubscription = await this.subscriptionRepository.save(subscription);

      if (this.shouldTransitionToPastDue(options.failureTransitionPolicy, nextRetryCount)) {
        savedSubscription = await this.lifecycleService.markPastDue(savedSubscription.id, {
          reason: options.failureReason,
          triggeredBy: SubscriptionTriggeredBy.DUNNING,
          metadata: {
            source: options.source,
            retryCount: nextRetryCount,
            maxRetries: this.maxRetries(),
            idempotencyKey,
            failure: reason,
          },
        });
      }

      await this.publishEvent(SUBSCRIPTION_CHARGE_FAILED_EVENT, {
        subscriptionId: savedSubscription.id,
        organisationId: savedSubscription.organisationId,
        clientId: savedSubscription.clientId,
        amount: Number(savedSubscription.amount || 0),
        currency: savedSubscription.currency || 'EUR',
        idempotencyKey,
        retryCount: nextRetryCount,
        maxRetries: this.maxRetries(),
        status: savedSubscription.status,
        reason,
        failedAt: now.toISOString(),
        source: options.source,
      });

      return {
        subscriptionId: savedSubscription.id,
        idempotencyKey,
        status: 'FAILED',
        retryCount: nextRetryCount,
        reason,
      };
    }
  }

  private buildPaymentIntentInput(
    subscription: SubscriptionEntity,
    idempotencyKey: string,
  ): CreateSubscriptionPaymentIntentInput {
    return {
      organisationId: subscription.organisationId,
      societeId: this.resolveSocieteId(subscription),
      clientId: subscription.clientId,
      pspName: this.pspName(),
      amount: this.toMinorUnits(subscription.amount),
      currency: subscription.currency || 'EUR',
      idempotencyKey,
      metadata: {
        subscription_id: subscription.id,
        next_charge_at: this.toIsoDate(subscription.nextChargeAt),
      },
    };
  }

  private buildBatchResult(results: SubscriptionChargeResult[]): ChargeResult {
    return {
      processedCount: results.filter((result) => result.status !== 'SKIPPED').length,
      successCount: results.filter((result) => result.status === 'CHARGED').length,
      failedCount: results.filter((result) => result.status === 'FAILED').length,
      skippedCount: results.filter((result) => result.status === 'SKIPPED').length,
      results,
    };
  }

  private buildSkippedResult(
    subscriptionId: string,
    idempotencyKey: string,
    reason: string,
  ): SubscriptionChargeResult {
    return {
      subscriptionId,
      idempotencyKey,
      status: 'SKIPPED',
      reason,
    };
  }

  private isWebDirectSubscription(subscription: SubscriptionEntity): boolean {
    const normalized = this.normalizeStoreSource(subscription.storeSource);
    return WEB_DIRECT_SOURCES.has(normalized);
  }

  private normalizeStoreSource(value: StoreSource | string | null | undefined): StoreSource {
    const normalized = String(value || StoreSource.NONE).trim().toUpperCase();
    if (Object.values(StoreSource).includes(normalized as StoreSource)) {
      return normalized as StoreSource;
    }
    return StoreSource.NONE;
  }

  private safeIdempotencyKey(subscription: SubscriptionEntity): string {
    if (!subscription.nextChargeAt) {
      return `${subscription.id}-NO_NEXT_CHARGE_AT`;
    }
    return this.buildIdempotencyKey(subscription.id, subscription.nextChargeAt);
  }

  private shouldTransitionToPastDue(
    policy: ChargeFailureTransitionPolicy,
    retryCount: number,
  ): boolean {
    if (policy === 'ALWAYS') {
      return true;
    }
    return retryCount >= this.maxRetries();
  }

  private buildIdempotencyKey(subscriptionId: string, nextChargeAt: Date | string): string {
    return `${subscriptionId}-${this.toIsoDate(nextChargeAt)}`;
  }

  private toIsoDate(value: Date | string | null): string {
    const date = this.toDate(value, 'date');
    return date.toISOString();
  }

  private toDate(value: Date | string | null, field: string): Date {
    if (!value) {
      throw new Error(`${field} must be provided`);
    }

    const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid ${field}`);
    }

    return parsed;
  }

  private now(): Date {
    return this.options.now?.() || new Date();
  }

  private pspName(): string {
    return this.options.pspName || DEFAULT_PSP_NAME;
  }

  private maxRetries(): number {
    return this.options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  private resolveSocieteId(subscription: SubscriptionEntity): string {
    if (this.options.resolveSocieteId) {
      return this.options.resolveSocieteId(subscription);
    }
    return subscription.organisationId;
  }

  private toMinorUnits(amount: number): number {
    return Math.round((Number(amount || 0) + Number.EPSILON) * 100);
  }

  private async publishEvent(subject: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.natsService || !this.natsService.isConnected()) {
      this.logger.warn(`NATS indisponible, event ${subject} non publie`);
      return;
    }

    await this.natsService.publish(subject, payload);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}

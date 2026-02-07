import { credentials, type ServiceError } from '@grpc/grpc-js';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { getServiceUrl, loadGrpcPackage, NatsService } from '@crm/shared-kernel';
import type { SubscriptionEntity } from '../entities/subscription.entity';
import type { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';

const ACTIVE_STATUS = 'ACTIVE';
const PAST_DUE_STATUS = 'PAST_DUE';

const SUBSCRIPTION_CHARGED_EVENT = 'SUBSCRIPTION_CHARGED';
const SUBSCRIPTION_CHARGE_FAILED_EVENT = 'SUBSCRIPTION_CHARGE_FAILED';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_PSP_NAME = 'GOCARDLESS';

const DEFAULT_FACTURE_STATUT_ID = 'SUBSCRIPTION_PENDING';
const DEFAULT_FACTURE_EMISSION_ID = 'SUBSCRIPTION_AUTO';
const DEFAULT_FACTURE_ADRESSE_ID = '';
const DEFAULT_FACTURE_PRODUIT_ID = '';
const DEFAULT_FACTURE_TAUX_TVA = 20;

export interface SubscriptionChargeSchedulingPort {
  getDueSubscriptions(organisationId: string, beforeDate: Date): Promise<SubscriptionEntity[]>;
  calculateNextChargeAt(frequency: string, currentPeriodEnd: string): string;
}

export interface CreateSubscriptionPaymentIntentInput {
  organisationId: string;
  societeId: string;
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

export interface SubscriptionChargeIdempotencyStore {
  isProcessed(idempotencyKey: string): Promise<boolean>;
  markProcessed(idempotencyKey: string): Promise<void>;
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

export interface SubscriptionChargeBatchResult {
  processedCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  results: SubscriptionChargeResult[];
}

interface CreatePaymentIntentGrpcRequest {
  organisation_id: string;
  societe_id: string;
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

function resolveFinanceGrpcUrl(): string {
  return process.env.FINANCE_GRPC_URL || getServiceUrl('factures');
}

export class PaymentServiceGrpcClient implements SubscriptionPaymentClient {
  private readonly client: PaymentServiceGrpcContract;

  constructor(url: string = resolveFinanceGrpcUrl()) {
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

    const url = options.url || resolveFinanceGrpcUrl();

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

export class InMemorySubscriptionChargeIdempotencyStore
  implements SubscriptionChargeIdempotencyStore
{
  private readonly keys = new Set<string>();

  async isProcessed(idempotencyKey: string): Promise<boolean> {
    return this.keys.has(idempotencyKey);
  }

  async markProcessed(idempotencyKey: string): Promise<void> {
    this.keys.add(idempotencyKey);
  }
}

@Injectable()
export class SubscriptionChargeService {
  private readonly logger = new Logger(SubscriptionChargeService.name);

  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly schedulingService: SubscriptionChargeSchedulingPort,
    private readonly paymentClient: SubscriptionPaymentClient = new PaymentServiceGrpcClient(),
    private readonly factureClient: SubscriptionFactureClient = new FactureServiceGrpcClient(),
    private readonly idempotencyStore: SubscriptionChargeIdempotencyStore =
      new InMemorySubscriptionChargeIdempotencyStore(),
    @Optional() private readonly natsService?: NatsService,
    private readonly options: SubscriptionChargeOptions = {},
  ) {}

  async processCharges(organisationId: string): Promise<SubscriptionChargeBatchResult> {
    const now = this.now();
    const dueSubscriptions = await this.schedulingService.getDueSubscriptions(organisationId, now);
    const results: SubscriptionChargeResult[] = [];

    for (const subscription of dueSubscriptions) {
      if (subscription.status !== ACTIVE_STATUS) {
        results.push({
          subscriptionId: subscription.id,
          idempotencyKey: this.buildIdempotencyKey(subscription.id, subscription.nextChargeAt),
          status: 'SKIPPED',
          reason: 'SUBSCRIPTION_NOT_ACTIVE',
        });
        continue;
      }

      const idempotencyKey = this.buildIdempotencyKey(subscription.id, subscription.nextChargeAt);
      const alreadyProcessed = await this.idempotencyStore.isProcessed(idempotencyKey);

      if (alreadyProcessed) {
        results.push({
          subscriptionId: subscription.id,
          idempotencyKey,
          status: 'SKIPPED',
          reason: 'ALREADY_CHARGED',
        });
        continue;
      }

      try {
        const paymentIntent = await this.paymentClient.createPaymentIntent(
          this.buildPaymentIntentInput(subscription, idempotencyKey),
        );

        const chargedAt = now.toISOString();
        subscription.nextChargeAt = this.schedulingService.calculateNextChargeAt(
          subscription.frequency,
          subscription.nextChargeAt,
        );
        subscription.retryCount = 0;

        const savedSubscription = await this.subscriptionRepository.save(subscription);

        const facture = await this.factureClient.createFacture({
          organisationId: savedSubscription.organisationId,
          dateEmission: chargedAt,
          clientBaseId: savedSubscription.clientId,
          contratId: savedSubscription.contratId,
          amount: Number(savedSubscription.amount || 0),
          currency: savedSubscription.currency,
          subscriptionId: savedSubscription.id,
        });

        await this.idempotencyStore.markProcessed(idempotencyKey);

        await this.publishEvent(SUBSCRIPTION_CHARGED_EVENT, {
          subscriptionId: savedSubscription.id,
          organisationId: savedSubscription.organisationId,
          clientId: savedSubscription.clientId,
          amount: Number(savedSubscription.amount || 0),
          currency: savedSubscription.currency,
          invoiceId: facture.id,
          paymentIntentId: paymentIntent.id,
          idempotencyKey,
          chargedAt,
          nextChargeAt: savedSubscription.nextChargeAt,
        });

        results.push({
          subscriptionId: savedSubscription.id,
          idempotencyKey,
          status: 'CHARGED',
          paymentIntentId: paymentIntent.id,
          invoiceId: facture.id,
        });
      } catch (error) {
        const reason = this.errorMessage(error);
        const nextRetryCount = Number(subscription.retryCount || 0) + 1;

        subscription.retryCount = nextRetryCount;

        if (nextRetryCount >= this.maxRetries()) {
          subscription.status = PAST_DUE_STATUS;
        }

        const savedSubscription = await this.subscriptionRepository.save(subscription);

        await this.publishEvent(SUBSCRIPTION_CHARGE_FAILED_EVENT, {
          subscriptionId: savedSubscription.id,
          organisationId: savedSubscription.organisationId,
          clientId: savedSubscription.clientId,
          amount: Number(savedSubscription.amount || 0),
          currency: savedSubscription.currency,
          idempotencyKey,
          retryCount: nextRetryCount,
          maxRetries: this.maxRetries(),
          status: savedSubscription.status,
          reason,
          failedAt: now.toISOString(),
        });

        results.push({
          subscriptionId: savedSubscription.id,
          idempotencyKey,
          status: 'FAILED',
          retryCount: nextRetryCount,
          reason,
        });
      }
    }

    return {
      processedCount: results.filter((result) => result.status !== 'SKIPPED').length,
      successCount: results.filter((result) => result.status === 'CHARGED').length,
      failedCount: results.filter((result) => result.status === 'FAILED').length,
      skippedCount: results.filter((result) => result.status === 'SKIPPED').length,
      results,
    };
  }

  private buildPaymentIntentInput(
    subscription: SubscriptionEntity,
    idempotencyKey: string,
  ): CreateSubscriptionPaymentIntentInput {
    return {
      organisationId: subscription.organisationId,
      societeId: this.resolveSocieteId(subscription),
      pspName: this.pspName(),
      amount: this.toMinorUnits(subscription.amount),
      currency: subscription.currency,
      idempotencyKey,
      metadata: {
        subscription_id: subscription.id,
        next_charge_at: subscription.nextChargeAt,
      },
    };
  }

  private buildIdempotencyKey(subscriptionId: string, nextChargeAt: string): string {
    return `${subscriptionId}-${nextChargeAt}`;
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

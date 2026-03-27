import { credentials, type ServiceError } from '@grpc/grpc-js';
import { getServiceUrl, loadGrpcPackage, NatsService } from '@crm/shared-kernel';
import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import {
  ClientExternalMappingEntity,
  SourceSystem,
} from '../../../../../domain/mondial-tv/entities/client-external-mapping.entity';
import {
  StoreEventType,
  StoreSource as BillingStoreSource,
  type StoreBillingRecordEntity,
} from '../../../../../domain/mondial-tv/entities/store-billing-record.entity';
import {
  PaymentMethod,
  PurchaseStatus,
  PurchaseType,
  StoreSource as PurchaseStoreSource,
  type TvodEstPurchaseEntity,
} from '../../../../../domain/mondial-tv/entities/tvod-est-purchase.entity';
import {
  SubscriptionFrequency,
  SubscriptionPlanType,
  SubscriptionStatus,
  StoreSource as SubscriptionStoreSource,
  type SubscriptionEntity,
} from '../../../../../domain/subscriptions/entities/subscription.entity';
import { SubscriptionTriggeredBy } from '../../../../../domain/subscriptions/entities/subscription-history.entity';
import { StoreBillingService, type StoreEventInput } from '../../../../../domain/mondial-tv/services/store-billing.service';
import { SubscriptionLifecycleService } from '../../../../../domain/subscriptions/services/subscription-lifecycle.service';
import { ClientExternalMappingService } from '../../../../persistence/typeorm/repositories/mondial-tv/client-external-mapping.service';
import { ImsWebhookEventService } from '../../../../persistence/typeorm/repositories/mondial-tv/ims-webhook-event.service';
import { TvodEstPurchaseService } from '../../../../persistence/typeorm/repositories/mondial-tv/tvod-est-purchase.service';
import { SubscriptionService } from '../../../../persistence/typeorm/repositories/subscriptions/subscription.service';

const IMS_WEBHOOK_SUBJECT = 'crm.commercial.mondial-tv.ims.webhook.received';
const IMS_INTERNAL_SUBJECT_PREFIX = 'crm.commercial.mondial-tv.ims';

interface CreateClientBaseGrpcRequest {
  organisation_id: string;
  type_client: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  compte_code: string;
  partenaire_id: string;
  telephone: string;
  email: string;
  statut: string;
  societe_id?: string;
  has_conciergerie?: boolean;
  has_justi_plus?: boolean;
  has_wincash?: boolean;
  uuid_wincash?: string;
  uuid_justi_plus?: string;
  date_premiere_souscription?: string;
  canal_acquisition?: string;
}

interface UpdateClientBaseGrpcRequest {
  id: string;
  type_client?: string;
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  compte_code?: string;
  partenaire_id?: string;
  telephone?: string;
  email?: string;
  statut?: string;
  societe_id?: string;
  has_conciergerie?: boolean;
  has_justi_plus?: boolean;
  has_wincash?: boolean;
  uuid_wincash?: string;
  uuid_justi_plus?: string;
  date_premiere_souscription?: string;
  canal_acquisition?: string;
}

interface ClientBaseGrpcResponse {
  id: string;
  organisation_id?: string;
  type_client?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  statut?: string;
}

interface ClientBaseServiceGrpcContract {
  Create(
    request: CreateClientBaseGrpcRequest,
    callback: (error: ServiceError | null, response?: ClientBaseGrpcResponse) => void,
  ): void;
  Update(
    request: UpdateClientBaseGrpcRequest,
    callback: (error: ServiceError | null, response?: ClientBaseGrpcResponse) => void,
  ): void;
}

interface UpdatePaymentIntentGrpcRequest {
  id: string;
  status?: string;
  psp_payment_id?: string;
  error_code?: string;
  error_message?: string;
}

interface PaymentIntentGrpcResponse {
  id: string;
  status?: string;
}

interface PaymentServiceGrpcContract {
  UpdatePaymentIntent(
    request: UpdatePaymentIntentGrpcRequest,
    callback: (error: ServiceError | null, response?: PaymentIntentGrpcResponse) => void,
  ): void;
}

export interface ClientBaseClientPort {
  createClient(input: CreateClientBaseGrpcRequest): Promise<ClientBaseGrpcResponse>;
  updateClient(input: UpdateClientBaseGrpcRequest): Promise<ClientBaseGrpcResponse>;
}

export interface PaymentIntentClientPort {
  updatePaymentIntent(input: UpdatePaymentIntentGrpcRequest): Promise<PaymentIntentGrpcResponse>;
}

function resolveClientsGrpcUrl(): string {
  return process.env.CLIENTS_GRPC_URL || process.env.SERVICE_CORE_GRPC_URL || getServiceUrl('clients');
}

function resolvePaymentsGrpcUrl(): string {
  return process.env.FINANCE_GRPC_URL || process.env.PAYMENTS_GRPC_URL || getServiceUrl('payments');
}

export class ClientBaseServiceGrpcClient implements ClientBaseClientPort {
  private readonly client: ClientBaseServiceGrpcContract;

  constructor(url: string = resolveClientsGrpcUrl()) {
    const grpcPackage = loadGrpcPackage('clients');
    const ClientBaseServiceConstructor = grpcPackage?.clients?.ClientBaseService;

    if (!ClientBaseServiceConstructor) {
      throw new Error('ClientBaseService gRPC constructor not found in clients proto package');
    }

    this.client = new ClientBaseServiceConstructor(url, credentials.createInsecure());
  }

  async createClient(input: CreateClientBaseGrpcRequest): Promise<ClientBaseGrpcResponse> {
    return new Promise<ClientBaseGrpcResponse>((resolve, reject) => {
      this.client.Create(input, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error('Create client returned an empty response'));
          return;
        }

        resolve(response);
      });
    });
  }

  async updateClient(input: UpdateClientBaseGrpcRequest): Promise<ClientBaseGrpcResponse> {
    return new Promise<ClientBaseGrpcResponse>((resolve, reject) => {
      this.client.Update(input, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error('Update client returned an empty response'));
          return;
        }

        resolve(response);
      });
    });
  }
}

export class PaymentIntentGrpcClient implements PaymentIntentClientPort {
  private readonly client: PaymentServiceGrpcContract;

  constructor(url: string = resolvePaymentsGrpcUrl()) {
    const grpcPackage = loadGrpcPackage('payments');
    const PaymentServiceConstructor = grpcPackage?.payment?.PaymentService;

    if (!PaymentServiceConstructor) {
      throw new Error('PaymentService gRPC constructor not found in payments proto package');
    }

    this.client = new PaymentServiceConstructor(url, credentials.createInsecure());
  }

  async updatePaymentIntent(
    input: UpdatePaymentIntentGrpcRequest,
  ): Promise<PaymentIntentGrpcResponse> {
    return new Promise<PaymentIntentGrpcResponse>((resolve, reject) => {
      this.client.UpdatePaymentIntent(input, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error('UpdatePaymentIntent returned an empty response'));
          return;
        }

        resolve(response);
      });
    });
  }
}

export interface ImsWebhookNatsEvent {
  internalEventId?: string;
  organisationId: string;
  eventId: string;
  eventType?: string;
  event_type?: string;
  payload?: Record<string, any>;
  eventTimestamp?: string | null;
  timezone?: string;
  receivedAt?: string;
}

@Injectable()
export class ImsEventHandler implements OnModuleInit {
  private readonly logger = new Logger(ImsEventHandler.name);

  constructor(
    private readonly natsService: NatsService,
    private readonly imsWebhookEventService: ImsWebhookEventService,
    private readonly clientExternalMappingService: ClientExternalMappingService,
    private readonly subscriptionService: SubscriptionService,
    private readonly subscriptionLifecycleService: SubscriptionLifecycleService,
    private readonly storeBillingService: StoreBillingService,
    private readonly tvodEstPurchaseService: TvodEstPurchaseService,
    @Optional()
    private readonly clientBaseClient: ClientBaseClientPort = new ClientBaseServiceGrpcClient(),
    @Optional()
    private readonly paymentIntentClient: PaymentIntentClientPort = new PaymentIntentGrpcClient(),
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.natsService.isConnected()) {
      this.logger.warn('NATS not connected, IMS Event handler will not subscribe');
      return;
    }

    await this.natsService.subscribe<ImsWebhookNatsEvent>(
      IMS_WEBHOOK_SUBJECT,
      async (event) => {
        await this.processEvent(event);
      },
    );

    this.logger.log('ImsEventHandler initialized - ready to process IMS webhook events');
  }

  private async processEvent(event: ImsWebhookNatsEvent): Promise<void> {
    const eventType = this.resolveEventType(event);
    const internalEventId = this.resolveInternalEventId(event);

    try {
      if (internalEventId) {
        await this.imsWebhookEventService.markProcessing(internalEventId);
      }

      const operationResult = await this.handleEvent(eventType, event);

      if (internalEventId) {
        await this.imsWebhookEventService.markDone(internalEventId);
      }

      await this.publishInternalEvent(`${IMS_INTERNAL_SUBJECT_PREFIX}.${eventType}.processed`, {
        internalEventId: internalEventId || null,
        organisationId: event.organisationId,
        eventId: event.eventId,
        eventType,
        handledAt: new Date().toISOString(),
        ...operationResult,
      });
    } catch (error) {
      if (internalEventId) {
        try {
          await this.imsWebhookEventService.markFailed(internalEventId, this.errorMessage(error));
        } catch (markFailedError) {
          this.logger.error(`Failed to mark IMS event as failed: ${markFailedError}`);
        }
      }

      this.logger.error(`Failed to process IMS event ${event.eventId}: ${this.errorMessage(error)}`);
      throw error;
    }
  }

  private async handleEvent(
    eventType: string,
    event: ImsWebhookNatsEvent,
  ): Promise<Record<string, unknown>> {
    switch (eventType) {
      case 'user.created':
        return this.handleUserCreated(event);
      case 'user.updated':
        return this.handleUserUpdated(event);
      case 'subscription.created':
        return this.handleSubscriptionCreated(event);
      case 'subscription.updated':
        return this.handleSubscriptionUpdated(event);
      case 'subscription.canceled':
      case 'subscription.cancelled':
        return this.handleSubscriptionCanceled(event);
      case 'payment.succeeded':
        return this.handlePaymentSucceeded(event);
      case 'payment.failed':
        return this.handlePaymentFailed(event);
      case 'payment.refunded':
        return this.handlePaymentRefunded(event);
      case 'tvod.purchased':
        return this.handleTvodPurchased(event);
      case 'est.purchased':
        return this.handleEstPurchased(event);
      default:
        throw new Error(`Unsupported IMS event type: ${eventType}`);
    }
  }

  private async handleUserCreated(event: ImsWebhookNatsEvent): Promise<Record<string, unknown>> {
    const payload = this.readPayload(event);
    const imsUserId = this.requiredString(payload, ['ims_user_id', 'imsUserId', 'user_id']);
    const existing = await this.clientExternalMappingService.findByImsUserId(
      event.organisationId,
      imsUserId,
    );

    if (existing) {
      return {
        action: 'USER_CREATED',
        clientId: existing.clientId,
        mappingId: existing.id,
        imsUserId,
        reusedMapping: true,
      };
    }

    const request = this.buildCreateClientRequest(event.organisationId, payload);
    const createdClient = await this.clientBaseClient.createClient(request);

    const mapping = new ClientExternalMappingEntity();
    mapping.organisationId = event.organisationId;
    mapping.clientId = createdClient.id;
    mapping.sourceSystem = SourceSystem.IMS;
    mapping.sourceChannel = this.readString(payload, ['source_channel', 'channel']) || null;
    mapping.imsUserId = imsUserId;
    mapping.storeCustomerId = this.readString(payload, ['store_customer_id', 'storeCustomerId']) || null;
    mapping.metadata = this.readObject(payload, ['metadata']) || {
      source: 'ims',
      eventId: event.eventId,
    };

    const savedMapping = await this.clientExternalMappingService.save(mapping);

    return {
      action: 'USER_CREATED',
      clientId: createdClient.id,
      mappingId: savedMapping.id,
      imsUserId,
    };
  }

  private async handleUserUpdated(event: ImsWebhookNatsEvent): Promise<Record<string, unknown>> {
    const payload = this.readPayload(event);
    const imsUserId = this.readString(payload, ['ims_user_id', 'imsUserId', 'user_id']);
    let clientId = this.readString(payload, ['client_id', 'clientId']);

    if (!clientId && imsUserId) {
      const mapping = await this.clientExternalMappingService.findByImsUserId(
        event.organisationId,
        imsUserId,
      );
      clientId = mapping?.clientId || null;
    }

    if (!clientId) {
      throw new Error(`Unable to resolve client to update for IMS event ${event.eventId}`);
    }

    const updateRequest = this.buildUpdateClientRequest(clientId, payload);
    const updatedClient = await this.clientBaseClient.updateClient(updateRequest);

    return {
      action: 'USER_UPDATED',
      clientId: updatedClient.id,
      imsUserId: imsUserId || null,
    };
  }

  private async handleSubscriptionCreated(
    event: ImsWebhookNatsEvent,
  ): Promise<Record<string, unknown>> {
    const payload = this.readPayload(event);
    const clientId = await this.resolveClientId(event.organisationId, payload);
    const nowIso = new Date().toISOString();
    const startDate = this.resolveIsoDate(payload, ['current_period_start', 'start_date'], nowIso);
    const endDate = this.resolveIsoDate(payload, ['current_period_end', 'end_date'], startDate);
    const nextChargeAt = this.resolveIsoDate(payload, ['next_charge_at'], endDate);

    const created = await this.subscriptionService.create({
      organisationId: event.organisationId,
      clientId,
      planType: this.normalizePlanType(
        this.readString(payload, ['plan_type', 'plan', 'subscription_plan']),
      ),
      storeSource: this.normalizeSubscriptionStoreSource(
        this.readString(payload, ['store_source', 'payment_source']),
      ),
      status: this.normalizeSubscriptionStatus(this.readString(payload, ['status']) || 'PENDING'),
      frequency: this.normalizeSubscriptionFrequency(
        this.readString(payload, ['frequency', 'billing_frequency']),
      ),
      amount: this.readNumber(payload, ['amount']) ?? 0,
      currency: this.readString(payload, ['currency']) || 'EUR',
      startDate,
      endDate,
      nextChargeAt,
      imsSubscriptionId:
        this.readString(payload, ['ims_subscription_id', 'subscription_external_id']) || undefined,
      addOns: this.readObject(payload, ['add_ons', 'addons']) || undefined,
    });

    return {
      action: 'SUBSCRIPTION_CREATED',
      subscriptionId: created.id,
      clientId: created.clientId,
      planType: created.planType,
      storeSource: created.storeSource,
      imsSubscriptionId: created.imsSubscriptionId,
    };
  }

  private async handleSubscriptionUpdated(
    event: ImsWebhookNatsEvent,
  ): Promise<Record<string, unknown>> {
    const payload = this.readPayload(event);
    const subscription = await this.resolveSubscription(event.organisationId, payload);
    const updateInput: Record<string, unknown> = {
      id: subscription.id,
    };

    const nextPlanTypeRaw = this.readString(payload, ['plan_type', 'plan', 'subscription_plan']);
    const nextStatusRaw = this.readString(payload, ['status']);
    const nextFrequencyRaw = this.readString(payload, ['frequency', 'billing_frequency']);
    const nextStoreSourceRaw = this.readString(payload, ['store_source', 'payment_source']);
    const nextAmount = this.readNumber(payload, ['amount']);
    const nextCurrency = this.readString(payload, ['currency']);
    const nextStartDate = this.readString(payload, ['current_period_start', 'start_date']);
    const nextEndDate = this.readString(payload, ['current_period_end', 'end_date']);
    const nextChargeAt = this.readString(payload, ['next_charge_at']);
    const nextAddOns = this.readObject(payload, ['add_ons', 'addons']);

    if (nextPlanTypeRaw) {
      updateInput.planType = this.normalizePlanType(nextPlanTypeRaw);
    }
    if (nextStatusRaw) {
      updateInput.status = this.normalizeSubscriptionStatus(nextStatusRaw);
    }
    if (nextFrequencyRaw) {
      updateInput.frequency = this.normalizeSubscriptionFrequency(nextFrequencyRaw);
    }
    if (nextStoreSourceRaw) {
      updateInput.storeSource = this.normalizeSubscriptionStoreSource(nextStoreSourceRaw);
    }
    if (nextAmount !== null) {
      updateInput.amount = nextAmount;
    }
    if (nextCurrency) {
      updateInput.currency = nextCurrency;
    }
    if (nextStartDate) {
      updateInput.startDate = this.parseDate(nextStartDate).toISOString();
    }
    if (nextEndDate) {
      updateInput.endDate = this.parseDate(nextEndDate).toISOString();
    }
    if (nextChargeAt) {
      updateInput.nextChargeAt = this.parseDate(nextChargeAt).toISOString();
    }
    if (nextAddOns) {
      updateInput.addOns = nextAddOns;
    }

    const updated = await this.subscriptionService.update(updateInput as any);
    const changeType = this.resolvePlanChangeType(subscription.planType, updated.planType);

    return {
      action: 'SUBSCRIPTION_UPDATED',
      subscriptionId: updated.id,
      previousPlanType: subscription.planType,
      newPlanType: updated.planType,
      changeType,
    };
  }

  private async handleSubscriptionCanceled(
    event: ImsWebhookNatsEvent,
  ): Promise<Record<string, unknown>> {
    const payload = this.readPayload(event);
    const subscription = await this.resolveSubscription(event.organisationId, payload);
    const reason = this.readString(payload, ['reason', 'cancel_reason']) || 'ims_subscription_canceled';
    const cancelAtPeriodEnd = this.readBoolean(payload, ['cancel_at_period_end']) || false;

    const cancelled = await this.subscriptionLifecycleService.cancel(subscription.id, {
      reason,
      triggeredBy: SubscriptionTriggeredBy.IMS,
      cancelAtPeriodEnd,
      metadata: {
        source: 'IMS',
        imsEventId: event.eventId,
      },
    });

    return {
      action: 'SUBSCRIPTION_CANCELED',
      subscriptionId: cancelled.id,
      status: cancelled.status,
      reason,
    };
  }

  private async handlePaymentSucceeded(event: ImsWebhookNatsEvent): Promise<Record<string, unknown>> {
    const payload = this.readPayload(event);
    const subscription = await this.tryResolveSubscription(event.organisationId, payload);
    const source = this.resolveSubscriptionStoreSource(payload, subscription);

    if (this.isStoreSource(source)) {
      const storeSubscription =
        subscription || (await this.resolveSubscription(event.organisationId, payload));
      const storeEvent = this.buildStoreEventInput(
        event,
        payload,
        storeSubscription,
        this.resolveStoreSuccessEventType(payload),
      );
      const record = await this.storeBillingService.recordStorePayment(
        storeSubscription.id,
        storeEvent,
      );

      return {
        action: 'PAYMENT_SUCCEEDED_STORE',
        subscriptionId: storeSubscription.id,
        storeRecordId: record.id,
        status: record.status,
      };
    }

    const paymentIntentId = this.requiredString(payload, ['payment_intent_id', 'paymentIntentId']);
    const updated = await this.paymentIntentClient.updatePaymentIntent({
      id: paymentIntentId,
      status: 'SUCCEEDED',
      psp_payment_id: this.readString(payload, ['psp_payment_id', 'pspPaymentId']) || undefined,
    });

    return {
      action: 'PAYMENT_SUCCEEDED_DIRECT',
      paymentIntentId: updated.id,
      status: updated.status || 'SUCCEEDED',
    };
  }

  private async handlePaymentFailed(event: ImsWebhookNatsEvent): Promise<Record<string, unknown>> {
    const payload = this.readPayload(event);
    const subscription = await this.tryResolveSubscription(event.organisationId, payload);
    const source = this.resolveSubscriptionStoreSource(payload, subscription);
    const failureReason = this.readString(payload, ['reason', 'error_message']) || 'payment_failed';

    if (this.isStoreSource(source)) {
      const storeSubscription =
        subscription || (await this.resolveSubscription(event.organisationId, payload));
      const storeEvent = this.buildStoreEventInput(
        event,
        payload,
        storeSubscription,
        StoreEventType.CANCELLATION,
      );
      const record = await this.storeBillingService.recordStorePayment(
        storeSubscription.id,
        storeEvent,
      );

      return {
        action: 'PAYMENT_FAILED_STORE',
        subscriptionId: storeSubscription.id,
        storeRecordId: record.id,
        status: record.status,
      };
    }

    const paymentIntentId = this.requiredString(payload, ['payment_intent_id', 'paymentIntentId']);
    const updated = await this.paymentIntentClient.updatePaymentIntent({
      id: paymentIntentId,
      status: 'FAILED',
      error_message: failureReason,
    });

    await this.publishInternalEvent(`${IMS_INTERNAL_SUBJECT_PREFIX}.payment.failed.retry.requested`, {
      organisationId: event.organisationId,
      eventId: event.eventId,
      paymentIntentId,
      reason: failureReason,
      requestedAt: new Date().toISOString(),
    });

    return {
      action: 'PAYMENT_FAILED_DIRECT',
      paymentIntentId: updated.id,
      status: updated.status || 'FAILED',
      retryRequested: true,
    };
  }

  private async handlePaymentRefunded(event: ImsWebhookNatsEvent): Promise<Record<string, unknown>> {
    const payload = this.readPayload(event);
    const subscription = await this.tryResolveSubscription(event.organisationId, payload);
    const source = this.resolveSubscriptionStoreSource(payload, subscription);

    if (this.isStoreSource(source)) {
      const storeSubscription =
        subscription || (await this.resolveSubscription(event.organisationId, payload));
      const storeEvent = this.buildStoreEventInput(
        event,
        payload,
        storeSubscription,
        StoreEventType.REFUND,
      );
      const record = await this.storeBillingService.recordStorePayment(
        storeSubscription.id,
        storeEvent,
      );

      return {
        action: 'PAYMENT_REFUNDED_STORE',
        subscriptionId: storeSubscription.id,
        storeRecordId: record.id,
        status: record.status,
      };
    }

    const paymentIntentId = this.requiredString(payload, ['payment_intent_id', 'paymentIntentId']);
    const updated = await this.paymentIntentClient.updatePaymentIntent({
      id: paymentIntentId,
      status: 'CANCELLED',
      error_message:
        this.readString(payload, ['reason', 'error_message']) || 'Payment refunded by IMS webhook',
    });

    return {
      action: 'PAYMENT_REFUNDED_DIRECT',
      paymentIntentId: updated.id,
      status: updated.status || 'CANCELLED',
    };
  }

  private async handleTvodPurchased(event: ImsWebhookNatsEvent): Promise<Record<string, unknown>> {
    return this.handlePurchaseEvent(event, PurchaseType.TVOD);
  }

  private async handleEstPurchased(event: ImsWebhookNatsEvent): Promise<Record<string, unknown>> {
    return this.handlePurchaseEvent(event, PurchaseType.EST);
  }

  private async handlePurchaseEvent(
    event: ImsWebhookNatsEvent,
    purchaseType: PurchaseType,
  ): Promise<Record<string, unknown>> {
    const payload = this.readPayload(event);
    const clientId = await this.resolveClientId(event.organisationId, payload);
    const purchaseStoreSource = this.normalizePurchaseStoreSource(
      this.readString(payload, ['store_source', 'payment_source']),
    );

    const created = await this.tvodEstPurchaseService.create({
      organisationId: event.organisationId,
      clientId,
      contentId: this.requiredString(payload, ['content_id', 'contentId']),
      contentTitle:
        this.readString(payload, ['content_title', 'title']) ||
        this.requiredString(payload, ['content_id', 'contentId']),
      purchaseType,
      amount: this.readNumber(payload, ['amount']) ?? 0,
      currency: this.readString(payload, ['currency']) || 'EUR',
      paymentMethod: this.resolvePurchasePaymentMethod(payload, purchaseStoreSource),
      storeSource: purchaseStoreSource,
      storeTransactionId:
        this.readString(payload, ['store_transaction_id', 'storeTransactionId']) || null,
      imsTransactionId:
        this.readString(payload, ['ims_transaction_id', 'transaction_id']) || event.eventId,
      invoiceId: this.readString(payload, ['invoice_id', 'invoiceId']) || null,
      status: PurchaseStatus.COMPLETED,
      refundedAt: null,
      refundAmount: null,
    });

    return {
      action: purchaseType === PurchaseType.TVOD ? 'TVOD_PURCHASED' : 'EST_PURCHASED',
      purchaseId: created.id,
      purchaseType: created.purchaseType,
      clientId: created.clientId,
    };
  }

  private buildCreateClientRequest(
    organisationId: string,
    payload: Record<string, any>,
  ): CreateClientBaseGrpcRequest {
    return {
      organisation_id: organisationId,
      type_client: this.readString(payload, ['type_client', 'client_type']) || 'PARTICULIER',
      nom: this.readString(payload, ['nom', 'last_name', 'lastname']) || 'Unknown',
      prenom: this.readString(payload, ['prenom', 'first_name', 'firstname']) || 'Unknown',
      date_naissance: this.readString(payload, ['date_naissance', 'birth_date']) || '',
      compte_code: this.readString(payload, ['compte_code', 'account_code']) || '',
      partenaire_id: this.readString(payload, ['partenaire_id', 'partner_id']) || '',
      telephone: this.readString(payload, ['telephone', 'phone']) || '',
      email: this.readString(payload, ['email']) || '',
      statut: this.readString(payload, ['statut', 'status']) || 'ACTIVE',
      societe_id: this.readString(payload, ['societe_id', 'societeId']) || undefined,
      canal_acquisition:
        this.readString(payload, ['canal_acquisition', 'source_channel', 'channel']) || undefined,
    };
  }

  private buildUpdateClientRequest(
    clientId: string,
    payload: Record<string, any>,
  ): UpdateClientBaseGrpcRequest {
    const request: UpdateClientBaseGrpcRequest = {
      id: clientId,
    };

    const typeClient = this.readString(payload, ['type_client', 'client_type']);
    const nom = this.readString(payload, ['nom', 'last_name', 'lastname']);
    const prenom = this.readString(payload, ['prenom', 'first_name', 'firstname']);
    const dateNaissance = this.readString(payload, ['date_naissance', 'birth_date']);
    const compteCode = this.readString(payload, ['compte_code', 'account_code']);
    const partenaireId = this.readString(payload, ['partenaire_id', 'partner_id']);
    const telephone = this.readString(payload, ['telephone', 'phone']);
    const email = this.readString(payload, ['email']);
    const statut = this.readString(payload, ['statut', 'status']);
    const societeId = this.readString(payload, ['societe_id', 'societeId']);
    const canalAcquisition = this.readString(payload, ['canal_acquisition', 'source_channel', 'channel']);

    if (typeClient) request.type_client = typeClient;
    if (nom) request.nom = nom;
    if (prenom) request.prenom = prenom;
    if (dateNaissance) request.date_naissance = dateNaissance;
    if (compteCode) request.compte_code = compteCode;
    if (partenaireId) request.partenaire_id = partenaireId;
    if (telephone) request.telephone = telephone;
    if (email) request.email = email;
    if (statut) request.statut = statut;
    if (societeId) request.societe_id = societeId;
    if (canalAcquisition) request.canal_acquisition = canalAcquisition;

    return request;
  }

  private async resolveClientId(
    organisationId: string,
    payload: Record<string, any>,
  ): Promise<string> {
    const directClientId = this.readString(payload, ['client_id', 'clientId']);
    if (directClientId) {
      return directClientId;
    }

    const imsUserId = this.readString(payload, ['ims_user_id', 'imsUserId', 'user_id']);
    if (imsUserId) {
      const mapping = await this.clientExternalMappingService.findByImsUserId(
        organisationId,
        imsUserId,
      );
      if (mapping?.clientId) {
        return mapping.clientId;
      }
    }

    throw new Error('Unable to resolve client_id from IMS payload');
  }

  private async resolveSubscription(
    organisationId: string,
    payload: Record<string, any>,
  ): Promise<SubscriptionEntity> {
    const subscriptionId = this.readString(payload, ['subscription_id', 'subscriptionId']);
    if (subscriptionId) {
      const byId = await this.subscriptionService.findById(subscriptionId);
      if (byId) {
        return byId;
      }
    }

    const imsSubscriptionId = this.readString(payload, ['ims_subscription_id', 'imsSubscriptionId']);
    if (imsSubscriptionId) {
      const page = await this.subscriptionService.findAll(
        { organisationId },
        {
          page: 1,
          limit: 500,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        },
      );
      const byImsId = page.subscriptions.find(
        (subscription) => subscription.imsSubscriptionId === imsSubscriptionId,
      );
      if (byImsId) {
        return byImsId;
      }
    }

    throw new Error('Unable to resolve subscription from IMS payload');
  }

  private async tryResolveSubscription(
    organisationId: string,
    payload: Record<string, any>,
  ): Promise<SubscriptionEntity | null> {
    try {
      return await this.resolveSubscription(organisationId, payload);
    } catch {
      return null;
    }
  }

  private resolveStoreSuccessEventType(payload: Record<string, any>): StoreEventType {
    const subtype = this.readString(payload, ['event_subtype', 'payment_event_type']);
    const renewal = this.readBoolean(payload, ['is_renewal', 'renewal']);

    if (renewal || subtype?.toUpperCase() === 'RENEWAL') {
      return StoreEventType.RENEWAL;
    }

    return StoreEventType.INITIAL_PURCHASE;
  }

  private buildStoreEventInput(
    event: ImsWebhookNatsEvent,
    payload: Record<string, any>,
    subscription: SubscriptionEntity,
    eventType: StoreEventType,
  ): StoreEventInput {
    return {
      organisationId: event.organisationId,
      subscriptionId: subscription.id,
      clientId: subscription.clientId,
      storeSource: this.normalizeBillingStoreSource(
        this.readString(payload, ['store_source', 'payment_source']) || subscription.storeSource,
      ),
      storeTransactionId:
        this.readString(payload, [
          'store_transaction_id',
          'storeTransactionId',
          'transaction_id',
          'ims_transaction_id',
        ]) || event.eventId,
      storeProductId:
        this.readString(payload, ['store_product_id', 'product_id', 'productId']) ||
        String(subscription.planType),
      amount: this.readNumber(payload, ['amount']) ?? Number(subscription.amount || 0),
      currency: this.readString(payload, ['currency']) || subscription.currency || 'EUR',
      eventType,
      eventDate: this.parseDate(
        this.readString(payload, ['event_date', 'payment_date', 'timestamp']) ||
          event.eventTimestamp ||
          event.receivedAt ||
          new Date().toISOString(),
      ),
      receiptData: this.readObject(payload, ['receipt_data', 'receipt']) || undefined,
      originalTransactionId:
        this.readString(payload, ['original_transaction_id', 'originalTransactionId']) || undefined,
    };
  }

  private resolveSubscriptionStoreSource(
    payload: Record<string, any>,
    subscription: SubscriptionEntity | null,
  ): SubscriptionStoreSource {
    return this.normalizeSubscriptionStoreSource(
      this.readString(payload, ['store_source', 'payment_source']) || subscription?.storeSource || null,
    );
  }

  private resolvePurchasePaymentMethod(
    payload: Record<string, any>,
    storeSource: PurchaseStoreSource,
  ): PaymentMethod {
    const explicit = this.readString(payload, ['payment_method', 'paymentMethod']);

    if (explicit) {
      const normalized = explicit.trim().toUpperCase();
      if (normalized === PaymentMethod.CB_DIRECT) {
        return PaymentMethod.CB_DIRECT;
      }
      if (normalized === PaymentMethod.APPLE_STORE) {
        return PaymentMethod.APPLE_STORE;
      }
      if (normalized === PaymentMethod.GOOGLE_STORE) {
        return PaymentMethod.GOOGLE_STORE;
      }
    }

    if (storeSource === PurchaseStoreSource.APPLE) {
      return PaymentMethod.APPLE_STORE;
    }

    if (storeSource === PurchaseStoreSource.GOOGLE) {
      return PaymentMethod.GOOGLE_STORE;
    }

    return PaymentMethod.CB_DIRECT;
  }

  private normalizePlanType(value: string | null): SubscriptionPlanType {
    const normalized = String(value || SubscriptionPlanType.FREE_AVOD)
      .trim()
      .toUpperCase();

    if (normalized === 'PREMIUM' || normalized === 'SVOD') {
      return SubscriptionPlanType.PREMIUM_SVOD;
    }

    if (Object.values(SubscriptionPlanType).includes(normalized as SubscriptionPlanType)) {
      return normalized as SubscriptionPlanType;
    }

    return SubscriptionPlanType.FREE_AVOD;
  }

  private normalizeSubscriptionStatus(value: string | null): SubscriptionStatus {
    const normalized = String(value || SubscriptionStatus.PENDING)
      .trim()
      .toUpperCase();

    if (normalized === 'CANCELED') {
      return SubscriptionStatus.CANCELLED;
    }

    if (normalized === 'PAUSED') {
      return SubscriptionStatus.SUSPENDED;
    }

    if (Object.values(SubscriptionStatus).includes(normalized as SubscriptionStatus)) {
      return normalized as SubscriptionStatus;
    }

    return SubscriptionStatus.PENDING;
  }

  private normalizeSubscriptionFrequency(value: string | null): SubscriptionFrequency {
    const normalized = String(value || SubscriptionFrequency.MONTHLY)
      .trim()
      .toUpperCase();

    if (normalized === 'YEARLY') {
      return SubscriptionFrequency.ANNUAL;
    }

    if (Object.values(SubscriptionFrequency).includes(normalized as SubscriptionFrequency)) {
      return normalized as SubscriptionFrequency;
    }

    return SubscriptionFrequency.MONTHLY;
  }

  private normalizeSubscriptionStoreSource(value: string | null): SubscriptionStoreSource {
    const normalized = String(value || SubscriptionStoreSource.WEB_DIRECT)
      .trim()
      .toUpperCase();

    switch (normalized) {
      case 'APPLE':
      case 'APPLE_STORE':
        return SubscriptionStoreSource.APPLE_STORE;
      case 'GOOGLE':
      case 'GOOGLE_STORE':
        return SubscriptionStoreSource.GOOGLE_STORE;
      case 'TV':
      case 'TV_STORE':
        return SubscriptionStoreSource.TV_STORE;
      case 'BOX':
      case 'OPERATOR':
        return SubscriptionStoreSource.BOX;
      case 'NONE':
        return SubscriptionStoreSource.NONE;
      case 'DIRECT':
      case 'WEB':
      case 'WEB_DIRECT':
        return SubscriptionStoreSource.WEB_DIRECT;
      default:
        if (Object.values(SubscriptionStoreSource).includes(normalized as SubscriptionStoreSource)) {
          return normalized as SubscriptionStoreSource;
        }
        return SubscriptionStoreSource.WEB_DIRECT;
    }
  }

  private normalizeBillingStoreSource(value: string | null): BillingStoreSource {
    const normalized = String(value || '').trim().toUpperCase();

    if (normalized.includes('APPLE')) {
      return BillingStoreSource.APPLE_STORE;
    }

    if (normalized.includes('GOOGLE')) {
      return BillingStoreSource.GOOGLE_STORE;
    }

    return BillingStoreSource.TV_STORE;
  }

  private normalizePurchaseStoreSource(value: string | null): PurchaseStoreSource {
    const normalized = String(value || '').trim().toUpperCase();

    if (normalized.includes('APPLE')) {
      return PurchaseStoreSource.APPLE;
    }

    if (normalized.includes('GOOGLE')) {
      return PurchaseStoreSource.GOOGLE;
    }

    return PurchaseStoreSource.DIRECT;
  }

  private isStoreSource(source: SubscriptionStoreSource): boolean {
    return [
      SubscriptionStoreSource.APPLE_STORE,
      SubscriptionStoreSource.GOOGLE_STORE,
      SubscriptionStoreSource.TV_STORE,
      SubscriptionStoreSource.BOX,
    ].includes(source);
  }

  private resolvePlanChangeType(
    previousPlanType: SubscriptionPlanType,
    newPlanType: SubscriptionPlanType,
  ): 'UPGRADE' | 'DOWNGRADE' | 'UNCHANGED' {
    if (previousPlanType === newPlanType) {
      return 'UNCHANGED';
    }

    const rank: Record<SubscriptionPlanType, number> = {
      [SubscriptionPlanType.FREE_AVOD]: 1,
      [SubscriptionPlanType.PREMIUM_SVOD]: 2,
      [SubscriptionPlanType.VIP]: 3,
    };

    return rank[newPlanType] > rank[previousPlanType] ? 'UPGRADE' : 'DOWNGRADE';
  }

  private resolveEventType(event: ImsWebhookNatsEvent): string {
    const value = event.eventType || event.event_type || '';
    const normalized = String(value || '').trim().toLowerCase();

    if (!normalized) {
      throw new Error('IMS event type is missing');
    }

    return normalized;
  }

  private resolveInternalEventId(event: ImsWebhookNatsEvent): string | null {
    const value = event.internalEventId;
    if (!value || typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  private readPayload(event: ImsWebhookNatsEvent): Record<string, any> {
    if (event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload)) {
      return event.payload;
    }

    return {};
  }

  private readString(payload: Record<string, any>, keys: string[]): string | null {
    for (const key of keys) {
      const value = payload?.[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }

    return null;
  }

  private requiredString(payload: Record<string, any>, keys: string[]): string {
    const value = this.readString(payload, keys);
    if (!value) {
      throw new Error(`Missing required field (${keys.join(' | ')}) in IMS payload`);
    }
    return value;
  }

  private readNumber(payload: Record<string, any>, keys: string[]): number | null {
    for (const key of keys) {
      const value = payload?.[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private readBoolean(payload: Record<string, any>, keys: string[]): boolean | null {
    for (const key of keys) {
      const value = payload?.[key];
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') {
          return true;
        }
        if (normalized === 'false') {
          return false;
        }
      }
    }

    return null;
  }

  private readObject(payload: Record<string, any>, keys: string[]): Record<string, any> | null {
    for (const key of keys) {
      const value = payload?.[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value;
      }
    }

    return null;
  }

  private resolveIsoDate(
    payload: Record<string, any>,
    keys: string[],
    fallback: string,
  ): string {
    const value = this.readString(payload, keys);
    const date = this.parseDate(value || fallback);
    return date.toISOString();
  }

  private parseDate(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }

    return parsed;
  }

  private async publishInternalEvent(
    subject: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!this.natsService.isConnected()) {
      this.logger.warn(`NATS not connected, skipping internal event ${subject}`);
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

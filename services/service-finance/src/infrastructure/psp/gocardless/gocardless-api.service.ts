import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GoCardlessClient } from 'gocardless-nodejs/client';
import { Environments } from 'gocardless-nodejs/constants';

import {
  GoCardlessAccountEntity,
} from '../../../domain/payments/entities/gocardless-account.entity';
import {
  GoCardlessMandateEntity,
  MandateStatus,
} from '../../../domain/payments/entities/gocardless-mandate.entity';
import {
  PaymentEventEntity,
  PaymentEventType,
} from '../../../domain/payments/entities/payment-event.entity';
import { PaymentProvider } from '../../../domain/payments/entities/schedule.entity';
import { EncryptionService } from '../../security/encryption.service';
import { IbanMaskingService } from '../../security/iban-masking.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GoCardlessMandateResult {
  id: string;
  clientId: string;
  mandateId: string;
  status: string;
  scheme: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumberEnding?: string;
  redirectUrl?: string;
}

export interface GoCardlessPaymentResult {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  chargeDate?: string;
}

export interface GoCardlessSubscriptionResult {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  intervalUnit: string;
  interval: number;
  nextPaymentDate?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class GoCardlessApiService {
  private readonly logger = new Logger(GoCardlessApiService.name);
  private readonly clientCache = new Map<string, GoCardlessClient>();

  constructor(
    @InjectRepository(GoCardlessAccountEntity)
    private readonly gcAccountRepo: Repository<GoCardlessAccountEntity>,
    @InjectRepository(GoCardlessMandateEntity)
    private readonly gcMandateRepo: Repository<GoCardlessMandateEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepo: Repository<PaymentEventEntity>,
    private readonly encryptionService: EncryptionService,
    private readonly ibanMaskingService: IbanMaskingService,
  ) {}

  // -----------------------------------------------------------------------
  // Account
  // -----------------------------------------------------------------------

  async getAccount(societeId: string): Promise<GoCardlessAccountEntity> {
    const account = await this.gcAccountRepo.findOne({
      where: { societeId, actif: true },
    });

    if (!account) {
      throw new Error(`No active GoCardless account found for societeId ${societeId}`);
    }

    if (!account.isConfigured()) {
      throw new Error(`GoCardless account ${account.id} is not fully configured`);
    }

    return account;
  }

  // -----------------------------------------------------------------------
  // SDK Client Factory
  // -----------------------------------------------------------------------

  private async getClient(societeId: string): Promise<GoCardlessClient> {
    const cached = this.clientCache.get(societeId);
    if (cached) {
      return cached;
    }

    const account = await this.getAccount(societeId);
    const decryptedToken = this.encryptionService.decrypt(account.accessToken);
    const environment = account.isSandbox ? Environments.Sandbox : Environments.Live;

    const client = new GoCardlessClient(decryptedToken, environment);
    this.clientCache.set(societeId, client);

    return client;
  }

  // -----------------------------------------------------------------------
  // Mandate operations
  // -----------------------------------------------------------------------

  async setupMandate(
    societeId: string,
    clientId: string,
    scheme: string,
    description?: string,
    successRedirectUrl?: string,
    sessionToken?: string,
  ): Promise<GoCardlessMandateResult> {
    const client = await this.getClient(societeId);

    await this.logApiEvent(societeId, 'API_REQUEST', 'setupMandate', {
      clientId,
      scheme,
      description,
    });

    try {
      // Use Billing Request Flow for mandate setup (GoCardless v2 approach)
      const billingRequest = await client.billingRequests.create({
        mandate_request: {
          scheme,
          description: description ?? 'SEPA Direct Debit Mandate',
        },
      });

      const billingRequestFlow = await client.billingRequestFlows.create({
        redirect_uri: successRedirectUrl ?? '',
        exit_uri: successRedirectUrl ?? '',
        links: {
          billing_request: billingRequest.id,
        },
      });

      await this.logApiEvent(societeId, 'API_RESPONSE', 'setupMandate', {
        billingRequestId: billingRequest.id,
        billingRequestFlowId: billingRequestFlow.id,
      });

      // Store a pending mandate reference
      const mandateEntity = new GoCardlessMandateEntity();
      mandateEntity.clientId = clientId;
      mandateEntity.societeId = societeId;
      mandateEntity.mandateId = billingRequest.id; // Will be updated via webhook
      mandateEntity.rum = `GC-${billingRequest.id}`;
      mandateEntity.status = MandateStatus.PENDING_CUSTOMER_APPROVAL;
      mandateEntity.scheme = scheme;

      await this.gcMandateRepo.save(mandateEntity);

      return {
        id: mandateEntity.id,
        clientId,
        mandateId: billingRequest.id,
        status: 'PENDING_CUSTOMER_APPROVAL',
        scheme,
        redirectUrl: billingRequestFlow.authorisation_url ?? undefined,
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'setupMandate', null, error);
      throw this.mapError('setupMandate', error);
    }
  }

  async getMandate(societeId: string, clientId: string): Promise<GoCardlessMandateResult> {
    const mandate = await this.gcMandateRepo.findOne({
      where: { societeId, clientId, status: MandateStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!mandate) {
      throw new Error(`No active GoCardless mandate found for clientId ${clientId}`);
    }

    const client = await this.getClient(societeId);

    await this.logApiEvent(societeId, 'API_REQUEST', 'getMandate', {
      mandateId: mandate.mandateId,
    });

    try {
      const gcMandate = await client.mandates.find(mandate.mandateId);

      await this.logApiEvent(societeId, 'API_RESPONSE', 'getMandate', gcMandate);

      // Update local entity with latest data
      mandate.status = this.normalizeMandateStatus(gcMandate.status ?? '');
      mandate.bankName = gcMandate.links?.customer_bank_account ?? mandate.bankName;
      await this.gcMandateRepo.save(mandate);

      return {
        id: mandate.id,
        clientId: mandate.clientId,
        mandateId: mandate.mandateId,
        status: mandate.status,
        scheme: gcMandate.scheme ?? mandate.scheme ?? '',
        bankName: mandate.bankName,
        accountHolderName: mandate.accountHolderName,
        accountNumberEnding: mandate.accountNumberEnding,
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'getMandate', null, error);
      throw this.mapError('getMandate', error);
    }
  }

  async cancelMandate(societeId: string, mandateId: string): Promise<GoCardlessMandateResult> {
    const client = await this.getClient(societeId);

    await this.logApiEvent(societeId, 'API_REQUEST', 'cancelMandate', { mandateId });

    try {
      const gcMandate = await client.mandates.cancel(mandateId, {});

      await this.logApiEvent(societeId, 'API_RESPONSE', 'cancelMandate', gcMandate);

      // Update local entity
      const localMandate = await this.gcMandateRepo.findOne({
        where: { mandateId },
      });

      if (localMandate) {
        localMandate.status = MandateStatus.CANCELLED;
        await this.gcMandateRepo.save(localMandate);
      }

      return {
        id: localMandate?.id ?? '',
        clientId: localMandate?.clientId ?? '',
        mandateId,
        status: 'CANCELLED',
        scheme: gcMandate.scheme ?? '',
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'cancelMandate', null, error);
      throw this.mapError('cancelMandate', error);
    }
  }

  // -----------------------------------------------------------------------
  // Payment operations
  // -----------------------------------------------------------------------

  async createPayment(
    societeId: string,
    clientId: string,
    amountCents: number,
    currency: string,
    description?: string,
    chargeDate?: string,
    metadata?: Record<string, string>,
  ): Promise<GoCardlessPaymentResult> {
    // Retrieve active mandate for client
    const mandate = await this.gcMandateRepo.findOne({
      where: { societeId, clientId, status: MandateStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!mandate) {
      throw new Error(`No active GoCardless mandate found for clientId ${clientId}`);
    }

    const client = await this.getClient(societeId);

    const params: Record<string, any> = {
      amount: amountCents,
      currency: currency.toUpperCase(),
      description: description ?? undefined,
      charge_date: chargeDate ?? undefined,
      metadata: metadata ?? {},
      links: {
        mandate: mandate.mandateId,
      },
    };

    await this.logApiEvent(societeId, 'API_REQUEST', 'createPayment', params);

    try {
      const payment = await client.payments.create(params as any);

      await this.logApiEvent(societeId, 'API_RESPONSE', 'createPayment', payment);

      return {
        id: payment.id ?? '',
        paymentId: payment.id ?? '',
        amount: parseInt(payment.amount ?? String(amountCents), 10),
        currency: payment.currency ?? currency,
        status: payment.status ?? 'pending_submission',
        chargeDate: payment.charge_date ?? undefined,
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'createPayment', null, error);
      throw this.mapError('createPayment', error);
    }
  }

  // -----------------------------------------------------------------------
  // Subscription operations
  // -----------------------------------------------------------------------

  async createSubscription(
    societeId: string,
    clientId: string,
    amountCents: number,
    currency: string,
    intervalUnit: string,
    interval: number,
    name?: string,
    startDate?: string,
    count?: number,
    metadata?: Record<string, string>,
  ): Promise<GoCardlessSubscriptionResult> {
    const mandate = await this.gcMandateRepo.findOne({
      where: { societeId, clientId, status: MandateStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!mandate) {
      throw new Error(`No active GoCardless mandate found for clientId ${clientId}`);
    }

    const client = await this.getClient(societeId);

    const params: Record<string, any> = {
      amount: amountCents,
      currency: currency.toUpperCase(),
      interval_unit: intervalUnit,
      interval,
      name: name ?? undefined,
      start_date: startDate ?? undefined,
      count: count ?? undefined,
      metadata: metadata ?? {},
      links: {
        mandate: mandate.mandateId,
      },
    };

    await this.logApiEvent(societeId, 'API_REQUEST', 'createSubscription', params);

    try {
      const subscription = await client.subscriptions.create(params as any);

      await this.logApiEvent(societeId, 'API_RESPONSE', 'createSubscription', subscription);

      return {
        id: subscription.id ?? '',
        subscriptionId: subscription.id ?? '',
        amount: parseInt(subscription.amount ?? String(amountCents), 10),
        currency: subscription.currency ?? currency,
        status: subscription.status ?? 'active',
        intervalUnit: subscription.interval_unit ?? intervalUnit,
        interval: parseInt(subscription.interval ?? String(interval), 10),
        nextPaymentDate: subscription.upcoming_payments?.[0]?.charge_date ?? undefined,
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'createSubscription', null, error);
      throw this.mapError('createSubscription', error);
    }
  }

  async cancelSubscription(
    societeId: string,
    subscriptionId: string,
  ): Promise<GoCardlessSubscriptionResult> {
    const client = await this.getClient(societeId);

    await this.logApiEvent(societeId, 'API_REQUEST', 'cancelSubscription', { subscriptionId });

    try {
      const subscription = await client.subscriptions.cancel(subscriptionId, {});

      await this.logApiEvent(societeId, 'API_RESPONSE', 'cancelSubscription', subscription);

      return {
        id: subscription.id ?? '',
        subscriptionId: subscription.id ?? '',
        amount: parseInt(subscription.amount ?? '0', 10),
        currency: subscription.currency ?? 'EUR',
        status: 'cancelled',
        intervalUnit: subscription.interval_unit ?? '',
        interval: parseInt(subscription.interval ?? '0', 10),
      };
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'cancelSubscription', null, error);
      throw this.mapError('cancelSubscription', error);
    }
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private normalizeMandateStatus(gcStatus: string): MandateStatus {
    const map: Record<string, MandateStatus> = {
      pending_customer_approval: MandateStatus.PENDING_CUSTOMER_APPROVAL,
      pending_submission: MandateStatus.PENDING_SUBMISSION,
      submitted: MandateStatus.SUBMITTED,
      active: MandateStatus.ACTIVE,
      suspended_by_payer: MandateStatus.SUSPENDED_BY_PAYER,
      failed: MandateStatus.FAILED,
      cancelled: MandateStatus.CANCELLED,
      expired: MandateStatus.EXPIRED,
      consumed: MandateStatus.CONSUMED,
      blocked: MandateStatus.BLOCKED,
    };
    return map[gcStatus.toLowerCase()] ?? MandateStatus.PENDING_CUSTOMER_APPROVAL;
  }

  private async logApiEvent(
    societeId: string,
    direction: string,
    operation: string,
    payload: Record<string, any> | null,
    error?: unknown,
  ): Promise<void> {
    try {
      const event = new PaymentEventEntity();
      event.societeId = societeId;
      event.provider = PaymentProvider.GOCARDLESS;
      event.eventType =
        direction === 'API_REQUEST'
          ? PaymentEventType.WEBHOOK_RECEIVED
          : PaymentEventType.WEBHOOK_PROCESSED;
      event.payload = {
        direction,
        operation,
        data: payload,
        ...(error ? { error: String(error) } : {}),
      };
      event.processed = true;

      await this.paymentEventRepo.save(event);
    } catch (logError) {
      this.logger.error(`Failed to log API event: ${logError}`);
    }
  }

  private mapError(operation: string, error: unknown): Error {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`GoCardless ${operation} failed: ${message}`);
    return new Error(`GoCardless ${operation} failed: ${message}`);
  }
}

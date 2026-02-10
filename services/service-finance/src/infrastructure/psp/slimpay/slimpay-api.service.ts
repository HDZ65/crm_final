import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import {
  SlimpayAccountEntity,
  PaymentEventEntity,
  PaymentEventType,
  PaymentProvider,
} from '../../../domain/payments/entities';
import { EncryptionService } from '../../security/encryption.service';
import { IbanMaskingService } from '../../security/iban-masking.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlimpayMandateParams {
  societeId: string;
  clientId: string;
  scheme: string;
  subscriberReference: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  iban?: string;
  bic?: string;
  successUrl: string;
  failureUrl: string;
  metadata?: Record<string, string>;
}

export interface SlimpayMandateResult {
  id: string;
  mandateId: string;
  clientId: string;
  status: string;
  scheme: string;
  rum: string;
  subscriberReference?: string;
  bankName?: string;
  ibanLast4?: string;
  bic?: string;
  signatureDate?: string;
  redirectUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SlimpayPaymentParams {
  societeId: string;
  mandateId: string;
  amountCents: number;
  currency: string;
  label: string;
  executionDate?: string;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
}

export interface SlimpayPaymentResult {
  id: string;
  paymentId: string;
  mandateId: string;
  amountCents: number;
  currency: string;
  status: string;
  label?: string;
  executionDate?: string;
  rejectionReason?: string;
  rejectionCode?: string;
  createdAt: string;
  updatedAt?: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number; // epoch ms
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class SlimpayApiService {
  private readonly logger = new Logger(SlimpayApiService.name);
  private readonly tokenCache = new Map<string, TokenCache>();

  /** Buffer before token expiry (60 s) to ensure we refresh proactively. */
  private readonly TOKEN_REFRESH_BUFFER_MS = 60_000;

  constructor(
    @InjectRepository(SlimpayAccountEntity)
    private readonly slimpayAccountRepo: Repository<SlimpayAccountEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepo: Repository<PaymentEventEntity>,
    private readonly encryptionService: EncryptionService,
    private readonly ibanMaskingService: IbanMaskingService,
  ) {}

  // -----------------------------------------------------------------------
  // OAuth2 Authentication
  // -----------------------------------------------------------------------

  async authenticate(societeId: string): Promise<string> {
    const cached = this.tokenCache.get(societeId);
    if (cached && cached.expiresAt - this.TOKEN_REFRESH_BUFFER_MS > Date.now()) {
      return cached.accessToken;
    }

    const account = await this.getAccount(societeId);
    const baseUrl = this.getBaseUrl(account);

    const credentials = Buffer.from(`${account.appName}:${account.appSecret}`).toString('base64');

    const response = await this.httpPost(
      `${baseUrl}/oauth/token`,
      'grant_type=client_credentials&scope=api',
      {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    );

    const body = JSON.parse(response);
    const expiresInMs = (body.expires_in ?? 3600) * 1000;

    this.tokenCache.set(societeId, {
      accessToken: body.access_token,
      expiresAt: Date.now() + expiresInMs,
    });

    return body.access_token;
  }

  // -----------------------------------------------------------------------
  // Mandate operations
  // -----------------------------------------------------------------------

  async createMandate(params: SlimpayMandateParams): Promise<SlimpayMandateResult> {
    const account = await this.getAccount(params.societeId);
    const token = await this.authenticate(params.societeId);
    const baseUrl = this.getBaseUrl(account);

    // Encrypt IBAN before sending if provided (log masked version)
    let ibanForApi: string | undefined;
    if (params.iban) {
      this.logger.log(
        `Creating mandate for subscriber ${params.subscriberReference}, IBAN: ${this.ibanMaskingService.mask(params.iban)}`,
      );
      ibanForApi = params.iban; // Send plain to Slimpay API
    }

    const payload = {
      creditor: { reference: account.appName },
      subscriber: { reference: params.subscriberReference },
      mandate: {
        signatory: {
          honorificPrefix: '',
          familyName: params.lastName,
          givenName: params.firstName,
          email: params.email,
          telephone: params.phone ?? undefined,
          billingAddress: {},
          bankAccount: ibanForApi
            ? { iban: ibanForApi, bic: params.bic ?? undefined }
            : undefined,
        },
        standard: params.scheme === 'sepa_b2b' ? 'SEPA.B2B' : 'SEPA.CORE',
      },
      started: true,
      locale: 'fr',
      paymentScheme: params.scheme === 'sepa_b2b' ? 'SEPA.DIRECT_DEBIT.B2B' : 'SEPA.DIRECT_DEBIT.CORE',
      successUrl: params.successUrl,
      failureUrl: params.failureUrl,
    };

    await this.logApiEvent(params.societeId, 'API_REQUEST', 'createMandate', payload);

    try {
      const rawResponse = await this.httpPost(
        `${baseUrl}/orders`,
        JSON.stringify(payload),
        {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/hal+json',
          Accept: 'application/hal+json',
        },
      );

      const body = JSON.parse(rawResponse);
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createMandate', body);

      return this.mapMandateResponse(body, params.clientId);
    } catch (error) {
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createMandate', null, error);
      throw this.mapError('createMandate', error);
    }
  }

  async getMandate(mandateId: string, societeId: string): Promise<SlimpayMandateResult> {
    const account = await this.getAccount(societeId);
    const token = await this.authenticate(societeId);
    const baseUrl = this.getBaseUrl(account);

    await this.logApiEvent(societeId, 'API_REQUEST', 'getMandate', { mandateId });

    try {
      const rawResponse = await this.httpGet(
        `${baseUrl}/mandates/${mandateId}`,
        {
          Authorization: `Bearer ${token}`,
          Accept: 'application/hal+json',
        },
      );

      const body = JSON.parse(rawResponse);
      await this.logApiEvent(societeId, 'API_RESPONSE', 'getMandate', body);

      return this.mapMandateResponse(body);
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'getMandate', null, error);
      throw this.mapError('getMandate', error);
    }
  }

  async cancelMandate(mandateId: string, societeId: string, reason?: string): Promise<SlimpayMandateResult> {
    const account = await this.getAccount(societeId);
    const token = await this.authenticate(societeId);
    const baseUrl = this.getBaseUrl(account);

    const payload = { reason: reason ?? 'Cancellation requested' };
    await this.logApiEvent(societeId, 'API_REQUEST', 'cancelMandate', { mandateId, ...payload });

    try {
      const rawResponse = await this.httpPatch(
        `${baseUrl}/mandates/${mandateId}`,
        JSON.stringify({ state: 'revoked' }),
        {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/hal+json',
          Accept: 'application/hal+json',
        },
      );

      const body = JSON.parse(rawResponse);
      await this.logApiEvent(societeId, 'API_RESPONSE', 'cancelMandate', body);

      return this.mapMandateResponse(body);
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'cancelMandate', null, error);
      throw this.mapError('cancelMandate', error);
    }
  }

  // -----------------------------------------------------------------------
  // Payment operations
  // -----------------------------------------------------------------------

  async createPayment(params: SlimpayPaymentParams): Promise<SlimpayPaymentResult> {
    const account = await this.getAccount(params.societeId);
    const token = await this.authenticate(params.societeId);
    const baseUrl = this.getBaseUrl(account);

    const payload = {
      creditor: { reference: account.appName },
      mandate: { reference: params.mandateId },
      amount: (params.amountCents / 100).toFixed(2),
      currency: params.currency,
      label: params.label,
      executionDate: params.executionDate ?? undefined,
      executionStatus: 'toprocess',
      scheme: 'SEPA.DIRECT_DEBIT.CORE',
    };

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/hal+json',
      Accept: 'application/hal+json',
    };

    if (params.idempotencyKey) {
      headers['Idempotency-Key'] = params.idempotencyKey;
    }

    await this.logApiEvent(params.societeId, 'API_REQUEST', 'createPayment', payload);

    try {
      const rawResponse = await this.httpPost(
        `${baseUrl}/direct-debits`,
        JSON.stringify(payload),
        headers,
      );

      const body = JSON.parse(rawResponse);
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createPayment', body);

      return this.mapPaymentResponse(body);
    } catch (error) {
      await this.logApiEvent(params.societeId, 'API_RESPONSE', 'createPayment', null, error);
      throw this.mapError('createPayment', error);
    }
  }

  async getPayment(paymentId: string, societeId: string): Promise<SlimpayPaymentResult> {
    const account = await this.getAccount(societeId);
    const token = await this.authenticate(societeId);
    const baseUrl = this.getBaseUrl(account);

    await this.logApiEvent(societeId, 'API_REQUEST', 'getPayment', { paymentId });

    try {
      const rawResponse = await this.httpGet(
        `${baseUrl}/direct-debits/${paymentId}`,
        {
          Authorization: `Bearer ${token}`,
          Accept: 'application/hal+json',
        },
      );

      const body = JSON.parse(rawResponse);
      await this.logApiEvent(societeId, 'API_RESPONSE', 'getPayment', body);

      return this.mapPaymentResponse(body);
    } catch (error) {
      await this.logApiEvent(societeId, 'API_RESPONSE', 'getPayment', null, error);
      throw this.mapError('getPayment', error);
    }
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private async getAccount(societeId: string): Promise<SlimpayAccountEntity> {
    const account = await this.slimpayAccountRepo.findOne({
      where: { societeId, actif: true },
    });

    if (!account) {
      throw new Error(`No active Slimpay account found for societeId ${societeId}`);
    }

    if (!account.isConfigured()) {
      throw new Error(`Slimpay account ${account.id} is not fully configured`);
    }

    return account;
  }

  private getBaseUrl(account: SlimpayAccountEntity): string {
    if (account.isSandbox) {
      return process.env.SLIMPAY_API_URL ?? 'https://api.preprod.slimpay.com';
    }
    return process.env.SLIMPAY_API_URL ?? 'https://api.slimpay.com';
  }

  private mapMandateResponse(body: Record<string, any>, clientId?: string): SlimpayMandateResult {
    return {
      id: body.id ?? '',
      mandateId: body.reference ?? body.id ?? '',
      clientId: clientId ?? '',
      status: this.normalizeMandateStatus(body.state ?? body.executionStatus ?? ''),
      scheme: body.standard ?? '',
      rum: body.rum ?? body.reference ?? '',
      subscriberReference: body._embedded?.subscriber?.reference,
      bankName: body._embedded?.bankAccount?.institutionName,
      ibanLast4: body._embedded?.bankAccount?.iban
        ? body._embedded.bankAccount.iban.slice(-4)
        : undefined,
      bic: body._embedded?.bankAccount?.bic,
      signatureDate: body.dateSigned,
      redirectUrl: body._links?.['https://api.slimpay.net/alps#user-approval']?.href,
      createdAt: body.dateCreated ?? new Date().toISOString(),
      updatedAt: body.dateModified,
    };
  }

  private mapPaymentResponse(body: Record<string, any>): SlimpayPaymentResult {
    return {
      id: body.id ?? '',
      paymentId: body.reference ?? body.id ?? '',
      mandateId: body._embedded?.mandate?.reference ?? '',
      amountCents: Math.round(parseFloat(body.amount ?? '0') * 100),
      currency: body.currency ?? 'EUR',
      status: this.normalizePaymentStatus(body.executionStatus ?? ''),
      label: body.label,
      executionDate: body.executionDate,
      rejectionReason: body.rejectReason,
      rejectionCode: body.rejectReasonCode,
      createdAt: body.dateCreated ?? new Date().toISOString(),
      updatedAt: body.dateModified,
    };
  }

  private normalizeMandateStatus(slimpayStatus: string): string {
    const map: Record<string, string> = {
      created: 'PENDING',
      active: 'ACTIVE',
      suspended: 'SUSPENDED',
      revoked: 'REVOKED',
      cancelled: 'CANCELLED',
    };
    return map[slimpayStatus.toLowerCase()] ?? slimpayStatus.toUpperCase();
  }

  private normalizePaymentStatus(slimpayStatus: string): string {
    const map: Record<string, string> = {
      toprocess: 'PENDING',
      created: 'PENDING',
      accepted: 'PROCESSING',
      executed: 'EXECUTED',
      rejected: 'REJECTED',
      cancelled: 'CANCELLED',
      refunded: 'REFUNDED',
    };
    return map[slimpayStatus.toLowerCase()] ?? slimpayStatus.toUpperCase();
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
      event.provider = PaymentProvider.SLIMPAY;
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
    this.logger.error(`Slimpay ${operation} failed: ${message}`);
    return new Error(`Slimpay ${operation} failed: ${message}`);
  }

  // -----------------------------------------------------------------------
  // HTTP helpers (using native fetch)
  // -----------------------------------------------------------------------

  private async httpPost(
    url: string,
    body: string,
    headers: Record<string, string>,
  ): Promise<string> {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
    }

    return text;
  }

  private async httpGet(
    url: string,
    headers: Record<string, string>,
  ): Promise<string> {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
    }

    return text;
  }

  private async httpPatch(
    url: string,
    body: string,
    headers: Record<string, string>,
  ): Promise<string> {
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`);
    }

    return text;
  }
}

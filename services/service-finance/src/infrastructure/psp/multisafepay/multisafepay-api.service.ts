import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MultiSafepayAccountEntity,
  PaymentEventEntity,
  PaymentEventType,
  PaymentProvider,
} from '../../../domain/payments/entities';
import { EncryptionService } from '../../security';

// ─── MSP Types ───────────────────────────────────────────────

export interface MSPCreateTransactionParams {
  societeId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  paymentType: string; // 'redirect' | 'direct'
  gateway: string; // 'IDEAL', 'VISA', 'MASTERCARD', 'BANCONTACT', etc.
  description?: string;
  notificationUrl: string;
  redirectUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  metadata?: Record<string, string>;
}

export interface MSPTransactionResult {
  id: string;
  transactionId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: string;
  gateway: string;
  paymentUrl?: string;
  reason?: string;
  createdAt: string;
  updatedAt?: string;
}

interface MSPApiResponse {
  success: boolean;
  data: Record<string, any>;
  error_code?: number;
  error_info?: string;
}

// ─── Service ─────────────────────────────────────────────────

@Injectable()
export class MultiSafepayApiService {
  private readonly logger = new Logger(MultiSafepayApiService.name);
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(MultiSafepayAccountEntity)
    private readonly mspAccountRepo: Repository<MultiSafepayAccountEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepo: Repository<PaymentEventEntity>,
    private readonly encryptionService: EncryptionService,
  ) {
    this.baseUrl =
      process.env.MULTISAFEPAY_API_URL ??
      'https://testapi.multisafepay.com/v1/json/';
  }

  // ─── Public API ──────────────────────────────────────────

  async createTransaction(
    params: MSPCreateTransactionParams,
  ): Promise<MSPTransactionResult> {
    const account = await this.getActiveAccount(params.societeId);
    const apiKey = this.decryptApiKey(account.apiKey);

    const body = {
      type: params.paymentType,
      order_id: params.orderId,
      currency: params.currency,
      amount: params.amountCents,
      gateway: params.gateway,
      description: params.description ?? `Payment ${params.orderId}`,
      payment_options: {
        notification_url: params.notificationUrl,
        redirect_url: params.redirectUrl,
        cancel_url: params.cancelUrl,
      },
      ...(params.customerEmail || params.customerFirstName
        ? {
            customer: {
              email: params.customerEmail,
              first_name: params.customerFirstName,
              last_name: params.customerLastName,
            },
          }
        : {}),
      ...(params.metadata ? { var1: JSON.stringify(params.metadata) } : {}),
    };

    const response = await this.callApi<MSPApiResponse>(
      apiKey,
      'orders',
      'POST',
      body,
    );

    const result = this.toTransactionResult(response.data, params.orderId);

    await this.logEvent(
      params.societeId,
      PaymentEventType.PAYMENT_CREATED,
      result.transactionId,
      { request: { ...body, api_key: '***REDACTED***' }, response: response.data },
    );

    return result;
  }

  async getTransaction(
    orderId: string,
    societeId: string,
  ): Promise<MSPTransactionResult> {
    const account = await this.getActiveAccount(societeId);
    const apiKey = this.decryptApiKey(account.apiKey);

    const response = await this.callApi<MSPApiResponse>(
      apiKey,
      `orders/${orderId}`,
      'GET',
    );

    const result = this.toTransactionResult(response.data, orderId);

    await this.logEvent(
      societeId,
      PaymentEventType.WEBHOOK_RECEIVED,
      result.transactionId,
      { response: response.data },
    );

    return result;
  }

  async refundTransaction(
    orderId: string,
    amountCents: number,
    societeId: string,
    description?: string,
  ): Promise<MSPTransactionResult> {
    const account = await this.getActiveAccount(societeId);
    const apiKey = this.decryptApiKey(account.apiKey);

    const body = {
      currency: 'EUR',
      amount: amountCents,
      description: description ?? `Refund for order ${orderId}`,
    };

    const response = await this.callApi<MSPApiResponse>(
      apiKey,
      `orders/${orderId}/refunds`,
      'POST',
      body,
    );

    const result = this.toTransactionResult(response.data, orderId);

    await this.logEvent(
      societeId,
      PaymentEventType.REFUND_CREATED,
      result.transactionId,
      { request: body, response: response.data },
    );

    return result;
  }

  // ─── Private Helpers ─────────────────────────────────────

  private async getActiveAccount(
    societeId: string,
  ): Promise<MultiSafepayAccountEntity> {
    const account = await this.mspAccountRepo.findOne({
      where: { societeId, actif: true },
    });

    if (!account) {
      throw new Error(
        `No active MultiSafepay account found for société ${societeId}`,
      );
    }

    if (!account.isConfigured()) {
      throw new Error(
        `MultiSafepay account ${account.id} is not configured (missing API key)`,
      );
    }

    return account;
  }

  private decryptApiKey(encryptedKey: string): string {
    try {
      if (this.encryptionService.isEncrypted(encryptedKey)) {
        return this.encryptionService.decrypt(encryptedKey);
      }
      return encryptedKey;
    } catch (error) {
      this.logger.error('Failed to decrypt MultiSafepay API key');
      throw new Error('Failed to decrypt API key');
    }
  }

  private async callApi<T>(
    apiKey: string,
    endpoint: string,
    method: 'GET' | 'POST',
    body?: Record<string, any>,
  ): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      api_key: apiKey,
    };

    const options: RequestInit = {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    this.logger.debug(`MSP API ${method} ${endpoint}`);

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `MSP API error: ${response.status} ${response.statusText} - ${errorBody}`,
      );
      throw new Error(
        `MultiSafepay API error: ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as T;
    const apiResponse = json as unknown as MSPApiResponse;

    if (!apiResponse.success) {
      this.logger.error(
        `MSP API failure: ${apiResponse.error_code} - ${apiResponse.error_info}`,
      );
      throw new Error(
        `MultiSafepay API failure: ${apiResponse.error_info ?? 'Unknown error'}`,
      );
    }

    return json;
  }

  private toTransactionResult(
    data: Record<string, any>,
    orderId: string,
  ): MSPTransactionResult {
    return {
      id: data.order_id ?? data.transaction_id ?? orderId,
      transactionId: data.transaction_id ?? data.order_id ?? orderId,
      orderId: data.order_id ?? orderId,
      amountCents: data.amount ?? 0,
      currency: data.currency ?? 'EUR',
      status: (data.status ?? 'unknown').toUpperCase(),
      gateway: data.gateway ?? '',
      paymentUrl: data.payment_url ?? undefined,
      reason: data.reason ?? undefined,
      createdAt: data.created ?? new Date().toISOString(),
      updatedAt: data.modified ?? undefined,
    };
  }

  private async logEvent(
    societeId: string,
    eventType: PaymentEventType,
    providerEventId: string,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      const event = this.paymentEventRepo.create({
        societeId,
        provider: PaymentProvider.MULTISAFEPAY,
        eventType,
        providerEventId,
        payload,
        processed: true,
      });
      await this.paymentEventRepo.save(event);
    } catch (error) {
      this.logger.warn(`Failed to log payment event: ${error}`);
    }
  }
}

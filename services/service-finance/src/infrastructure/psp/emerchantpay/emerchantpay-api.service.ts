import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmerchantpayAccountEntity } from '../../../domain/payments/entities/emerchantpay-account.entity';
import { PaymentEventEntity, PaymentEventType } from '../../../domain/payments/entities/payment-event.entity';
import { PaymentProvider } from '../../../domain/payments/entities/schedule.entity';
import { EncryptionService } from '../../security';

// ==================== Types ====================

export interface EMPPaymentParams {
  societeId: string;
  transactionId: string;
  amountCents: number;
  currency: string;
  transactionType: string; // 'sale', 'authorize', 'init_recurring_sale'
  cardToken?: string; // tokenized card reference — never raw PAN
  cardHolder?: string;
  notificationUrl: string;
  returnSuccessUrl: string;
  returnFailureUrl: string;
  customerEmail?: string;
  customerPhone?: string;
  billingAddress?: string; // JSON string
  metadata?: Record<string, string>;
}

export interface EMPSepaPaymentParams {
  societeId: string;
  transactionId: string;
  amountCents: number;
  currency: string;
  iban: string; // will be encrypted before storage
  bic: string;
  accountHolder: string;
  mandateReference?: string;
  mandateSignedDate?: string;
  notificationUrl: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface EMPPaymentResult {
  id: string;
  transactionId: string;
  uniqueId: string;
  amountCents: number;
  currency: string;
  status: string;
  transactionType: string;
  redirectUrl?: string;
  reason?: string;
  responseCode?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== Service ====================

@Injectable()
export class EmerchantpayApiService {
  private readonly logger = new Logger(EmerchantpayApiService.name);
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(EmerchantpayAccountEntity)
    private readonly accountRepo: Repository<EmerchantpayAccountEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly eventRepo: Repository<PaymentEventEntity>,
    private readonly encryptionService: EncryptionService,
  ) {
    this.baseUrl = process.env.EMERCHANTPAY_API_URL || 'https://staging.gate.emerchantpay.net';
  }

  // ==================== Card Payment ====================

  async createPayment(params: EMPPaymentParams): Promise<EMPPaymentResult> {
    const account = await this.getAccountForSociete(params.societeId);

    const body: Record<string, unknown> = {
      transaction_id: params.transactionId,
      transaction_type: params.transactionType,
      amount: params.amountCents,
      currency: params.currency,
      card_holder: params.cardHolder,
      notification_url: params.notificationUrl,
      return_success_url: params.returnSuccessUrl,
      return_failure_url: params.returnFailureUrl,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
    };

    // Use tokenized card reference only — raw PAN/CVV must never reach this service
    if (params.cardToken) {
      body.token = params.cardToken;
    }

    if (params.billingAddress) {
      try {
        body.billing_address = JSON.parse(params.billingAddress);
      } catch {
        body.billing_address = params.billingAddress;
      }
    }

    const result = await this.callApi<EMPApiResponse>(
      account,
      'POST',
      '/transactions',
      body,
    );

    await this.logEvent(params.societeId, params.transactionId, PaymentEventType.PAYMENT_CREATED, result);

    return this.mapToResult(result);
  }

  // ==================== Get Payment ====================

  async getPayment(paymentId: string, societeId: string): Promise<EMPPaymentResult> {
    const account = await this.getAccountForSociete(societeId);

    const result = await this.callApi<EMPApiResponse>(
      account,
      'GET',
      `/transactions/${paymentId}`,
    );

    return this.mapToResult(result);
  }

  // ==================== SEPA Direct Debit ====================

  async createSepaPayment(params: EMPSepaPaymentParams): Promise<EMPPaymentResult> {
    const account = await this.getAccountForSociete(params.societeId);

    // Encrypt IBAN before including in any payload or log
    const encryptedIban = this.encryptionService.encrypt(params.iban);

    const body: Record<string, unknown> = {
      transaction_id: params.transactionId,
      transaction_type: 'sdd_sale', // SEPA Direct Debit
      amount: params.amountCents,
      currency: params.currency,
      iban: params.iban, // sent to EMP API (over TLS), but never stored in clear
      bic: params.bic,
      account_holder: params.accountHolder,
      mandate_reference: params.mandateReference,
      mandate_signed_date: params.mandateSignedDate,
      notification_url: params.notificationUrl,
      description: params.description,
    };

    const result = await this.callApi<EMPApiResponse>(
      account,
      'POST',
      '/transactions',
      body,
    );

    // Log event with encrypted IBAN only
    await this.logEvent(
      params.societeId,
      params.transactionId,
      PaymentEventType.PAYMENT_CREATED,
      { ...result, iban_encrypted: encryptedIban },
    );

    return this.mapToResult(result);
  }

  // ==================== Refund ====================

  async refundPayment(
    paymentId: string,
    uniqueId: string,
    amountCents: number,
    societeId: string,
    reason?: string,
  ): Promise<EMPPaymentResult> {
    const account = await this.getAccountForSociete(societeId);

    const body: Record<string, unknown> = {
      transaction_type: 'refund',
      reference_id: uniqueId,
      amount: amountCents,
      reason,
    };

    const result = await this.callApi<EMPApiResponse>(
      account,
      'POST',
      '/transactions',
      body,
    );

    await this.logEvent(societeId, paymentId, PaymentEventType.REFUND_CREATED, result);

    return this.mapToResult(result);
  }

  // ==================== Private helpers ====================

  private async getAccountForSociete(societeId: string): Promise<EmerchantpayAccountEntity> {
    const account = await this.accountRepo.findOne({
      where: { societeId, actif: true },
    });

    if (!account) {
      throw new Error(`No active Emerchantpay account found for societe ${societeId}`);
    }

    if (!account.isConfigured()) {
      throw new Error(`Emerchantpay account ${account.id} is not fully configured`);
    }

    return account;
  }

  private async callApi<T>(
    account: EmerchantpayAccountEntity,
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${account.apiLogin}:${account.apiPassword}`).toString('base64')}`,
    };

    if (account.terminalToken) {
      headers['X-Terminal-Token'] = account.terminalToken;
    }

    this.logger.log(`EMP API ${method} ${path}`);

    try {
      const fetchOptions: RequestInit = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`EMP API error: ${response.status} ${errorBody}`);
        throw new Error(`Emerchantpay API error: ${response.status} — ${errorBody}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      this.logger.error(`EMP API call failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private async logEvent(
    societeId: string,
    transactionId: string,
    eventType: PaymentEventType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const event = this.eventRepo.create({
        societeId,
        provider: PaymentProvider.EMERCHANTPAY,
        eventType,
        providerEventId: transactionId,
        payload,
      });
      await this.eventRepo.save(event);
    } catch (error) {
      this.logger.error(`Failed to log payment event: ${(error as Error).message}`);
    }
  }

  private mapToResult(raw: EMPApiResponse): EMPPaymentResult {
    return {
      id: raw.unique_id || raw.transaction_unique_id || '',
      transactionId: raw.transaction_id || '',
      uniqueId: raw.unique_id || raw.transaction_unique_id || '',
      amountCents: raw.amount || 0,
      currency: raw.currency || '',
      status: (raw.status || 'unknown').toUpperCase(),
      transactionType: raw.transaction_type || '',
      redirectUrl: raw.redirect_url,
      reason: raw.message || raw.technical_message,
      responseCode: raw.response_code,
      createdAt: raw.timestamp || new Date().toISOString(),
      updatedAt: raw.timestamp,
    };
  }
}

// ==================== EMP API response shape (internal) ====================

interface EMPApiResponse {
  unique_id?: string;
  transaction_unique_id?: string;
  transaction_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  transaction_type?: string;
  redirect_url?: string;
  message?: string;
  technical_message?: string;
  response_code?: string;
  timestamp?: string;
  [key: string]: unknown;
}

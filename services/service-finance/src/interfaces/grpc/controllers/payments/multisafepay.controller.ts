import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  MultiSafepayApiService,
  MSPCreateTransactionParams,
} from '../../../../infrastructure/psp/multisafepay';

// ─── Request/Response interfaces (matching proto messages) ──

interface CreateMultiSafepayTransactionRequest {
  societe_id: string;
  order_id: string;
  amount_cents: number;
  currency: string;
  payment_type: string;
  gateway: string;
  description?: string;
  notification_url: string;
  redirect_url: string;
  cancel_url: string;
  customer_email?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  metadata?: Record<string, string>;
}

interface GetMultiSafepayTransactionRequest {
  transaction_id: string;
  societe_id: string;
}

interface RefundMultiSafepayTransactionRequest {
  transaction_id: string;
  societe_id: string;
  amount_cents: number;
  description?: string;
}

interface MultiSafepayTransactionResponse {
  id: string;
  transaction_id: string;
  order_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  gateway: string;
  payment_url?: string;
  reason?: string;
  created_at: string;
  updated_at?: string;
}

// ─── Controller ─────────────────────────────────────────────

@Controller()
export class MultiSafepayController {
  constructor(
    private readonly multiSafepayApiService: MultiSafepayApiService,
  ) {}

  @GrpcMethod('PaymentService', 'CreateMultiSafepayTransaction')
  async createTransaction(
    data: CreateMultiSafepayTransactionRequest,
  ): Promise<MultiSafepayTransactionResponse> {
    const params: MSPCreateTransactionParams = {
      societeId: data.societe_id,
      orderId: data.order_id,
      amountCents: data.amount_cents,
      currency: data.currency,
      paymentType: data.payment_type,
      gateway: data.gateway,
      description: data.description,
      notificationUrl: data.notification_url,
      redirectUrl: data.redirect_url,
      cancelUrl: data.cancel_url,
      customerEmail: data.customer_email,
      customerFirstName: data.customer_first_name,
      customerLastName: data.customer_last_name,
      metadata: data.metadata,
    };

    const result = await this.multiSafepayApiService.createTransaction(params);

    return {
      id: result.id,
      transaction_id: result.transactionId,
      order_id: result.orderId,
      amount_cents: result.amountCents,
      currency: result.currency,
      status: result.status,
      gateway: result.gateway,
      payment_url: result.paymentUrl,
      reason: result.reason,
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    };
  }

  @GrpcMethod('PaymentService', 'GetMultiSafepayTransaction')
  async getTransaction(
    data: GetMultiSafepayTransactionRequest,
  ): Promise<MultiSafepayTransactionResponse> {
    const result = await this.multiSafepayApiService.getTransaction(
      data.transaction_id,
      data.societe_id,
    );

    return {
      id: result.id,
      transaction_id: result.transactionId,
      order_id: result.orderId,
      amount_cents: result.amountCents,
      currency: result.currency,
      status: result.status,
      gateway: result.gateway,
      payment_url: result.paymentUrl,
      reason: result.reason,
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    };
  }

  @GrpcMethod('PaymentService', 'RefundMultiSafepayTransaction')
  async refundTransaction(
    data: RefundMultiSafepayTransactionRequest,
  ): Promise<MultiSafepayTransactionResponse> {
    const result = await this.multiSafepayApiService.refundTransaction(
      data.transaction_id,
      data.amount_cents,
      data.societe_id,
      data.description,
    );

    return {
      id: result.id,
      transaction_id: result.transactionId,
      order_id: result.orderId,
      amount_cents: result.amountCents,
      currency: result.currency,
      status: result.status,
      gateway: result.gateway,
      payment_url: result.paymentUrl,
      reason: result.reason,
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    };
  }
}

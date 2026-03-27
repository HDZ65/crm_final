import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  SlimpayApiService,
  SlimpayMandateParams,
  SlimpayPaymentParams,
} from '../../../../infrastructure/psp/slimpay/slimpay-api.service';
import type {
  CreateSlimpayMandateRequest,
  GetSlimpayMandateRequest,
  CancelSlimpayMandateRequest,
  CreateSlimpayPaymentRequest,
  GetSlimpayPaymentRequest,
  SlimpayMandateResponse,
  SlimpayPaymentResponse,
} from '@proto/payment';

@Controller()
export class SlimpayController {
  constructor(private readonly slimpayApi: SlimpayApiService) {}

  // -----------------------------------------------------------------------
  // Mandate RPCs
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'CreateSlimpayMandate')
  async createSlimpayMandate(data: CreateSlimpayMandateRequest): Promise<SlimpayMandateResponse> {
    const params: SlimpayMandateParams = {
      societeId: data.societe_id,
      clientId: data.client_id,
      scheme: data.scheme,
      subscriberReference: data.subscriber_reference,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone ?? undefined,
      iban: data.iban ?? undefined,
      bic: data.bic ?? undefined,
      successUrl: data.success_url,
      failureUrl: data.failure_url,
      metadata: data.metadata ?? {},
    };

    const result = await this.slimpayApi.createMandate(params);

    return {
      id: result.id,
      mandate_id: result.mandateId,
      client_id: result.clientId,
      status: result.status,
      scheme: result.scheme,
      rum: result.rum,
      subscriber_reference: result.subscriberReference,
      bank_name: result.bankName,
      iban_last4: result.ibanLast4,
      bic: result.bic,
      signature_date: result.signatureDate,
      redirect_url: result.redirectUrl,
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    };
  }

  @GrpcMethod('PaymentService', 'GetSlimpayMandate')
  async getSlimpayMandate(data: GetSlimpayMandateRequest): Promise<SlimpayMandateResponse> {
    const result = await this.slimpayApi.getMandate(data.mandate_id, data.societe_id);

    return {
      id: result.id,
      mandate_id: result.mandateId,
      client_id: result.clientId,
      status: result.status,
      scheme: result.scheme,
      rum: result.rum,
      subscriber_reference: result.subscriberReference,
      bank_name: result.bankName,
      iban_last4: result.ibanLast4,
      bic: result.bic,
      signature_date: result.signatureDate,
      redirect_url: result.redirectUrl,
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    };
  }

  @GrpcMethod('PaymentService', 'CancelSlimpayMandate')
  async cancelSlimpayMandate(data: CancelSlimpayMandateRequest): Promise<SlimpayMandateResponse> {
    const result = await this.slimpayApi.cancelMandate(
      data.mandate_id,
      data.societe_id,
      data.reason ?? undefined,
    );

    return {
      id: result.id,
      mandate_id: result.mandateId,
      client_id: result.clientId,
      status: result.status,
      scheme: result.scheme,
      rum: result.rum,
      subscriber_reference: result.subscriberReference,
      bank_name: result.bankName,
      iban_last4: result.ibanLast4,
      bic: result.bic,
      signature_date: result.signatureDate,
      redirect_url: result.redirectUrl,
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    };
  }

  // -----------------------------------------------------------------------
  // Payment RPCs
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'CreateSlimpayPayment')
  async createSlimpayPayment(data: CreateSlimpayPaymentRequest): Promise<SlimpayPaymentResponse> {
    const params: SlimpayPaymentParams = {
      societeId: data.societe_id,
      mandateId: data.mandate_id,
      amountCents: Number(data.amount_cents),
      currency: data.currency,
      label: data.label,
      executionDate: data.execution_date ?? undefined,
      idempotencyKey: data.idempotency_key ?? undefined,
      metadata: data.metadata ?? {},
    };

    const result = await this.slimpayApi.createPayment(params);

    return {
      id: result.id,
      payment_id: result.paymentId,
      mandate_id: result.mandateId,
      amount_cents: result.amountCents,
      currency: result.currency,
      status: result.status,
      label: result.label,
      execution_date: result.executionDate,
      rejection_reason: result.rejectionReason,
      rejection_code: result.rejectionCode,
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    };
  }

  @GrpcMethod('PaymentService', 'GetSlimpayPayment')
  async getSlimpayPayment(data: GetSlimpayPaymentRequest): Promise<SlimpayPaymentResponse> {
    const result = await this.slimpayApi.getPayment(data.payment_id, data.societe_id);

    return {
      id: result.id,
      payment_id: result.paymentId,
      mandate_id: result.mandateId,
      amount_cents: result.amountCents,
      currency: result.currency,
      status: result.status,
      label: result.label,
      execution_date: result.executionDate,
      rejection_reason: result.rejectionReason,
      rejection_code: result.rejectionCode,
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    };
  }
}

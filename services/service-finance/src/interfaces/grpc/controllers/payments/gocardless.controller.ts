import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GoCardlessApiService } from '../../../../infrastructure/psp/gocardless/gocardless-api.service';
import type {
  SetupGoCardlessMandateRequest,
  GoCardlessMandateResponse,
  GetGoCardlessMandateRequest,
  CreateGoCardlessPaymentRequest,
  GoCardlessPaymentResponse,
  CreateGoCardlessSubscriptionRequest,
  GoCardlessSubscriptionResponse,
  CancelGoCardlessSubscriptionRequest,
} from '@proto/payment';

@Controller()
export class GoCardlessController {
  constructor(private readonly gcApi: GoCardlessApiService) {}

  // -----------------------------------------------------------------------
  // Mandate RPCs
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'SetupGoCardlessMandate')
  async setupGoCardlessMandate(data: SetupGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    const result = await this.gcApi.setupMandate(
      data.societe_id,
      data.client_id,
      data.scheme,
      data.description ?? undefined,
      data.success_redirect_url,
      data.session_token ?? undefined,
    );

    return {
      id: result.id,
      client_id: result.clientId,
      mandate_id: result.mandateId,
      status: result.status,
      scheme: result.scheme,
      bank_name: result.bankName,
      account_holder_name: result.accountHolderName,
      account_number_ending: result.accountNumberEnding,
      redirect_url: result.redirectUrl,
    };
  }

  @GrpcMethod('PaymentService', 'GetGoCardlessMandate')
  async getGoCardlessMandate(data: GetGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    const result = await this.gcApi.getMandate(data.societe_id, data.client_id);

    return {
      id: result.id,
      client_id: result.clientId,
      mandate_id: result.mandateId,
      status: result.status,
      scheme: result.scheme,
      bank_name: result.bankName,
      account_holder_name: result.accountHolderName,
      account_number_ending: result.accountNumberEnding,
      redirect_url: undefined,
    };
  }

  @GrpcMethod('PaymentService', 'CancelGoCardlessMandate')
  async cancelGoCardlessMandate(data: GetGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    // Get the active mandate first to find mandateId
    const activeMandate = await this.gcApi.getMandate(data.societe_id, data.client_id);
    const result = await this.gcApi.cancelMandate(data.societe_id, activeMandate.mandateId);

    return {
      id: result.id,
      client_id: result.clientId,
      mandate_id: result.mandateId,
      status: result.status,
      scheme: result.scheme,
      bank_name: result.bankName,
      account_holder_name: result.accountHolderName,
      account_number_ending: result.accountNumberEnding,
      redirect_url: undefined,
    };
  }

  // -----------------------------------------------------------------------
  // Payment RPCs
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'CreateGoCardlessPayment')
  async createGoCardlessPayment(data: CreateGoCardlessPaymentRequest): Promise<GoCardlessPaymentResponse> {
    const result = await this.gcApi.createPayment(
      data.societe_id,
      data.client_id,
      Number(data.amount),
      data.currency,
      data.description ?? undefined,
      data.charge_date ?? undefined,
      data.metadata ?? {},
    );

    return {
      id: result.id,
      payment_id: result.paymentId,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      charge_date: result.chargeDate,
    };
  }

  // -----------------------------------------------------------------------
  // Subscription RPCs
  // -----------------------------------------------------------------------

  @GrpcMethod('PaymentService', 'CreateGoCardlessSubscription')
  async createGoCardlessSubscription(data: CreateGoCardlessSubscriptionRequest): Promise<GoCardlessSubscriptionResponse> {
    const result = await this.gcApi.createSubscription(
      data.societe_id,
      data.client_id,
      Number(data.amount),
      data.currency,
      data.interval_unit,
      data.interval,
      data.name ?? undefined,
      data.start_date ?? undefined,
      data.count ?? undefined,
      data.metadata ?? {},
    );

    return {
      id: result.id,
      subscription_id: result.subscriptionId,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      interval_unit: result.intervalUnit,
      interval: result.interval,
      next_payment_date: result.nextPaymentDate,
    };
  }

  @GrpcMethod('PaymentService', 'CancelGoCardlessSubscription')
  async cancelGoCardlessSubscription(data: CancelGoCardlessSubscriptionRequest): Promise<GoCardlessSubscriptionResponse> {
    const result = await this.gcApi.cancelSubscription(
      data.societe_id,
      data.subscription_id,
    );

    return {
      id: result.id,
      subscription_id: result.subscriptionId,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      interval_unit: result.intervalUnit,
      interval: result.interval,
      next_payment_date: undefined,
    };
  }
}

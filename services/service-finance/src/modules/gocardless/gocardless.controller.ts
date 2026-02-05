import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { GoCardlessService } from './gocardless.service';
import type {
  SetupGoCardlessMandateRequest,
  GoCardlessMandateResponse,
  GetGoCardlessMandateRequest,
  CreateGoCardlessPaymentRequest,
  GoCardlessPaymentResponse,
} from '@crm/proto/payments';

@Controller()
export class GoCardlessController {
  private readonly logger = new Logger(GoCardlessController.name);

  constructor(private readonly goCardlessService: GoCardlessService) {}

  @GrpcMethod('PaymentService', 'SetupGoCardlessMandate')
  async setupGoCardlessMandate(data: SetupGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    try {
      this.logger.log(`SetupGoCardlessMandate for client: ${data.client_id}`);

      const result = await this.goCardlessService.createBillingRequest(data.societe_id, {
        clientId: data.client_id,
        description: data.description,
        redirectUri: data.success_redirect_url,
      });

      return {
        id: result.billingRequestId,
        client_id: data.client_id,
        mandate_id: '',
        status: 'pending_customer_approval',
        scheme: data.scheme || 'sepa_core',
        redirect_url: result.authorisationUrl,
      };
    } catch (e: unknown) {
      this.logger.error('SetupGoCardlessMandate failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'GetGoCardlessMandate')
  async getGoCardlessMandate(data: GetGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    try {
      this.logger.log(`GetGoCardlessMandate for client: ${data.client_id}`);

      const mandate = await this.goCardlessService.getActiveMandate(
        data.societe_id,
        data.client_id,
      );

      if (!mandate) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `No active mandate found for client ${data.client_id}`,
        });
      }

      return {
        id: mandate.id,
        client_id: mandate.clientId,
        mandate_id: mandate.mandateId,
        status: mandate.status,
        scheme: mandate.scheme,
        bank_name: mandate.bankName,
        account_holder_name: mandate.accountHolderName,
        account_number_ending: mandate.accountNumberEnding,
      };
    } catch (e: unknown) {
      if (e instanceof RpcException) throw e;
      this.logger.error('GetGoCardlessMandate failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CancelGoCardlessMandate')
  async cancelGoCardlessMandate(data: GetGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    try {
      this.logger.log(`CancelGoCardlessMandate for client: ${data.client_id}`);

      const mandate = await this.goCardlessService.getActiveMandate(
        data.societe_id,
        data.client_id,
      );

      if (!mandate) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `No active mandate found for client ${data.client_id}`,
        });
      }

      await this.goCardlessService.cancelMandate(data.societe_id, mandate.id);

      return {
        id: mandate.id,
        client_id: data.client_id,
        mandate_id: mandate.mandateId,
        status: 'cancelled',
        scheme: mandate.scheme,
      };
    } catch (e: unknown) {
      if (e instanceof RpcException) throw e;
      this.logger.error('CancelGoCardlessMandate failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CreateGoCardlessPayment')
  async createGoCardlessPayment(data: CreateGoCardlessPaymentRequest): Promise<GoCardlessPaymentResponse> {
    try {
      this.logger.log(`CreateGoCardlessPayment for client: ${data.client_id}`);

      const mandate = await this.goCardlessService.getActiveMandate(
        data.societe_id,
        data.client_id,
      );

      if (!mandate) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `No active mandate found for client ${data.client_id}`,
        });
      }

      const result = await this.goCardlessService.createPayment(data.societe_id, {
        mandateId: mandate.id,
        amount: data.amount / 100,
        currency: data.currency || 'EUR',
        description: data.description,
        chargeDate: data.charge_date,
        metadata: data.metadata,
      });

      return {
        id: result.paymentId,
        payment_id: result.paymentId,
        amount: data.amount,
        currency: data.currency || 'EUR',
        status: result.status,
        charge_date: result.chargeDate,
      };
    } catch (e: unknown) {
      if (e instanceof RpcException) throw e;
      this.logger.error('CreateGoCardlessPayment failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}

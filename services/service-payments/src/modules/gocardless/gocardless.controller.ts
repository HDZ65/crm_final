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
      this.logger.log(`SetupGoCardlessMandate for client: ${data.clientId}`);

      const result = await this.goCardlessService.createBillingRequest(data.societeId, {
        clientId: data.clientId,
        description: data.description,
        redirectUri: data.successRedirectUrl,
      });

      return {
        id: result.billingRequestId,
        clientId: data.clientId,
        mandateId: '',
        status: 'pending_customer_approval',
        scheme: data.scheme || 'sepa_core',
        redirectUrl: result.authorisationUrl,
      };
    } catch (e: unknown) {
      this.logger.error('SetupGoCardlessMandate failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'GetGoCardlessMandate')
  async getGoCardlessMandate(data: GetGoCardlessMandateRequest): Promise<GoCardlessMandateResponse> {
    try {
      this.logger.log(`GetGoCardlessMandate for client: ${data.clientId}`);

      const mandate = await this.goCardlessService.getActiveMandate(
        data.societeId,
        data.clientId,
      );

      if (!mandate) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `No active mandate found for client ${data.clientId}`,
        });
      }

      return {
        id: mandate.id,
        clientId: mandate.clientId,
        mandateId: mandate.mandateId,
        status: mandate.status,
        scheme: mandate.scheme,
        bankName: mandate.bankName,
        accountHolderName: mandate.accountHolderName,
        accountNumberEnding: mandate.accountNumberEnding,
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
      this.logger.log(`CancelGoCardlessMandate for client: ${data.clientId}`);

      const mandate = await this.goCardlessService.getActiveMandate(
        data.societeId,
        data.clientId,
      );

      if (!mandate) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `No active mandate found for client ${data.clientId}`,
        });
      }

      await this.goCardlessService.cancelMandate(data.societeId, mandate.id);

      return {
        id: mandate.id,
        clientId: data.clientId,
        mandateId: mandate.mandateId,
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
      this.logger.log(`CreateGoCardlessPayment for client: ${data.clientId}`);

      const mandate = await this.goCardlessService.getActiveMandate(
        data.societeId,
        data.clientId,
      );

      if (!mandate) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `No active mandate found for client ${data.clientId}`,
        });
      }

      const result = await this.goCardlessService.createPayment(data.societeId, {
        mandateId: mandate.id,
        amount: data.amount / 100,
        currency: data.currency || 'EUR',
        description: data.description,
        chargeDate: data.chargeDate,
        metadata: data.metadata,
      });

      return {
        id: result.paymentId,
        paymentId: result.paymentId,
        amount: data.amount,
        currency: data.currency || 'EUR',
        status: result.status,
        chargeDate: result.chargeDate,
      };
    } catch (e: unknown) {
      if (e instanceof RpcException) throw e;
      this.logger.error('CreateGoCardlessPayment failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}

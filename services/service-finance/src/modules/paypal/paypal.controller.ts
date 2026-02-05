import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PaypalService } from './paypal.service';
import type {
  CreatePayPalOrderRequest,
  PayPalOrderResponse,
  GetPayPalOrderRequest,
  CapturePayPalOrderRequest,
  PayPalCaptureResponse,
} from '@crm/proto/payments';

@Controller()
export class PaypalController {
  private readonly logger = new Logger(PaypalController.name);

  constructor(private readonly paypalService: PaypalService) {}

  @GrpcMethod('PaymentService', 'CreatePayPalOrder')
  async createPayPalOrder(data: CreatePayPalOrderRequest): Promise<PayPalOrderResponse> {
    try {
      this.logger.log(`CreatePayPalOrder for societe: ${data.societe_id}`);

      const purchaseUnit = data.purchase_units?.[0];
      const amount = purchaseUnit?.amount || 0;

      const result = await this.paypalService.createOrder(data.societe_id, {
        amount: amount / 100,
        currency: purchaseUnit?.currency || 'EUR',
        returnUrl: data.return_url,
        cancelUrl: data.cancel_url,
        description: purchaseUnit?.description,
        referenceId: purchaseUnit?.reference_id,
      });

      return {
        id: result.orderId,
        status: 'CREATED',
        approve_url: result.approvalUrl,
        links: [
          { href: result.approvalUrl, rel: 'approve', method: 'GET' },
        ],
      };
    } catch (e: unknown) {
      this.logger.error('CreatePayPalOrder failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'GetPayPalOrder')
  async getPayPalOrder(data: GetPayPalOrderRequest): Promise<PayPalOrderResponse> {
    try {
      this.logger.log(`GetPayPalOrder: ${data.order_id}`);

      const result = await this.paypalService.getOrder(data.societe_id, data.order_id);

      interface PayPalLink { href: string; rel: string; method: string }
      const approveLink = result.links?.find((l: PayPalLink) => l.rel === 'approve');

      return {
        id: result.id,
        status: result.status,
        approve_url: approveLink?.href,
        links: result.links?.map((l: PayPalLink) => ({
          href: l.href,
          rel: l.rel,
          method: l.method,
        })) || [],
      };
    } catch (e: unknown) {
      this.logger.error('GetPayPalOrder failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('PaymentService', 'CapturePayPalOrder')
  async capturePayPalOrder(data: CapturePayPalOrderRequest): Promise<PayPalCaptureResponse> {
    try {
      this.logger.log(`CapturePayPalOrder: ${data.order_id}`);

      const result = await this.paypalService.captureOrder(data.societe_id, data.order_id);

      return {
        id: result.captureId,
        status: result.status,
        purchase_units: [
          {
            captures: [
              {
                id: result.captureId,
                status: result.status,
                amount: {
                  currency_code: result.currency,
                  value: result.amount.toString(),
                },
              },
            ],
          },
        ],
      };
    } catch (e: unknown) {
      this.logger.error('CapturePayPalOrder failed', e);
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}

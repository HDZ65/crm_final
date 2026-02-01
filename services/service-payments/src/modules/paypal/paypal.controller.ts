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
      this.logger.log(`CreatePayPalOrder for societe: ${data.societeId}`);

      const purchaseUnit = data.purchaseUnits?.[0];
      const amount = purchaseUnit?.amount || 0;

      const result = await this.paypalService.createOrder(data.societeId, {
        amount: amount / 100,
        currency: purchaseUnit?.currency || 'EUR',
        returnUrl: data.returnUrl,
        cancelUrl: data.cancelUrl,
        description: purchaseUnit?.description,
        referenceId: purchaseUnit?.referenceId,
      });

      return {
        id: result.orderId,
        status: 'CREATED',
        approveUrl: result.approvalUrl,
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
      this.logger.log(`GetPayPalOrder: ${data.orderId}`);

      const result = await this.paypalService.getOrder(data.societeId, data.orderId);

      interface PayPalLink { href: string; rel: string; method: string }
      const approveLink = result.links?.find((l: PayPalLink) => l.rel === 'approve');

      return {
        id: result.id,
        status: result.status,
        approveUrl: approveLink?.href,
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
      this.logger.log(`CapturePayPalOrder: ${data.orderId}`);

      const result = await this.paypalService.captureOrder(data.societeId, data.orderId);

      return {
        id: result.captureId,
        status: result.status,
        purchaseUnits: [
          {
            captures: [
              {
                id: result.captureId,
                status: result.status,
                amount: {
                  currencyCode: result.currency,
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

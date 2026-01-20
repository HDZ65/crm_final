import { Injectable, Logger, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import type { PaypalAccountRepositoryPort } from '../../../core/port/paypal-account-repository.port';

export interface PaypalWebhookEvent {
  id: string;
  event_type: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  resource_version: string;
  summary: string;
  resource: Record<string, any>;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PaypalWebhookHeaders {
  'paypal-transmission-id': string;
  'paypal-transmission-time': string;
  'paypal-transmission-sig': string;
  'paypal-cert-url': string;
  'paypal-auth-algo': string;
}

// PayPal webhook event types
export enum PaypalEventType {
  // Order events
  CHECKOUT_ORDER_APPROVED = 'CHECKOUT.ORDER.APPROVED',
  CHECKOUT_ORDER_COMPLETED = 'CHECKOUT.ORDER.COMPLETED',

  // Payment capture events
  PAYMENT_CAPTURE_COMPLETED = 'PAYMENT.CAPTURE.COMPLETED',
  PAYMENT_CAPTURE_DENIED = 'PAYMENT.CAPTURE.DENIED',
  PAYMENT_CAPTURE_PENDING = 'PAYMENT.CAPTURE.PENDING',
  PAYMENT_CAPTURE_REFUNDED = 'PAYMENT.CAPTURE.REFUNDED',
  PAYMENT_CAPTURE_REVERSED = 'PAYMENT.CAPTURE.REVERSED',

  // Authorization events
  PAYMENT_AUTHORIZATION_CREATED = 'PAYMENT.AUTHORIZATION.CREATED',
  PAYMENT_AUTHORIZATION_VOIDED = 'PAYMENT.AUTHORIZATION.VOIDED',

  // Subscription events
  BILLING_SUBSCRIPTION_CREATED = 'BILLING.SUBSCRIPTION.CREATED',
  BILLING_SUBSCRIPTION_ACTIVATED = 'BILLING.SUBSCRIPTION.ACTIVATED',
  BILLING_SUBSCRIPTION_UPDATED = 'BILLING.SUBSCRIPTION.UPDATED',
  BILLING_SUBSCRIPTION_EXPIRED = 'BILLING.SUBSCRIPTION.EXPIRED',
  BILLING_SUBSCRIPTION_CANCELLED = 'BILLING.SUBSCRIPTION.CANCELLED',
  BILLING_SUBSCRIPTION_SUSPENDED = 'BILLING.SUBSCRIPTION.SUSPENDED',
  BILLING_SUBSCRIPTION_PAYMENT_FAILED = 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',

  // Payment sale events (subscription payments)
  PAYMENT_SALE_COMPLETED = 'PAYMENT.SALE.COMPLETED',
  PAYMENT_SALE_DENIED = 'PAYMENT.SALE.DENIED',
  PAYMENT_SALE_PENDING = 'PAYMENT.SALE.PENDING',
  PAYMENT_SALE_REFUNDED = 'PAYMENT.SALE.REFUNDED',
  PAYMENT_SALE_REVERSED = 'PAYMENT.SALE.REVERSED',

  // Plan events
  BILLING_PLAN_CREATED = 'BILLING.PLAN.CREATED',
  BILLING_PLAN_UPDATED = 'BILLING.PLAN.UPDATED',
  BILLING_PLAN_ACTIVATED = 'BILLING.PLAN.ACTIVATED',
  BILLING_PLAN_PRICING_CHANGE_ACTIVATED = 'BILLING.PLAN.PRICING-CHANGE.ACTIVATED',
}

@Injectable()
export class PaypalWebhookService {
  private readonly logger = new Logger(PaypalWebhookService.name);

  constructor(
    @Inject('PaypalAccountRepositoryPort')
    private readonly paypalAccountRepository: PaypalAccountRepositoryPort,
  ) {}

  /**
   * Verify PayPal webhook signature
   * Note: Full verification requires fetching PayPal's certificate.
   * This is a simplified version - for production, use PayPal's verification API.
   */
  async verifyWebhookSignature(
    headers: PaypalWebhookHeaders,
    body: string,
    webhookId: string,
  ): Promise<boolean> {
    try {
      const transmissionId = headers['paypal-transmission-id'];
      const transmissionTime = headers['paypal-transmission-time'];
      const transmissionSig = headers['paypal-transmission-sig'];
      const certUrl = headers['paypal-cert-url'];
      const authAlgo = headers['paypal-auth-algo'];

      if (!transmissionId || !transmissionTime || !transmissionSig || !webhookId) {
        this.logger.warn('Missing required PayPal webhook headers');
        return false;
      }

      // Construct the expected signature string
      // Format: <transmissionId>|<transmissionTime>|<webhookId>|<crc32(body)>
      const crc32 = this.crc32(body);
      const expectedSignatureString = `${transmissionId}|${transmissionTime}|${webhookId}|${crc32}`;

      this.logger.debug(`Verifying webhook signature for transmission ${transmissionId}`);

      // For full verification, you would:
      // 1. Fetch PayPal's certificate from certUrl
      // 2. Verify the signature using the certificate
      // This requires additional HTTP calls and certificate handling

      // For now, we'll log and trust (in production, implement full verification)
      this.logger.log(`PayPal webhook received: ${transmissionId} - Signature verification simplified`);
      return true;
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Process PayPal webhook event
   */
  async handleEvent(event: PaypalWebhookEvent): Promise<void> {
    this.logger.log(`Processing PayPal webhook: ${event.event_type} - ID: ${event.id}`);

    switch (event.event_type) {
      // Order events
      case PaypalEventType.CHECKOUT_ORDER_APPROVED:
        await this.handleOrderApproved(event);
        break;
      case PaypalEventType.CHECKOUT_ORDER_COMPLETED:
        await this.handleOrderCompleted(event);
        break;

      // Payment capture events
      case PaypalEventType.PAYMENT_CAPTURE_COMPLETED:
        await this.handleCaptureCompleted(event);
        break;
      case PaypalEventType.PAYMENT_CAPTURE_DENIED:
        await this.handleCaptureDenied(event);
        break;
      case PaypalEventType.PAYMENT_CAPTURE_PENDING:
        await this.handleCapturePending(event);
        break;
      case PaypalEventType.PAYMENT_CAPTURE_REFUNDED:
        await this.handleCaptureRefunded(event);
        break;

      // Subscription events
      case PaypalEventType.BILLING_SUBSCRIPTION_CREATED:
        await this.handleSubscriptionCreated(event);
        break;
      case PaypalEventType.BILLING_SUBSCRIPTION_ACTIVATED:
        await this.handleSubscriptionActivated(event);
        break;
      case PaypalEventType.BILLING_SUBSCRIPTION_CANCELLED:
        await this.handleSubscriptionCancelled(event);
        break;
      case PaypalEventType.BILLING_SUBSCRIPTION_SUSPENDED:
        await this.handleSubscriptionSuspended(event);
        break;
      case PaypalEventType.BILLING_SUBSCRIPTION_PAYMENT_FAILED:
        await this.handleSubscriptionPaymentFailed(event);
        break;

      // Payment sale events (subscription payments)
      case PaypalEventType.PAYMENT_SALE_COMPLETED:
        await this.handleSaleCompleted(event);
        break;
      case PaypalEventType.PAYMENT_SALE_DENIED:
        await this.handleSaleDenied(event);
        break;
      case PaypalEventType.PAYMENT_SALE_REFUNDED:
        await this.handleSaleRefunded(event);
        break;

      default:
        this.logger.log(`Unhandled PayPal event type: ${event.event_type}`);
    }
  }

  // ==================== ORDER HANDLERS ====================

  private async handleOrderApproved(event: PaypalWebhookEvent): Promise<void> {
    const orderId = event.resource.id;
    this.logger.log(`Order approved: ${orderId}`);
    // The order is approved by the buyer, ready for capture
    // You can trigger automatic capture here or wait for manual capture
  }

  private async handleOrderCompleted(event: PaypalWebhookEvent): Promise<void> {
    const orderId = event.resource.id;
    this.logger.log(`Order completed: ${orderId}`);
    // Order is fully completed (captured)
  }

  // ==================== CAPTURE HANDLERS ====================

  private async handleCaptureCompleted(event: PaypalWebhookEvent): Promise<void> {
    const captureId = event.resource.id;
    const amount = event.resource.amount;
    this.logger.log(`Payment capture completed: ${captureId} - ${amount?.value} ${amount?.currency_code}`);
    // Update your internal records - payment successful
  }

  private async handleCaptureDenied(event: PaypalWebhookEvent): Promise<void> {
    const captureId = event.resource.id;
    this.logger.warn(`Payment capture denied: ${captureId}`);
    // Handle payment failure
  }

  private async handleCapturePending(event: PaypalWebhookEvent): Promise<void> {
    const captureId = event.resource.id;
    this.logger.log(`Payment capture pending: ${captureId}`);
    // Payment is pending (e.g., eCheck, manual review)
  }

  private async handleCaptureRefunded(event: PaypalWebhookEvent): Promise<void> {
    const captureId = event.resource.id;
    const refundAmount = event.resource.amount;
    this.logger.log(`Payment refunded: ${captureId} - ${refundAmount?.value} ${refundAmount?.currency_code}`);
    // Handle refund
  }

  // ==================== SUBSCRIPTION HANDLERS ====================

  private async handleSubscriptionCreated(event: PaypalWebhookEvent): Promise<void> {
    const subscriptionId = event.resource.id;
    const planId = event.resource.plan_id;
    this.logger.log(`Subscription created: ${subscriptionId} - Plan: ${planId}`);
  }

  private async handleSubscriptionActivated(event: PaypalWebhookEvent): Promise<void> {
    const subscriptionId = event.resource.id;
    this.logger.log(`Subscription activated: ${subscriptionId}`);
    // Subscription is now active, start providing service
  }

  private async handleSubscriptionCancelled(event: PaypalWebhookEvent): Promise<void> {
    const subscriptionId = event.resource.id;
    this.logger.log(`Subscription cancelled: ${subscriptionId}`);
    // Handle subscription cancellation
  }

  private async handleSubscriptionSuspended(event: PaypalWebhookEvent): Promise<void> {
    const subscriptionId = event.resource.id;
    this.logger.warn(`Subscription suspended: ${subscriptionId}`);
    // Handle suspension (usually due to payment failure)
  }

  private async handleSubscriptionPaymentFailed(event: PaypalWebhookEvent): Promise<void> {
    const subscriptionId = event.resource.id;
    this.logger.warn(`Subscription payment failed: ${subscriptionId}`);
    // Handle payment failure for recurring payment
  }

  // ==================== SALE HANDLERS (Subscription Payments) ====================

  private async handleSaleCompleted(event: PaypalWebhookEvent): Promise<void> {
    const saleId = event.resource.id;
    const billingAgreementId = event.resource.billing_agreement_id;
    const amount = event.resource.amount;
    this.logger.log(`Subscription payment completed: ${saleId} - Agreement: ${billingAgreementId} - ${amount?.total} ${amount?.currency}`);
    // Recurring payment successful
  }

  private async handleSaleDenied(event: PaypalWebhookEvent): Promise<void> {
    const saleId = event.resource.id;
    this.logger.warn(`Subscription payment denied: ${saleId}`);
    // Recurring payment failed
  }

  private async handleSaleRefunded(event: PaypalWebhookEvent): Promise<void> {
    const saleId = event.resource.id;
    this.logger.log(`Subscription payment refunded: ${saleId}`);
    // Recurring payment refunded
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Simple CRC32 implementation for webhook verification
   */
  private crc32(str: string): number {
    const table = this.getCrc32Table();
    let crc = 0xFFFFFFFF;

    for (let i = 0; i < str.length; i++) {
      const byte = str.charCodeAt(i);
      crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xFF];
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  private getCrc32Table(): number[] {
    const table: number[] = [];
    for (let i = 0; i < 256; i++) {
      let crc = i;
      for (let j = 0; j < 8; j++) {
        crc = crc & 1 ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
      }
      table[i] = crc >>> 0;
    }
    return table;
  }

  /**
   * Find societe by webhook ID
   */
  async findSocieteByWebhookId(webhookId: string): Promise<string | null> {
    const accounts = await this.paypalAccountRepository.findAllActive();
    const account = accounts.find((acc) => acc.webhookId === webhookId);
    return account?.societeId ?? null;
  }
}

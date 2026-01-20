import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  Client,
  Environment,
  OrdersController,
  LogLevel,
  OrderApplicationContextLandingPage,
  OrderApplicationContextUserAction,
} from '@paypal/paypal-server-sdk';
import type { PaypalAccountRepositoryPort } from '../../../core/port/paypal-account-repository.port';
import type { Order, CheckoutPaymentIntent } from '@paypal/paypal-server-sdk';

export interface CreateOrderParams {
  societeId?: string;
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchaseUnits: Array<{
    referenceId?: string;
    amount: number; // in cents
    currency?: string;
    description?: string;
    customId?: string;
    invoiceId?: string;
  }>;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CaptureOrderParams {
  societeId?: string;
  orderId: string;
}

export interface CreatePlanParams {
  societeId?: string;
  name: string;
  description?: string;
  billingCycles: Array<{
    tenureType: 'REGULAR' | 'TRIAL';
    sequence: number;
    totalCycles: number;
    intervalUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
    intervalCount: number;
    amount: number; // in cents
    currency?: string;
  }>;
  setupFee?: number;
  currency?: string;
}

export interface CreateSubscriptionParams {
  societeId?: string;
  planId: string;
  subscriberEmail?: string;
  subscriberGivenName?: string;
  subscriberSurname?: string;
  startTime?: string;
  returnUrl: string;
  cancelUrl: string;
  customId?: string;
  metadata?: Record<string, string>;
}

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);

  // Cache for PayPal client instances per societe (multi-account support)
  private readonly clientInstances: Map<string, Client> = new Map();

  constructor(
    @Inject('PaypalAccountRepositoryPort')
    private readonly paypalAccountRepository: PaypalAccountRepositoryPort,
  ) {}

  /**
   * Get PayPal client instance for a specific societe (multi-account)
   */
  async getClientForSociete(societeId: string): Promise<Client> {
    // Check cache first
    if (this.clientInstances.has(societeId)) {
      return this.clientInstances.get(societeId)!;
    }

    // Look up account in database
    const account = await this.paypalAccountRepository.findBySocieteId(societeId);

    if (!account || !account.actif) {
      throw new Error(`No active PayPal account for societe ${societeId}`);
    }

    if (!account.isConfigured()) {
      throw new Error(`PayPal account for societe ${societeId} is not properly configured`);
    }

    // Create new PayPal client instance
    const client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: account.clientId,
        oAuthClientSecret: account.clientSecret,
      },
      timeout: 30000,
      environment: account.isLiveMode() ? Environment.Production : Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: { logBody: false },
        logResponse: { logHeaders: false },
      },
    });

    // Cache the instance
    this.clientInstances.set(societeId, client);
    this.logger.log(`Created PayPal client for societe ${societeId} (${account.nom}) - ${account.environment}`);

    return client;
  }

  /**
   * Clear cached PayPal client for a societe (call after credential update)
   */
  clearCacheForSociete(societeId: string): void {
    this.clientInstances.delete(societeId);
    this.logger.log(`Cleared PayPal cache for societe ${societeId}`);
  }

  /**
   * Clear all cached client instances
   */
  clearAllCaches(): void {
    this.clientInstances.clear();
    this.logger.log('Cleared all PayPal caches');
  }

  // ==================== ORDERS API ====================

  /**
   * Create a PayPal order
   */
  async createOrder(params: CreateOrderParams): Promise<Order> {
    if (!params.societeId) {
      throw new Error('societeId is required for PayPal operations');
    }

    const client = await this.getClientForSociete(params.societeId);
    const ordersController = new OrdersController(client);

    // Convert amounts from cents to decimal string
    const purchaseUnits = params.purchaseUnits.map((unit, index) => ({
      referenceId: unit.referenceId || `unit_${index}`,
      amount: {
        currencyCode: unit.currency || 'EUR',
        value: (unit.amount / 100).toFixed(2), // Convert cents to decimal
      },
      description: unit.description,
      customId: unit.customId,
      invoiceId: unit.invoiceId,
    }));

    try {
      const response = await ordersController.createOrder({
        body: {
          intent: params.intent as CheckoutPaymentIntent,
          purchaseUnits,
          applicationContext: {
            returnUrl: params.returnUrl,
            cancelUrl: params.cancelUrl,
            brandName: 'CRM Payment',
            landingPage: OrderApplicationContextLandingPage.Billing,
            userAction: OrderApplicationContextUserAction.PayNow,
          },
        },
        prefer: 'return=representation',
      });

      this.logger.log(`PayPal order created: ${response.result.id}`);
      return response.result;
    } catch (error) {
      this.logger.error(`Failed to create PayPal order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a PayPal order by ID
   */
  async getOrder(societeId: string, orderId: string): Promise<Order> {
    const client = await this.getClientForSociete(societeId);
    const ordersController = new OrdersController(client);

    try {
      const response = await ordersController.getOrder({ id: orderId });
      return response.result;
    } catch (error) {
      this.logger.error(`Failed to get PayPal order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Capture a PayPal order (after buyer approval)
   */
  async captureOrder(params: CaptureOrderParams): Promise<Order> {
    if (!params.societeId) {
      throw new Error('societeId is required for PayPal operations');
    }

    const client = await this.getClientForSociete(params.societeId);
    const ordersController = new OrdersController(client);

    try {
      const response = await ordersController.captureOrder({
        id: params.orderId,
        prefer: 'return=representation',
      });

      this.logger.log(`PayPal order captured: ${response.result.id} - Status: ${response.result.status}`);
      return response.result;
    } catch (error) {
      this.logger.error(`Failed to capture PayPal order ${params.orderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Authorize a PayPal order (for AUTHORIZE intent)
   */
  async authorizeOrder(societeId: string, orderId: string): Promise<Order> {
    const client = await this.getClientForSociete(societeId);
    const ordersController = new OrdersController(client);

    try {
      const response = await ordersController.authorizeOrder({
        id: orderId,
        prefer: 'return=representation',
      });

      this.logger.log(`PayPal order authorized: ${response.result.id}`);
      return response.result;
    } catch (error) {
      this.logger.error(`Failed to authorize PayPal order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Extract approve URL from order links
   */
  extractApproveUrl(order: Order): string | undefined {
    const approveLink = order.links?.find((link) => link.rel === 'approve');
    return approveLink?.href;
  }

  /**
   * Extract capture URL from order links
   */
  extractCaptureUrl(order: Order): string | undefined {
    const captureLink = order.links?.find((link) => link.rel === 'capture');
    return captureLink?.href;
  }

  /**
   * Check if order status indicates success
   */
  isOrderCompleted(order: Order): boolean {
    return order.status === 'COMPLETED';
  }

  /**
   * Check if order is approved and ready for capture
   */
  isOrderApproved(order: Order): boolean {
    return order.status === 'APPROVED';
  }
}

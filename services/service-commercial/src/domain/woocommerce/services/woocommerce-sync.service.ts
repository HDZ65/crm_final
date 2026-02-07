import { Injectable, Logger, Optional } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import type { IWooCommerceMappingRepository } from '../repositories/IWooCommerceMappingRepository';
import type { IWooCommerceWebhookEventRepository } from '../repositories/IWooCommerceWebhookEventRepository';
import {
  WooCommerceMappingEntity,
  WooCommerceEntityType,
} from '../entities/woocommerce-mapping.entity';
import type { ISubscriptionRepository } from '../../subscriptions/repositories/ISubscriptionRepository';

// ============================================================================
// PORT INTERFACES (for cross-service calls)
// ============================================================================

export interface ClientSearchResult {
  id: string;
  email?: string;
  telephone?: string;
  nom?: string;
  prenom?: string;
}

export interface ClientBasePort {
  searchByEmail(organisationId: string, email: string): Promise<ClientSearchResult | null>;
  searchByPhone(organisationId: string, phone: string): Promise<ClientSearchResult | null>;
  createClient(input: CreateClientInput): Promise<ClientSearchResult>;
  updateClient(clientId: string, input: Partial<CreateClientInput>): Promise<ClientSearchResult>;
}

export interface CreateClientInput {
  organisationId: string;
  email?: string;
  telephone?: string;
  nom: string;
  prenom?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
}

// ============================================================================
// WOOCOMMERCE SYNC SERVICE
// ============================================================================

/**
 * Maps WooCommerce frequency strings to CRM SubscriptionFrequency values.
 */
const WOO_FREQUENCY_MAP: Record<string, string> = {
  'day': 'DAILY',
  'week': 'WEEKLY',
  '2 weeks': 'BIWEEKLY',
  'month': 'MONTHLY',
  '2 months': 'BIMONTHLY',
  '3 months': 'QUARTERLY',
  '6 months': 'BIANNUAL',
  'year': 'ANNUAL',
};

/**
 * Maps WooCommerce subscription status to CRM status.
 */
const WOO_STATUS_MAP: Record<string, string> = {
  'active': 'ACTIVE',
  'on-hold': 'PAUSED',
  'pending': 'PENDING',
  'cancelled': 'CANCELED',
  'expired': 'EXPIRED',
  'pending-cancel': 'ACTIVE', // Still active until period end
};

@Injectable()
export class WooCommerceSyncService {
  private readonly logger = new Logger(WooCommerceSyncService.name);

  constructor(
    private readonly mappingRepository: IWooCommerceMappingRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Optional() private readonly clientPort?: ClientBasePort,
  ) {}

  // ============================================================================
  // CUSTOMER SYNC
  // ============================================================================

  /**
   * Processes a WooCommerce customer.created/updated webhook.
   * Reconciliation: search by email/phone before creating.
   */
  async syncCustomer(
    organisationId: string,
    wooCustomerId: string,
    payload: Record<string, any>,
  ): Promise<{ clientId: string; isNew: boolean }> {
    // 1. Check existing mapping
    const existingMapping = await this.mappingRepository.findByWooId(
      organisationId,
      WooCommerceEntityType.CLIENT,
      wooCustomerId,
    );

    if (existingMapping) {
      // Update existing client
      if (this.clientPort) {
        await this.clientPort.updateClient(existingMapping.crmEntityId, {
          email: payload.email,
          telephone: payload.billing?.phone || payload.phone,
          nom: payload.last_name || payload.billing?.last_name,
          prenom: payload.first_name || payload.billing?.first_name,
        });
      }

      existingMapping.lastSyncedAt = new Date();
      await this.mappingRepository.save(existingMapping);

      return { clientId: existingMapping.crmEntityId, isNew: false };
    }

    // 2. Reconciliation: search by email first, then phone
    const email = payload.email;
    const phone = payload.billing?.phone || payload.phone;

    let existingClient: ClientSearchResult | null = null;

    if (this.clientPort) {
      if (email) {
        existingClient = await this.clientPort.searchByEmail(organisationId, email);
      }
      if (!existingClient && phone) {
        existingClient = await this.clientPort.searchByPhone(organisationId, phone);
      }
    }

    let clientId: string;

    if (existingClient) {
      // Found existing client — update mapping, don't create duplicate
      clientId = existingClient.id;
      this.logger.log(
        `Reconciled WooCommerce customer ${wooCustomerId} with existing CRM client ${clientId}`,
      );
    } else {
      // Create new client
      if (this.clientPort) {
        const newClient = await this.clientPort.createClient({
          organisationId,
          email,
          telephone: phone,
          nom: payload.last_name || payload.billing?.last_name || 'Unknown',
          prenom: payload.first_name || payload.billing?.first_name,
          adresse: payload.billing?.address_1,
          ville: payload.billing?.city,
          codePostal: payload.billing?.postcode,
          pays: payload.billing?.country,
        });
        clientId = newClient.id;
      } else {
        // No client port available — generate placeholder ID
        clientId = `woo-client-${wooCustomerId}`;
      }
    }

    // 3. Create/update mapping
    const mapping = new WooCommerceMappingEntity();
    mapping.organisationId = organisationId;
    mapping.entityType = WooCommerceEntityType.CLIENT;
    mapping.wooId = wooCustomerId;
    mapping.crmEntityId = clientId;
    mapping.lastSyncedAt = new Date();
    await this.mappingRepository.save(mapping);

    return { clientId, isNew: !existingClient };
  }

  // ============================================================================
  // SUBSCRIPTION SYNC
  // ============================================================================

  /**
   * Processes a WooCommerce subscription.created webhook.
   */
  async syncSubscriptionCreated(
    organisationId: string,
    wooSubscriptionId: string,
    payload: Record<string, any>,
  ): Promise<{ subscriptionId: string }> {
    // 1. Check existing mapping
    const existingMapping = await this.mappingRepository.findByWooId(
      organisationId,
      WooCommerceEntityType.SUBSCRIPTION,
      wooSubscriptionId,
    );

    if (existingMapping) {
      return { subscriptionId: existingMapping.crmEntityId };
    }

    // 2. Resolve client mapping
    const wooCustomerId = String(payload.customer_id || payload.billing?.customer_id);
    const clientMapping = await this.mappingRepository.findByWooId(
      organisationId,
      WooCommerceEntityType.CLIENT,
      wooCustomerId,
    );

    const clientId = clientMapping?.crmEntityId || `woo-client-${wooCustomerId}`;

    // 3. Parse WooCommerce subscription data
    const frequency = this.mapWooFrequency(payload.billing_period);
    const status = this.mapWooStatus(payload.status);
    const amount = this.parseAmount(payload.total);

    // 4. Create subscription entity
    const subscription = {
      organisationId,
      clientId,
      contratId: null,
      status,
      frequency,
      amount,
      currency: payload.currency || 'EUR',
      startDate: payload.start_date || new Date().toISOString(),
      endDate: payload.end_date || null,
      pausedAt: null,
      resumedAt: null,
      nextChargeAt: payload.next_payment_date || new Date().toISOString(),
      retryCount: 0,
    };

    const saved = await this.subscriptionRepository.save(subscription as any);

    // 5. Create mapping
    const mapping = new WooCommerceMappingEntity();
    mapping.organisationId = organisationId;
    mapping.entityType = WooCommerceEntityType.SUBSCRIPTION;
    mapping.wooId = wooSubscriptionId;
    mapping.crmEntityId = saved.id;
    mapping.lastSyncedAt = new Date();
    await this.mappingRepository.save(mapping);

    return { subscriptionId: saved.id };
  }

  /**
   * Processes a WooCommerce subscription.updated webhook.
   */
  async syncSubscriptionUpdated(
    organisationId: string,
    wooSubscriptionId: string,
    payload: Record<string, any>,
  ): Promise<{ subscriptionId: string; updated: boolean }> {
    const existingMapping = await this.mappingRepository.findByWooId(
      organisationId,
      WooCommerceEntityType.SUBSCRIPTION,
      wooSubscriptionId,
    );

    if (!existingMapping) {
      // Subscription not found — create it
      const result = await this.syncSubscriptionCreated(
        organisationId,
        wooSubscriptionId,
        payload,
      );
      return { subscriptionId: result.subscriptionId, updated: false };
    }

    // Update existing subscription
    const subscription = await this.subscriptionRepository.findById(
      existingMapping.crmEntityId,
    );

    if (!subscription) {
      this.logger.warn(
        `CRM subscription ${existingMapping.crmEntityId} not found for WooCommerce ${wooSubscriptionId}`,
      );
      return { subscriptionId: existingMapping.crmEntityId, updated: false };
    }

    // Apply updates
    if (payload.status) {
      subscription.status = this.mapWooStatus(payload.status);
    }
    if (payload.billing_period) {
      subscription.frequency = this.mapWooFrequency(payload.billing_period);
    }
    if (payload.total) {
      subscription.amount = this.parseAmount(payload.total);
    }
    if (payload.next_payment_date) {
      subscription.nextChargeAt = payload.next_payment_date;
    }

    await this.subscriptionRepository.save(subscription);

    existingMapping.lastSyncedAt = new Date();
    await this.mappingRepository.save(existingMapping);

    return { subscriptionId: subscription.id, updated: true };
  }

  // ============================================================================
  // ORDER SYNC
  // ============================================================================

  /**
   * Processes a WooCommerce order.completed webhook.
   * Links order to existing subscription cycle.
   */
  async syncOrderCompleted(
    organisationId: string,
    wooOrderId: string,
    payload: Record<string, any>,
  ): Promise<{ orderId: string; linkedSubscriptionId: string | null }> {
    // Check existing mapping
    const existingMapping = await this.mappingRepository.findByWooId(
      organisationId,
      WooCommerceEntityType.ORDER,
      wooOrderId,
    );

    if (existingMapping) {
      return { orderId: existingMapping.crmEntityId, linkedSubscriptionId: null };
    }

    // Try to find linked subscription
    let linkedSubscriptionId: string | null = null;

    // WooCommerce Subscriptions plugin puts subscription IDs in line item meta
    const subscriptionIds = this.extractSubscriptionIds(payload);
    if (subscriptionIds.length > 0) {
      const subMapping = await this.mappingRepository.findByWooId(
        organisationId,
        WooCommerceEntityType.SUBSCRIPTION,
        subscriptionIds[0],
      );
      linkedSubscriptionId = subMapping?.crmEntityId || null;
    }

    // Create order mapping
    const mapping = new WooCommerceMappingEntity();
    mapping.organisationId = organisationId;
    mapping.entityType = WooCommerceEntityType.ORDER;
    mapping.wooId = wooOrderId;
    mapping.crmEntityId = `woo-order-${wooOrderId}`; // Placeholder — real integration would create in service-logistics
    mapping.lastSyncedAt = new Date();
    await this.mappingRepository.save(mapping);

    return { orderId: mapping.crmEntityId, linkedSubscriptionId };
  }

  // ============================================================================
  // PAYMENT SYNC
  // ============================================================================

  /**
   * Processes a WooCommerce payment_intent.succeeded webhook.
   * Marks the associated charge as paid.
   */
  async syncPaymentSucceeded(
    organisationId: string,
    wooPaymentId: string,
    payload: Record<string, any>,
  ): Promise<{ paymentId: string; linkedSubscriptionId: string | null }> {
    // Check existing mapping
    const existingMapping = await this.mappingRepository.findByWooId(
      organisationId,
      WooCommerceEntityType.PAYMENT,
      wooPaymentId,
    );

    if (existingMapping) {
      return { paymentId: existingMapping.crmEntityId, linkedSubscriptionId: null };
    }

    // Try to find linked subscription via order
    let linkedSubscriptionId: string | null = null;
    const orderId = payload.order_id || payload.metadata?.order_id;
    if (orderId) {
      const orderMapping = await this.mappingRepository.findByWooId(
        organisationId,
        WooCommerceEntityType.ORDER,
        String(orderId),
      );
      if (orderMapping) {
        // Placeholder — in full implementation, look up subscription from order
        linkedSubscriptionId = null;
      }
    }

    // Create payment mapping
    const mapping = new WooCommerceMappingEntity();
    mapping.organisationId = organisationId;
    mapping.entityType = WooCommerceEntityType.PAYMENT;
    mapping.wooId = wooPaymentId;
    mapping.crmEntityId = `woo-payment-${wooPaymentId}`;
    mapping.lastSyncedAt = new Date();
    await this.mappingRepository.save(mapping);

    return { paymentId: mapping.crmEntityId, linkedSubscriptionId };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  mapWooFrequency(wooPeriod: string | undefined): string {
    if (!wooPeriod) return 'MONTHLY';
    return WOO_FREQUENCY_MAP[wooPeriod.toLowerCase()] || 'MONTHLY';
  }

  mapWooStatus(wooStatus: string | undefined): string {
    if (!wooStatus) return 'PENDING';
    return WOO_STATUS_MAP[wooStatus.toLowerCase()] || 'PENDING';
  }

  private parseAmount(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private extractSubscriptionIds(payload: Record<string, any>): string[] {
    const ids: string[] = [];

    // WooCommerce Subscriptions stores related subscription IDs
    if (Array.isArray(payload.line_items)) {
      for (const item of payload.line_items) {
        if (item.meta_data && Array.isArray(item.meta_data)) {
          for (const meta of item.meta_data) {
            if (meta.key === '_subscription_renewal' || meta.key === '_subscription_sign_up') {
              ids.push(String(meta.value));
            }
          }
        }
      }
    }

    return ids;
  }
}

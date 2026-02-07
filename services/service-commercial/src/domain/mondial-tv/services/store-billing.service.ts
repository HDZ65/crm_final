import { Injectable, Logger } from '@nestjs/common';
import { DomainException } from '@crm/shared-kernel';
import {
  StoreBillingRecordEntity,
  StoreBillingStatus,
  StoreSource,
  StoreEventType,
} from '../entities/store-billing-record.entity';
import type { IStoreBillingRecordRepository } from '../repositories/IStoreBillingRecordRepository';

export interface StoreEventInput {
  organisationId: string;
  subscriptionId: string;
  clientId: string;
  storeSource: StoreSource;
  storeTransactionId: string;
  storeProductId: string;
  amount: number;
  currency: string;
  eventType: StoreEventType;
  eventDate: Date;
  receiptData?: Record<string, any>;
  originalTransactionId?: string;
}

export interface StoreRevenueStats {
  storeSource: StoreSource;
  totalAmount: number;
  transactionCount: number;
  currency: string;
}

export interface StoreBillingPeriod {
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class StoreBillingService {
  private readonly logger = new Logger(StoreBillingService.name);

  constructor(
    private readonly storeBillingRepository: IStoreBillingRecordRepository,
  ) {}

  /**
   * Record a store payment event (Apple/Google/TV stores).
   * Creates a StoreBillingRecord with appropriate status based on event type.
   * 
   * @param subscriptionId - Subscription ID
   * @param storeEvent - Store event data from IMS webhook
   * @returns Created StoreBillingRecordEntity
   * @throws DomainException if validation fails or duplicate transaction
   */
  async recordStorePayment(
    subscriptionId: string,
    storeEvent: StoreEventInput,
  ): Promise<StoreBillingRecordEntity> {
    // Validate subscription ID matches
    if (storeEvent.subscriptionId !== subscriptionId) {
      throw new DomainException(
        `Subscription ID mismatch: expected ${subscriptionId}, got ${storeEvent.subscriptionId}`,
        'STORE_BILLING_SUBSCRIPTION_MISMATCH',
        { subscriptionId, providedSubscriptionId: storeEvent.subscriptionId },
      );
    }

    // Validate amount
    if (storeEvent.amount < 0) {
      throw new DomainException(
        `Store billing amount cannot be negative: ${storeEvent.amount}`,
        'STORE_BILLING_INVALID_AMOUNT',
        { amount: storeEvent.amount, subscriptionId },
      );
    }

    // Check for duplicate transaction
    const existing = await this.storeBillingRepository.findByStoreTransaction(
      storeEvent.storeSource,
      storeEvent.storeTransactionId,
    );

    if (existing) {
      this.logger.warn(
        `Duplicate store transaction detected: ${storeEvent.storeTransactionId} from ${storeEvent.storeSource}`,
      );
      throw new DomainException(
        `Store transaction ${storeEvent.storeTransactionId} already recorded`,
        'STORE_BILLING_DUPLICATE_TRANSACTION',
        {
          storeSource: storeEvent.storeSource,
          storeTransactionId: storeEvent.storeTransactionId,
          existingRecordId: existing.id,
        },
      );
    }

    // Determine status based on event type
    const status = this.determineStatusFromEventType(storeEvent.eventType);

    // Create billing record
    const record = new StoreBillingRecordEntity();
    record.organisationId = storeEvent.organisationId;
    record.subscriptionId = storeEvent.subscriptionId;
    record.clientId = storeEvent.clientId;
    record.storeSource = storeEvent.storeSource;
    record.storeTransactionId = storeEvent.storeTransactionId;
    record.storeProductId = storeEvent.storeProductId;
    record.amount = storeEvent.amount;
    record.currency = storeEvent.currency;
    record.status = status;
    record.eventType = storeEvent.eventType;
    record.eventDate = storeEvent.eventDate;
    record.receiptData = storeEvent.receiptData ?? null;
    record.originalTransactionId = storeEvent.originalTransactionId ?? null;

    const saved = await this.storeBillingRepository.save(record);

    this.logger.log(
      `Store billing record created: ${saved.id} for subscription ${subscriptionId} (${storeEvent.storeSource}, status: ${status})`,
    );

    return saved;
  }

  /**
   * Get revenue statistics by store source for an organisation.
   * Aggregates PAID transactions only.
   * 
   * @param organisationId - Organisation ID
   * @param period - Optional date range filter
   * @returns Array of revenue stats per store source
   */
  async getRevenueByStore(
    organisationId: string,
    period?: StoreBillingPeriod,
  ): Promise<StoreRevenueStats[]> {
    if (!organisationId) {
      throw new DomainException(
        'Organisation ID is required',
        'STORE_BILLING_MISSING_ORGANISATION_ID',
      );
    }

    const storeSources = [
      StoreSource.APPLE_STORE,
      StoreSource.GOOGLE_STORE,
      StoreSource.TV_STORE,
    ];

    const results: StoreRevenueStats[] = [];

    for (const storeSource of storeSources) {
      const aggregate = await this.storeBillingRepository.aggregateRevenueByStore(
        organisationId,
        storeSource,
      );

      // Only include stores with transactions
      if (aggregate.count > 0) {
        results.push({
          storeSource,
          totalAmount: aggregate.totalAmount,
          transactionCount: aggregate.count,
          currency: 'EUR', // Default currency, could be enhanced to support multi-currency
        });
      }
    }

    this.logger.log(
      `Revenue aggregated for organisation ${organisationId}: ${results.length} store sources with transactions`,
    );

    return results;
  }

  /**
   * Get store billing history for a subscription.
   * Returns all store billing records ordered by event date (most recent first).
   * 
   * @param subscriptionId - Subscription ID
   * @returns Array of StoreBillingRecordEntity ordered by eventDate DESC
   */
  async getSubscriptionStoreHistory(
    subscriptionId: string,
  ): Promise<StoreBillingRecordEntity[]> {
    if (!subscriptionId) {
      throw new DomainException(
        'Subscription ID is required',
        'STORE_BILLING_MISSING_SUBSCRIPTION_ID',
      );
    }

    // Repository already orders by eventDate DESC
    const records = await this.storeBillingRepository.findBySubscription(
      '', // organisationId not required for this query
      subscriptionId,
    );

    this.logger.log(
      `Retrieved ${records.length} store billing records for subscription ${subscriptionId}`,
    );

    return records;
  }

  /**
   * Determine billing status from store event type.
   * Maps store event types to billing statuses.
   * 
   * @private
   */
  private determineStatusFromEventType(eventType: StoreEventType): StoreBillingStatus {
    switch (eventType) {
      case StoreEventType.INITIAL_PURCHASE:
      case StoreEventType.RENEWAL:
        return StoreBillingStatus.PAID;
      case StoreEventType.REFUND:
        return StoreBillingStatus.REFUNDED;
      case StoreEventType.CANCELLATION:
        // Cancellation doesn't create a billing record, but if it does, mark as FAILED
        return StoreBillingStatus.FAILED;
      default:
        throw new DomainException(
          `Unknown store event type: ${eventType}`,
          'STORE_BILLING_UNKNOWN_EVENT_TYPE',
          { eventType },
        );
    }
  }
}

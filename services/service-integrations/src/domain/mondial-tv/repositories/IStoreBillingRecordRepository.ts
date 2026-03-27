import { StoreBillingRecordEntity, StoreBillingStatus, StoreSource } from '../entities/store-billing-record.entity';

export interface IStoreBillingRecordRepository {
  findById(id: string): Promise<StoreBillingRecordEntity | null>;
  findBySubscription(keycloakGroupId: string, subscriptionId: string): Promise<StoreBillingRecordEntity[]>;
  findByStoreTransaction(
    storeSource: StoreSource,
    storeTransactionId: string,
  ): Promise<StoreBillingRecordEntity | null>;
  findByStatus(keycloakGroupId: string, status: StoreBillingStatus): Promise<StoreBillingRecordEntity[]>;
  aggregateRevenueByStore(
    keycloakGroupId: string,
    storeSource: StoreSource,
  ): Promise<{ totalAmount: number; count: number }>;
  save(entity: StoreBillingRecordEntity): Promise<StoreBillingRecordEntity>;
  delete(id: string): Promise<boolean>;
  findAll(filters?: {
    keycloakGroupId?: string;
    subscriptionId?: string;
    clientId?: string;
    storeSource?: StoreSource;
    status?: StoreBillingStatus;
  }): Promise<StoreBillingRecordEntity[]>;
}

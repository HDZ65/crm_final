import { StoreBillingRecordEntity, StoreBillingStatus, StoreSource } from '../entities/store-billing-record.entity';

export interface IStoreBillingRecordRepository {
  findById(id: string): Promise<StoreBillingRecordEntity | null>;
  findBySubscription(organisationId: string, subscriptionId: string): Promise<StoreBillingRecordEntity[]>;
  findByStoreTransaction(storeSource: StoreSource, storeTransactionId: string): Promise<StoreBillingRecordEntity | null>;
  findByStatus(organisationId: string, status: StoreBillingStatus): Promise<StoreBillingRecordEntity[]>;
  aggregateRevenueByStore(organisationId: string, storeSource: StoreSource): Promise<{ totalAmount: number; count: number }>;
  save(entity: StoreBillingRecordEntity): Promise<StoreBillingRecordEntity>;
  delete(id: string): Promise<boolean>;
  findAll(filters?: {
    organisationId?: string;
    subscriptionId?: string;
    clientId?: string;
    storeSource?: StoreSource;
    status?: StoreBillingStatus;
  }): Promise<StoreBillingRecordEntity[]>;
}

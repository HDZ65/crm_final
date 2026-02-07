import { SubscriptionHistoryEntity } from '../entities/subscription-history.entity';

export interface ISubscriptionHistoryRepository {
  findById(id: string): Promise<SubscriptionHistoryEntity | null>;
  findBySubscription(subscriptionId: string): Promise<SubscriptionHistoryEntity[]>;
  create(input: {
    subscriptionId: string;
    oldStatus: string | null;
    newStatus: string;
    reason?: string | null;
    triggeredBy: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<SubscriptionHistoryEntity>;
  save(entity: SubscriptionHistoryEntity): Promise<SubscriptionHistoryEntity>;
  delete(id: string): Promise<void>;
}

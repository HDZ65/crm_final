import { SubscriptionStatusHistoryEntity } from '../entities/subscription-status-history.entity';

export interface ISubscriptionStatusHistoryRepository {
  findById(id: string): Promise<SubscriptionStatusHistoryEntity | null>;
  findBySubscription(subscriptionId: string): Promise<SubscriptionStatusHistoryEntity[]>;
  save(entity: SubscriptionStatusHistoryEntity): Promise<SubscriptionStatusHistoryEntity>;
}

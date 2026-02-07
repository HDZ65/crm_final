import { SubscriptionHistoryEntity } from '../entities/subscription-history.entity';

export interface ISubscriptionHistoryRepository {
  findById(id: string): Promise<SubscriptionHistoryEntity | null>;
  findBySubscription(subscriptionId: string): Promise<SubscriptionHistoryEntity[]>;
  save(entity: SubscriptionHistoryEntity): Promise<SubscriptionHistoryEntity>;
  delete(id: string): Promise<void>;
}

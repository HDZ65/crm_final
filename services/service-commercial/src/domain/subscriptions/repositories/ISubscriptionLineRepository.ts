import { SubscriptionLineEntity } from '../entities/subscription-line.entity';

export interface ISubscriptionLineRepository {
  findById(id: string): Promise<SubscriptionLineEntity | null>;
  findBySubscription(subscriptionId: string): Promise<SubscriptionLineEntity[]>;
  save(entity: SubscriptionLineEntity): Promise<SubscriptionLineEntity>;
  delete(id: string): Promise<void>;
}

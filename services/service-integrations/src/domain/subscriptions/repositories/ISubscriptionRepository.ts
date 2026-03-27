import { SubscriptionEntity } from '../entities/subscription.entity';

export interface ISubscriptionRepository {
  findById(id: string): Promise<SubscriptionEntity | null>;
  save(entity: Partial<SubscriptionEntity>): Promise<SubscriptionEntity>;
  delete(id: string): Promise<void>;
}

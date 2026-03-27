import { SubscriptionPreferenceEntity } from '../entities/subscription-preference.entity';

export interface ISubscriptionPreferenceRepository {
  findById(id: string): Promise<SubscriptionPreferenceEntity | null>;
  findBySubscription(subscriptionId: string): Promise<SubscriptionPreferenceEntity[]>;
  save(entity: SubscriptionPreferenceEntity): Promise<SubscriptionPreferenceEntity>;
  delete(id: string): Promise<void>;
}

import { SubscriptionPreferenceHistoryEntity } from '../entities/subscription-preference-history.entity';

export interface ISubscriptionPreferenceHistoryRepository {
  findByPreference(preferenceId: string): Promise<SubscriptionPreferenceHistoryEntity[]>;
  findBySubscription(subscriptionId: string): Promise<SubscriptionPreferenceHistoryEntity[]>;
  create(input: {
    preferenceId: string;
    oldValue: string | null;
    newValue: string;
    changedBy: string;
    appliedCycle?: string;
  }): Promise<SubscriptionPreferenceHistoryEntity>;
}

import { SubscriptionCycleEntity } from '../entities/subscription-cycle.entity';

export interface ISubscriptionCycleRepository {
  findById(id: string): Promise<SubscriptionCycleEntity | null>;
  findBySubscription(subscriptionId: string): Promise<SubscriptionCycleEntity[]>;
  save(entity: SubscriptionCycleEntity): Promise<SubscriptionCycleEntity>;
  updateChargeStatus(id: string, status: string): Promise<SubscriptionCycleEntity>;
}

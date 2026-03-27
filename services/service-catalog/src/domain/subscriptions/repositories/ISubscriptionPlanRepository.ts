import { SubscriptionPlanType } from '../entities/subscription.entity';
import { SubscriptionPlanEntity } from '../entities/subscription-plan.entity';

export interface ISubscriptionPlanRepository {
  findById(id: string): Promise<SubscriptionPlanEntity | null>;
  findByCode(keycloakGroupId: string, code: SubscriptionPlanType): Promise<SubscriptionPlanEntity | null>;
  findByOrganisation(
    keycloakGroupId: string,
    pagination?: {
      page?: number;
      limit?: number;
    },
  ): Promise<{
    plans: SubscriptionPlanEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>;
  save(entity: SubscriptionPlanEntity): Promise<SubscriptionPlanEntity>;
  delete(id: string): Promise<boolean>;
}

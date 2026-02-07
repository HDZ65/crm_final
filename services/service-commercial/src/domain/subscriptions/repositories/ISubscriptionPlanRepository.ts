import { SubscriptionPlanEntity } from '../entities/subscription-plan.entity';

export interface ISubscriptionPlanRepository {
  findById(id: string): Promise<SubscriptionPlanEntity | null>;
  findByOrganisation(organisationId: string, pagination?: {
    page?: number;
    limit?: number;
  }): Promise<{
    plans: SubscriptionPlanEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>;
  save(entity: SubscriptionPlanEntity): Promise<SubscriptionPlanEntity>;
  delete(id: string): Promise<boolean>;
}

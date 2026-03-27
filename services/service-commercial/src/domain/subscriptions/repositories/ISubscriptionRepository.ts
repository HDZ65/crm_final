import { SubscriptionEntity } from '../entities/subscription.entity';

export interface ISubscriptionRepository {
  findById(id: string): Promise<SubscriptionEntity | null>;
  findByIdWithDetails(id: string): Promise<SubscriptionEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    clientId?: string;
    status?: string;
    planType?: string;
    storeSource?: string;
  }, pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    subscriptions: SubscriptionEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>;
  getDueForCharge(organisationId: string, beforeDate: Date): Promise<SubscriptionEntity[]>;
  getDueForTrialConversion(organisationId: string): Promise<SubscriptionEntity[]>;
  findDueForCharge(organisationId: string, beforeDate: string): Promise<SubscriptionEntity[]>;
  save(entity: SubscriptionEntity): Promise<SubscriptionEntity>;
  updateStatus(id: string, status: string): Promise<SubscriptionEntity>;
  delete(id: string): Promise<void>;
}

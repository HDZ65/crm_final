import { SubscriptionEntity } from '../entities/subscription.entity';

export interface ISubscriptionRepository {
  findById(id: string): Promise<SubscriptionEntity | null>;
  findByIdWithDetails(id: string): Promise<SubscriptionEntity | null>;
  findAll(
    filters?: {
      keycloakGroupId?: string;
      clientId?: string;
      status?: string;
      planType?: string;
      storeSource?: string;
    },
    pagination?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
    },
  ): Promise<{
    subscriptions: SubscriptionEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>;
  getDueForCharge(keycloakGroupId: string, beforeDate: Date): Promise<SubscriptionEntity[]>;
  getDueForTrialConversion(keycloakGroupId: string): Promise<SubscriptionEntity[]>;
  findDueForCharge(keycloakGroupId: string, beforeDate: string): Promise<SubscriptionEntity[]>;
  save(entity: SubscriptionEntity): Promise<SubscriptionEntity>;
  updateStatus(id: string, status: string): Promise<SubscriptionEntity>;
  delete(id: string): Promise<void>;
}

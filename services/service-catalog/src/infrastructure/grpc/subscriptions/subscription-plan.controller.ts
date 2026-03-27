import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CreateSubscriptionPlanRequest,
  DeleteByIdRequest,
  GetByIdRequest,
  ListByOrganisationRequest,
  ListSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest,
} from '@proto/subscriptions';
import { SubscriptionPlanService } from '../../persistence/typeorm/repositories/subscriptions/subscription-plan.service';

@Controller()
export class SubscriptionPlanController {
  constructor(private readonly subscriptionPlanService: SubscriptionPlanService) {}

  @GrpcMethod('SubscriptionPlanService', 'Create')
  async create(data: CreateSubscriptionPlanRequest) {
    const billingInterval = String(data.billingInterval);
    const amount = billingInterval === 'ANNUAL' || billingInterval === '1' ? data.priceAnnual : data.priceMonthly;

    return this.subscriptionPlanService.create({
      keycloakGroupId: data.organisationId,
      name: data.name,
      description: data.description,
      billingInterval,
      amount,
      currency: data.currency,
      trialDays: data.trialDays || undefined,
    });
  }

  @GrpcMethod('SubscriptionPlanService', 'Update')
  async update(data: UpdateSubscriptionPlanRequest) {
    return this.subscriptionPlanService.update({
      id: data.id,
      name: data.name,
      description: data.description,
      billingInterval: data.billingInterval !== undefined ? String(data.billingInterval) : undefined,
      amount: data.priceMonthly ?? data.priceAnnual,
      currency: data.currency,
      trialDays: data.trialDays,
      isActive: data.isActive,
    });
  }

  @GrpcMethod('SubscriptionPlanService', 'Get')
  async get(data: GetByIdRequest) {
    return this.subscriptionPlanService.findById(data.id);
  }

  @GrpcMethod('SubscriptionPlanService', 'Delete')
  async delete(data: DeleteByIdRequest) {
    const success = await this.subscriptionPlanService.delete(data.id);
    return { success };
  }

  @GrpcMethod('SubscriptionPlanService', 'List')
  async list(data: ListSubscriptionPlanRequest) {
    const result = await this.subscriptionPlanService.findAll({
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
    return {
      plans: result.plans,
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('SubscriptionPlanService', 'ListByOrganisation')
  async listByOrganisation(data: ListByOrganisationRequest) {
    const result = await this.subscriptionPlanService.findByOrganisation(data.organisationId, {
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
    return {
      plans: result.plans,
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }
}

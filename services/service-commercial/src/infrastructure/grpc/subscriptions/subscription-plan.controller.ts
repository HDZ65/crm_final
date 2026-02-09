import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SubscriptionPlanService } from '../../persistence/typeorm/repositories/subscriptions/subscription-plan.service';
import type {
  CreateSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest,
  GetByIdRequest,
  DeleteByIdRequest,
  ListByOrganisationRequest,
} from '@proto/subscriptions';

@Controller()
export class SubscriptionPlanController {
  private readonly logger = new Logger(SubscriptionPlanController.name);

  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  @GrpcMethod('SubscriptionPlanService', 'Create')
  async create(data: CreateSubscriptionPlanRequest) {
    const billingInterval = String(data.billing_interval);
    const amount =
      billingInterval === 'ANNUAL' || billingInterval === '1'
        ? data.price_annual
        : data.price_monthly;

    return this.subscriptionPlanService.create({
      organisationId: data.organisation_id,
      name: data.name,
      description: data.description,
      billingInterval,
      amount,
      currency: data.currency,
      trialDays: data.trial_days || undefined,
    });
  }

  @GrpcMethod('SubscriptionPlanService', 'Update')
  async update(data: UpdateSubscriptionPlanRequest) {
    return this.subscriptionPlanService.update({
      id: data.id,
      name: data.name,
      description: data.description,
      billingInterval: data.billing_interval !== undefined ? String(data.billing_interval) : undefined,
      amount: data.price_monthly ?? data.price_annual,
      currency: data.currency,
      trialDays: data.trial_days,
      isActive: data.is_active,
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

  @GrpcMethod('SubscriptionPlanService', 'ListByOrganisation')
  async listByOrganisation(data: ListByOrganisationRequest) {
    const result = await this.subscriptionPlanService.findByOrganisation(
      data.organisation_id,
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
      },
    );
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

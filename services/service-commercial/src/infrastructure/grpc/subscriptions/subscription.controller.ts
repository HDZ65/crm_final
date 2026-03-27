import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SubscriptionService } from '../../persistence/typeorm/repositories/subscriptions/subscription.service';
import { SubscriptionStatusHistoryService } from '../../persistence/typeorm/repositories/subscriptions/subscription-status-history.service';
import type {
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  GetByIdRequest,
  DeleteByIdRequest,
  ListSubscriptionRequest,
  ListByClientRequest,
  ListByPlanRequest,
  ActivateSubscriptionRequest,
  PauseSubscriptionRequest,
  ResumeSubscriptionRequest,
  CancelSubscriptionRequest,
  ExpireSubscriptionRequest,
  GetDueForChargeRequest,
  GetDueForTrialConversionRequest,
  SuspendSubscriptionRequest,
  ReactivateSubscriptionRequest,
} from '@proto/subscriptions';
import { SubscriptionStatus } from '../../../domain/subscriptions/entities/subscription.entity';

@Controller()
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly statusHistoryService: SubscriptionStatusHistoryService,
  ) {}

  @GrpcMethod('SubscriptionService', 'Create')
  async create(data: CreateSubscriptionRequest) {
    return this.subscriptionService.create({
      organisationId: data.organisation_id,
      clientId: data.client_id,
      status: SubscriptionStatus.PENDING,
      frequency: 'MONTHLY', // Default, will be derived from plan in domain service (Task 5)
      amount: 0, // Will be derived from plan in domain service (Task 5)
      startDate: data.start_date,
      nextChargeAt: data.start_date,
    });
  }

  @GrpcMethod('SubscriptionService', 'Update')
  async update(data: UpdateSubscriptionRequest) {
    return this.subscriptionService.update({
      id: data.id,
      startDate: data.start_date,
      endDate: data.end_date,
    });
  }

  @GrpcMethod('SubscriptionService', 'Get')
  async get(data: GetByIdRequest) {
    return this.subscriptionService.findById(data.id);
  }

  @GrpcMethod('SubscriptionService', 'Delete')
  async delete(data: DeleteByIdRequest) {
    await this.subscriptionService.delete(data.id);
    return { success: true };
  }

  @GrpcMethod('SubscriptionService', 'List')
  async list(data: ListSubscriptionRequest) {
    const result = await this.subscriptionService.findAll(
      {},
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
        sortBy: data.pagination?.sort_by,
        sortOrder: data.pagination?.sort_order,
      },
    );
    return {
      subscriptions: result.subscriptions,
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('SubscriptionService', 'ListByClient')
  async listByClient(data: ListByClientRequest) {
    const result = await this.subscriptionService.findAll(
      { clientId: data.client_id },
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
      },
    );
    return {
      subscriptions: result.subscriptions,
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('SubscriptionService', 'ListByPlan')
  async listByPlan(data: ListByPlanRequest) {
    // Plan-based filtering will be enhanced in domain service (Task 5)
    const result = await this.subscriptionService.findAll(
      {},
      {
        page: data.pagination?.page,
        limit: data.pagination?.limit,
      },
    );
    return {
      subscriptions: result.subscriptions,
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total_pages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('SubscriptionService', 'Activate')
  async activate(data: ActivateSubscriptionRequest) {
    const entity = await this.subscriptionService.findById(data.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Subscription ${data.id} not found` });
    }

    const previousStatus = entity.status;
    entity.status = SubscriptionStatus.ACTIVE;
    const saved = await this.subscriptionService.save(entity);

    await this.statusHistoryService.create({
      subscriptionId: data.id,
      previousStatus,
      newStatus: SubscriptionStatus.ACTIVE,
      reason: 'Activated',
    });

    return saved;
  }

  @GrpcMethod('SubscriptionService', 'Pause')
  async pause(data: PauseSubscriptionRequest) {
    const entity = await this.subscriptionService.findById(data.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Subscription ${data.id} not found` });
    }

    const previousStatus = entity.status;
    entity.status = SubscriptionStatus.SUSPENDED;
    entity.pausedAt = new Date().toISOString();
    const saved = await this.subscriptionService.save(entity);

    await this.statusHistoryService.create({
      subscriptionId: data.id,
      previousStatus,
      newStatus: SubscriptionStatus.SUSPENDED,
      reason: data.reason || 'Paused by user',
    });

    return saved;
  }

  @GrpcMethod('SubscriptionService', 'Resume')
  async resume(data: ResumeSubscriptionRequest) {
    const entity = await this.subscriptionService.findById(data.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Subscription ${data.id} not found` });
    }

    const previousStatus = entity.status;
    entity.status = SubscriptionStatus.ACTIVE;
    entity.resumedAt = new Date().toISOString();
    const saved = await this.subscriptionService.save(entity);

    await this.statusHistoryService.create({
      subscriptionId: data.id,
      previousStatus,
      newStatus: SubscriptionStatus.ACTIVE,
      reason: 'Resumed',
    });

    return saved;
  }

  @GrpcMethod('SubscriptionService', 'Cancel')
  async cancel(data: CancelSubscriptionRequest) {
    const entity = await this.subscriptionService.findById(data.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Subscription ${data.id} not found` });
    }

    const previousStatus = entity.status;
    entity.status = SubscriptionStatus.CANCELLED;
    entity.endDate = new Date().toISOString();
    const saved = await this.subscriptionService.save(entity);

    await this.statusHistoryService.create({
      subscriptionId: data.id,
      previousStatus,
      newStatus: SubscriptionStatus.CANCELLED,
      reason: data.reason || 'Canceled by user',
    });

    return saved;
  }

  @GrpcMethod('SubscriptionService', 'Expire')
  async expire(data: ExpireSubscriptionRequest) {
    const entity = await this.subscriptionService.findById(data.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Subscription ${data.id} not found` });
    }

    const previousStatus = entity.status;
    entity.status = SubscriptionStatus.EXPIRED;
    entity.endDate = new Date().toISOString();
    const saved = await this.subscriptionService.save(entity);

    await this.statusHistoryService.create({
      subscriptionId: data.id,
      previousStatus,
      newStatus: SubscriptionStatus.EXPIRED,
      reason: 'Expired',
    });

    return saved;
  }

  @GrpcMethod('SubscriptionService', 'Suspend')
  async suspend(data: SuspendSubscriptionRequest) {
    const entity = await this.subscriptionService.findById(data.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Subscription ${data.id} not found` });
    }

    const previousStatus = entity.status;
    entity.status = SubscriptionStatus.SUSPENDED;
    entity.suspendedAt = new Date();
    entity.suspensionReason = data.reason || 'Suspended';
    const saved = await this.subscriptionService.save(entity);

    await this.statusHistoryService.create({
      subscriptionId: data.id,
      previousStatus,
      newStatus: SubscriptionStatus.SUSPENDED,
      reason: data.reason || 'Suspended',
    });

    return saved;
  }

  @GrpcMethod('SubscriptionService', 'Reactivate')
  async reactivate(data: ReactivateSubscriptionRequest) {
    const entity = await this.subscriptionService.findById(data.id);
    if (!entity) {
      throw new RpcException({ code: status.NOT_FOUND, message: `Subscription ${data.id} not found` });
    }

    const previousStatus = entity.status;
    entity.status = SubscriptionStatus.ACTIVE;
    entity.suspendedAt = null;
    entity.suspensionReason = null;
    const saved = await this.subscriptionService.save(entity);

    await this.statusHistoryService.create({
      subscriptionId: data.id,
      previousStatus,
      newStatus: SubscriptionStatus.ACTIVE,
      reason: 'Reactivated',
    });

    return saved;
  }

  @GrpcMethod('SubscriptionService', 'GetDueForCharge')
  async getDueForCharge(data: GetDueForChargeRequest) {
    const beforeDate = data.before_date ? new Date(data.before_date) : new Date();
    const subscriptions = await this.subscriptionService.getDueForCharge(
      data.organisation_id,
      beforeDate,
    );
    return {
      subscriptions,
      pagination: {
        total: subscriptions.length,
        page: 1,
        limit: subscriptions.length,
        total_pages: 1,
      },
    };
  }

  @GrpcMethod('SubscriptionService', 'GetDueForTrialConversion')
  async getDueForTrialConversion(data: GetDueForTrialConversionRequest) {
    const subscriptions = await this.subscriptionService.getDueForTrialConversion(
      data.organisation_id,
    );
    return {
      subscriptions,
      pagination: {
        total: subscriptions.length,
        page: 1,
        limit: subscriptions.length,
        total_pages: 1,
      },
    };
  }
}

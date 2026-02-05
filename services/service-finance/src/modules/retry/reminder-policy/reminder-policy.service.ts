import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ReminderPolicyEntity, ReminderTriggerRule } from './entities/reminder-policy.entity';
import type {
  CreateReminderPolicyRequest,
  UpdateReminderPolicyRequest,
} from '@crm/proto/retry';

export type CreateReminderPolicyInput = Omit<CreateReminderPolicyRequest, 'triggerRules'> & {
  triggerRules: ReminderTriggerRule[];
};

export type UpdateReminderPolicyInput = Omit<UpdateReminderPolicyRequest, 'triggerRules'> & {
  triggerRules?: ReminderTriggerRule[];
};

@Injectable()
export class ReminderPolicyService {
  private readonly logger = new Logger(ReminderPolicyService.name);

  constructor(
    @InjectRepository(ReminderPolicyEntity)
    private readonly policyRepository: Repository<ReminderPolicyEntity>,
  ) {}

  async create(input: CreateReminderPolicyInput): Promise<ReminderPolicyEntity> {
    this.logger.log(`Creating reminder policy: ${input.name} for org ${input.organisation_id}`);

    const policy = this.policyRepository.create({
      organisationId: input.organisation_id,
      societeId: input.societe_id || null,
      name: input.name,
      description: input.description || null,
      triggerRules: input.triggerRules,
      cooldownHours: input.cooldown_hours ?? 24,
      maxRemindersPerDay: input.max_reminders_per_day ?? 3,
      maxRemindersPerWeek: input.max_reminders_per_week ?? 10,
      allowedStartHour: input.allowed_start_hour ?? 9,
      allowedEndHour: input.allowed_end_hour ?? 19,
      allowedDaysOfWeek: input.allowed_days_of_week ?? [1, 2, 3, 4, 5],
      respectOptOut: input.respect_opt_out ?? true,
      isDefault: input.is_default || false,
      priority: input.priority || 0,
      isActive: true,
    });

    return this.policyRepository.save(policy);
  }

  async update(input: UpdateReminderPolicyInput): Promise<ReminderPolicyEntity> {
    const policy = await this.findById(input.id);

    if (input.name !== undefined) policy.name = input.name;
    if (input.description !== undefined) policy.description = input.description || null;
    if (input.triggerRules !== undefined) policy.triggerRules = input.triggerRules;
    if (input.cooldown_hours !== undefined) policy.cooldownHours = input.cooldown_hours;
    if (input.max_reminders_per_day !== undefined) policy.maxRemindersPerDay = input.max_reminders_per_day;
    if (input.max_reminders_per_week !== undefined) policy.maxRemindersPerWeek = input.max_reminders_per_week;
    if (input.allowed_start_hour !== undefined) policy.allowedStartHour = input.allowed_start_hour;
    if (input.allowed_end_hour !== undefined) policy.allowedEndHour = input.allowed_end_hour;
    if (input.allowed_days_of_week !== undefined) policy.allowedDaysOfWeek = input.allowed_days_of_week;
    if (input.respect_opt_out !== undefined) policy.respectOptOut = input.respect_opt_out;
    if (input.is_active !== undefined) policy.isActive = input.is_active;
    if (input.is_default !== undefined) policy.isDefault = input.is_default;
    if (input.priority !== undefined) policy.priority = input.priority;

    return this.policyRepository.save(policy);
  }

  async findById(id: string): Promise<ReminderPolicyEntity> {
    const policy = await this.policyRepository.findOne({
      where: { id },
    });

    if (!policy) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Reminder policy ${id} not found`,
      });
    }

    return policy;
  }

  async findAll(input: {
    organisationId: string;
    societeId?: string;
    activeOnly?: boolean;
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string };
  }): Promise<{
    policies: ReminderPolicyEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 20;
    const sortBy = input.pagination?.sortBy || 'priority';
    const sortOrder = (input.pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const queryBuilder = this.policyRepository
      .createQueryBuilder('policy')
      .where('policy.organisationId = :organisationId', { organisationId: input.organisationId });

    if (input.societeId) {
      queryBuilder.andWhere('(policy.societeId = :societeId OR policy.societeId IS NULL)', {
        societeId: input.societeId,
      });
    }

    if (input.activeOnly) {
      queryBuilder.andWhere('policy.isActive = :isActive', { isActive: true });
    }

    const [policies, total] = await queryBuilder
      .orderBy(`policy.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      policies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findApplicablePolicy(
    organisationId: string,
    societeId?: string,
  ): Promise<ReminderPolicyEntity | null> {
    const queryBuilder = this.policyRepository
      .createQueryBuilder('policy')
      .where('policy.organisationId = :organisationId', { organisationId })
      .andWhere('policy.isActive = :isActive', { isActive: true });

    if (societeId) {
      queryBuilder.andWhere('(policy.societeId = :societeId OR policy.societeId IS NULL)', {
        societeId,
      });
    }

    return queryBuilder
      .orderBy('policy.priority', 'DESC')
      .addOrderBy('policy.societeId', 'DESC', 'NULLS LAST')
      .getOne();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.policyRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

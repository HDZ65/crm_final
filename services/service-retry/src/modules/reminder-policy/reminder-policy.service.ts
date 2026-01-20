import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { ReminderPolicyEntity } from './entities/reminder-policy.entity';

import { ReminderTriggerRule } from './entities/reminder-policy.entity';

interface CreateReminderPolicyInput {
  organisationId: string;
  societeId?: string;
  name: string;
  description?: string;
  triggerRules: ReminderTriggerRule[];
  cooldownHours?: number;
  maxRemindersPerDay?: number;
  maxRemindersPerWeek?: number;
  allowedStartHour?: number;
  allowedEndHour?: number;
  allowedDaysOfWeek?: number[];
  respectOptOut?: boolean;
  isDefault?: boolean;
  priority?: number;
}

interface UpdateReminderPolicyInput {
  id: string;
  name?: string;
  description?: string;
  triggerRules?: ReminderTriggerRule[];
  cooldownHours?: number;
  maxRemindersPerDay?: number;
  maxRemindersPerWeek?: number;
  allowedStartHour?: number;
  allowedEndHour?: number;
  allowedDaysOfWeek?: number[];
  respectOptOut?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
  priority?: number;
}

@Injectable()
export class ReminderPolicyService {
  private readonly logger = new Logger(ReminderPolicyService.name);

  constructor(
    @InjectRepository(ReminderPolicyEntity)
    private readonly policyRepository: Repository<ReminderPolicyEntity>,
  ) {}

  async create(input: CreateReminderPolicyInput): Promise<ReminderPolicyEntity> {
    this.logger.log(`Creating reminder policy: ${input.name} for org ${input.organisationId}`);

    const policy = this.policyRepository.create({
      organisationId: input.organisationId,
      societeId: input.societeId || null,
      name: input.name,
      description: input.description || null,
      triggerRules: input.triggerRules,
      cooldownHours: input.cooldownHours ?? 24,
      maxRemindersPerDay: input.maxRemindersPerDay ?? 3,
      maxRemindersPerWeek: input.maxRemindersPerWeek ?? 10,
      allowedStartHour: input.allowedStartHour ?? 9,
      allowedEndHour: input.allowedEndHour ?? 19,
      allowedDaysOfWeek: input.allowedDaysOfWeek ?? [1, 2, 3, 4, 5],
      respectOptOut: input.respectOptOut ?? true,
      isDefault: input.isDefault || false,
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
    if (input.cooldownHours !== undefined) policy.cooldownHours = input.cooldownHours;
    if (input.maxRemindersPerDay !== undefined) policy.maxRemindersPerDay = input.maxRemindersPerDay;
    if (input.maxRemindersPerWeek !== undefined) policy.maxRemindersPerWeek = input.maxRemindersPerWeek;
    if (input.allowedStartHour !== undefined) policy.allowedStartHour = input.allowedStartHour;
    if (input.allowedEndHour !== undefined) policy.allowedEndHour = input.allowedEndHour;
    if (input.allowedDaysOfWeek !== undefined) policy.allowedDaysOfWeek = input.allowedDaysOfWeek;
    if (input.respectOptOut !== undefined) policy.respectOptOut = input.respectOptOut;
    if (input.isActive !== undefined) policy.isActive = input.isActive;
    if (input.isDefault !== undefined) policy.isDefault = input.isDefault;
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

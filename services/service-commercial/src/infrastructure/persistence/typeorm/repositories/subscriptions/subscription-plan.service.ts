import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SubscriptionPlanEntity } from '../../../../../domain/subscriptions/entities/subscription-plan.entity';
import { ISubscriptionPlanRepository } from '../../../../../domain/subscriptions/repositories/ISubscriptionPlanRepository';

@Injectable()
export class SubscriptionPlanService implements ISubscriptionPlanRepository {
  private readonly logger = new Logger(SubscriptionPlanService.name);

  constructor(
    @InjectRepository(SubscriptionPlanEntity)
    private readonly repository: Repository<SubscriptionPlanEntity>,
  ) {}

  async findById(id: string): Promise<SubscriptionPlanEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByOrganisation(organisationId: string, pagination?: {
    page?: number;
    limit?: number;
  }): Promise<{
    plans: SubscriptionPlanEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [plans, total] = await this.repository.findAndCount({
      where: { organisationId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      plans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async save(entity: SubscriptionPlanEntity): Promise<SubscriptionPlanEntity> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async create(input: {
    organisationId: string;
    name: string;
    description?: string;
    billingInterval: string;
    amount: number;
    currency?: string;
    trialDays?: number;
    isActive?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<SubscriptionPlanEntity> {
    const entity = this.repository.create({
      organisationId: input.organisationId,
      name: input.name,
      description: input.description || null,
      billingInterval: input.billingInterval,
      amount: input.amount,
      currency: input.currency || 'EUR',
      trialDays: input.trialDays ?? 0,
      isActive: input.isActive ?? true,
      metadata: input.metadata || null,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    name?: string;
    description?: string;
    billingInterval?: string;
    amount?: number;
    currency?: string;
    trialDays?: number;
    isActive?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<SubscriptionPlanEntity> {
    const entity = await this.findById(input.id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Subscription plan ${input.id} not found`,
      });
    }

    if (input.name !== undefined) entity.name = input.name;
    if (input.description !== undefined) entity.description = input.description || null;
    if (input.billingInterval !== undefined) entity.billingInterval = input.billingInterval;
    if (input.amount !== undefined) entity.amount = input.amount;
    if (input.currency !== undefined) entity.currency = input.currency;
    if (input.trialDays !== undefined) entity.trialDays = input.trialDays;
    if (input.isActive !== undefined) entity.isActive = input.isActive;
    if (input.metadata !== undefined) entity.metadata = input.metadata || null;

    return this.repository.save(entity);
  }
}

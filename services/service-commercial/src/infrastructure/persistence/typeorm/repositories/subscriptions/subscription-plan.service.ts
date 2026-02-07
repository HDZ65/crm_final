import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SubscriptionPlanEntity } from '../../../../../domain/subscriptions/entities/subscription-plan.entity';
import { SubscriptionPlanType } from '../../../../../domain/subscriptions/entities/subscription.entity';
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

  async findByCode(
    organisationId: string,
    code: SubscriptionPlanType,
  ): Promise<SubscriptionPlanEntity | null> {
    return this.repository.findOne({
      where: {
        organisationId,
        code,
        active: true,
      },
    });
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
    code?: string;
    name: string;
    description?: string;
    priceMonthly?: number;
    priceAnnual?: number;
    billingInterval: string;
    amount: number;
    currency?: string;
    trialDays?: number;
    features?: Record<string, unknown>;
    active?: boolean;
    isActive?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<SubscriptionPlanEntity> {
    const priceMonthly = input.priceMonthly ?? input.amount ?? 0;
    const priceAnnual = input.priceAnnual ?? priceMonthly * 12;

    const entity = this.repository.create({
      organisationId: input.organisationId,
      code: this.normalizeCode(input.code),
      name: input.name,
      description: input.description || null,
      priceMonthly,
      priceAnnual,
      currency: input.currency || 'EUR',
      trialDays: input.trialDays ?? 0,
      features: input.features || input.metadata || null,
      active: input.active ?? input.isActive ?? true,
    });

    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    code?: string;
    name?: string;
    description?: string;
    priceMonthly?: number;
    priceAnnual?: number;
    billingInterval?: string;
    amount?: number;
    currency?: string;
    trialDays?: number;
    features?: Record<string, unknown>;
    active?: boolean;
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

    if (input.code !== undefined) entity.code = this.normalizeCode(input.code);
    if (input.name !== undefined) entity.name = input.name;
    if (input.description !== undefined) entity.description = input.description || null;
    if (input.priceMonthly !== undefined) entity.priceMonthly = input.priceMonthly;
    if (input.priceAnnual !== undefined) entity.priceAnnual = input.priceAnnual;
    if (input.amount !== undefined && input.priceMonthly === undefined) {
      entity.priceMonthly = input.amount;
    }
    if (
      input.amount !== undefined &&
      input.priceAnnual === undefined &&
      input.priceMonthly === undefined
    ) {
      entity.priceAnnual = input.amount * 12;
    }
    if (input.currency !== undefined) entity.currency = input.currency;
    if (input.trialDays !== undefined) entity.trialDays = input.trialDays;
    if (input.active !== undefined) entity.active = input.active;
    if (input.isActive !== undefined && input.active === undefined) {
      entity.active = input.isActive;
    }
    if (input.features !== undefined) entity.features = input.features || null;
    if (input.metadata !== undefined && input.features === undefined) {
      entity.features = input.metadata || null;
    }

    return this.repository.save(entity);
  }

  private normalizeCode(code?: string): SubscriptionPlanType {
    const normalized = String(code || SubscriptionPlanType.FREE_AVOD).trim().toUpperCase();

    if (Object.values(SubscriptionPlanType).includes(normalized as SubscriptionPlanType)) {
      return normalized as SubscriptionPlanType;
    }

    this.logger.warn(`Unknown plan code "${code}" received, fallback to FREE_AVOD`);
    return SubscriptionPlanType.FREE_AVOD;
  }
}

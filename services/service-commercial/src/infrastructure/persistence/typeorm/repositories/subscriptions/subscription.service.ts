import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThanOrEqual } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  SubscriptionEntity,
  SubscriptionFrequency,
  SubscriptionPlanType,
  SubscriptionStatus,
  StoreSource,
} from '../../../../../domain/subscriptions/entities/subscription.entity';
import { ISubscriptionRepository } from '../../../../../domain/subscriptions/repositories/ISubscriptionRepository';

@Injectable()
export class SubscriptionService implements ISubscriptionRepository {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repository: Repository<SubscriptionEntity>,
  ) {}

  async findById(id: string): Promise<SubscriptionEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithDetails(id: string): Promise<SubscriptionEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['lines', 'history', 'cycles', 'statusHistory'],
    });
  }

  async findAll(
    filters?: {
      organisationId?: string;
      clientId?: string;
      status?: string;
      planType?: string;
      storeSource?: string;
    },
    pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: string },
  ): Promise<{
    subscriptions: SubscriptionEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';

    const where: FindOptionsWhere<SubscriptionEntity> = {};
    if (filters?.organisationId) where.organisationId = filters.organisationId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.status) where.status = this.normalizeStatus(filters.status);
    if (filters?.planType) where.planType = filters.planType as SubscriptionPlanType;
    if (filters?.storeSource) where.storeSource = filters.storeSource as StoreSource;

    const [subscriptions, total] = await this.repository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      subscriptions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDueForCharge(organisationId: string, beforeDate: Date): Promise<SubscriptionEntity[]> {
    return this.repository.find({
      where: {
        organisationId,
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
        nextChargeAt: LessThanOrEqual(beforeDate),
      },
      order: { nextChargeAt: 'ASC' },
    });
  }

  async getDueForTrialConversion(organisationId: string): Promise<SubscriptionEntity[]> {
    return this.repository.find({
      where: {
        organisationId,
        status: SubscriptionStatus.TRIAL,
        trialEnd: LessThanOrEqual(new Date()),
      },
      order: { trialEnd: 'ASC' },
    });
  }

  async findDueForCharge(organisationId: string, beforeDate: string): Promise<SubscriptionEntity[]> {
    return this.getDueForCharge(organisationId, new Date(beforeDate));
  }

  async save(entity: SubscriptionEntity): Promise<SubscriptionEntity> {
    return this.repository.save(entity);
  }

  async updateStatus(id: string, statusValue: string): Promise<SubscriptionEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Subscription ${id} not found`,
      });
    }
    entity.status = this.normalizeStatus(statusValue);
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async create(input: {
    organisationId: string;
    clientId: string;
    planType?: string;
    storeSource?: string;
    contratId?: string;
    status: string;
    frequency: string;
    amount: number;
    currency?: string;
    startDate: string;
    endDate?: string;
    nextChargeAt: string;
    imsSubscriptionId?: string;
    couponId?: string;
    cancelAtPeriodEnd?: boolean;
    addOns?: Record<string, unknown>;
  }): Promise<SubscriptionEntity> {
    const entity = this.repository.create({
      organisationId: input.organisationId,
      clientId: input.clientId,
      planType: (input.planType as SubscriptionPlanType) || SubscriptionPlanType.FREE_AVOD,
      status: this.normalizeStatus(input.status),
      frequency: this.normalizeFrequency(input.frequency),
      trialStart: null,
      trialEnd: null,
      currentPeriodStart: this.parseDate(input.startDate),
      currentPeriodEnd: this.parseDate(input.endDate),
      nextChargeAt: this.parseDate(input.nextChargeAt),
      amount: input.amount,
      currency: input.currency || 'EUR',
      storeSource: this.normalizeStoreSource(input.storeSource),
      imsSubscriptionId: input.imsSubscriptionId || null,
      couponId: input.couponId || null,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
      cancelledAt: null,
      suspendedAt: null,
      suspensionReason: null,
      addOns: input.addOns || null,
    });

    entity.contratId = input.contratId || null;
    entity.retryCount = 0;

    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
    planType?: string;
    storeSource?: string;
    contratId?: string;
    status?: string;
    frequency?: string;
    amount?: number;
    currency?: string;
    startDate?: string;
    endDate?: string;
    pausedAt?: string;
    resumedAt?: string;
    nextChargeAt?: string;
    retryCount?: number;
    trialStart?: string;
    trialEnd?: string;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: string;
    suspendedAt?: string;
    suspensionReason?: string;
    imsSubscriptionId?: string;
    couponId?: string;
    addOns?: Record<string, unknown>;
  }): Promise<SubscriptionEntity> {
    const entity = await this.findById(input.id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Subscription ${input.id} not found`,
      });
    }

    if (input.planType !== undefined) entity.planType = input.planType as SubscriptionPlanType;
    if (input.storeSource !== undefined) entity.storeSource = this.normalizeStoreSource(input.storeSource);
    if (input.contratId !== undefined) entity.contratId = input.contratId || null;
    if (input.status !== undefined) entity.status = this.normalizeStatus(input.status);
    if (input.frequency !== undefined) entity.frequency = this.normalizeFrequency(input.frequency);
    if (input.amount !== undefined) entity.amount = input.amount;
    if (input.currency !== undefined) entity.currency = input.currency;
    if (input.startDate !== undefined) entity.currentPeriodStart = this.parseDate(input.startDate);
    if (input.endDate !== undefined) entity.currentPeriodEnd = this.parseDate(input.endDate);
    if (input.pausedAt !== undefined) entity.pausedAt = input.pausedAt || null;
    if (input.resumedAt !== undefined) entity.resumedAt = input.resumedAt || null;
    if (input.nextChargeAt !== undefined) entity.nextChargeAt = this.parseDate(input.nextChargeAt);
    if (input.retryCount !== undefined) entity.retryCount = input.retryCount;
    if (input.trialStart !== undefined) entity.trialStart = this.parseDate(input.trialStart);
    if (input.trialEnd !== undefined) entity.trialEnd = this.parseDate(input.trialEnd);
    if (input.cancelAtPeriodEnd !== undefined) entity.cancelAtPeriodEnd = input.cancelAtPeriodEnd;
    if (input.cancelledAt !== undefined) entity.cancelledAt = this.parseDate(input.cancelledAt);
    if (input.suspendedAt !== undefined) entity.suspendedAt = this.parseDate(input.suspendedAt);
    if (input.suspensionReason !== undefined) entity.suspensionReason = input.suspensionReason || null;
    if (input.imsSubscriptionId !== undefined) {
      entity.imsSubscriptionId = input.imsSubscriptionId || null;
    }
    if (input.couponId !== undefined) {
      entity.couponId = input.couponId || null;
    }
    if (input.addOns !== undefined) {
      entity.addOns = input.addOns || null;
    }

    return this.repository.save(entity);
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  private normalizeStatus(value: string): SubscriptionStatus {
    const normalized = String(value || '').trim().toUpperCase();

    if (normalized === 'CANCELED') {
      return SubscriptionStatus.CANCELLED;
    }

    if (normalized === 'PAUSED') {
      return SubscriptionStatus.SUSPENDED;
    }

    if (Object.values(SubscriptionStatus).includes(normalized as SubscriptionStatus)) {
      return normalized as SubscriptionStatus;
    }

    throw new RpcException({
      code: status.INVALID_ARGUMENT,
      message: `Unsupported subscription status: ${value}`,
    });
  }

  private normalizeFrequency(value: string): SubscriptionFrequency {
    const normalized = String(value || '').trim().toUpperCase();

    if (normalized === 'YEARLY') {
      return SubscriptionFrequency.ANNUAL;
    }

    if (Object.values(SubscriptionFrequency).includes(normalized as SubscriptionFrequency)) {
      return normalized as SubscriptionFrequency;
    }

    return SubscriptionFrequency.MONTHLY;
  }

  private normalizeStoreSource(value?: string): StoreSource {
    const normalized = String(value || StoreSource.WEB_DIRECT).trim().toUpperCase();

    if (Object.values(StoreSource).includes(normalized as StoreSource)) {
      return normalized as StoreSource;
    }

    return StoreSource.WEB_DIRECT;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThanOrEqual } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SubscriptionEntity } from '../../../../../domain/subscriptions/entities/subscription.entity';
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
      contratId?: string;
      status?: string;
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
    if (filters?.contratId) where.contratId = filters.contratId;
    if (filters?.status) where.status = filters.status;

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

  async findDueForCharge(organisationId: string, beforeDate: string): Promise<SubscriptionEntity[]> {
    return this.repository.find({
      where: {
        organisationId,
        status: 'ACTIVE',
        nextChargeAt: LessThanOrEqual(beforeDate),
      },
    });
  }

  async save(entity: SubscriptionEntity): Promise<SubscriptionEntity> {
    return this.repository.save(entity);
  }

  async updateStatus(id: string, newStatus: string): Promise<SubscriptionEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Subscription ${id} not found`,
      });
    }
    entity.status = newStatus;
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async create(input: {
    organisationId: string;
    clientId: string;
    contratId?: string;
    status: string;
    frequency: string;
    amount: number;
    currency?: string;
    startDate: string;
    endDate?: string;
    nextChargeAt: string;
  }): Promise<SubscriptionEntity> {
    const entity = this.repository.create({
      organisationId: input.organisationId,
      clientId: input.clientId,
      contratId: input.contratId || null,
      status: input.status,
      frequency: input.frequency,
      amount: input.amount,
      currency: input.currency || 'EUR',
      startDate: input.startDate,
      endDate: input.endDate || null,
      nextChargeAt: input.nextChargeAt,
    });
    return this.repository.save(entity);
  }

  async update(input: {
    id: string;
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
  }): Promise<SubscriptionEntity> {
    const entity = await this.findById(input.id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Subscription ${input.id} not found`,
      });
    }

    if (input.status !== undefined) entity.status = input.status;
    if (input.frequency !== undefined) entity.frequency = input.frequency;
    if (input.amount !== undefined) entity.amount = input.amount;
    if (input.currency !== undefined) entity.currency = input.currency;
    if (input.startDate !== undefined) entity.startDate = input.startDate;
    if (input.endDate !== undefined) entity.endDate = input.endDate || null;
    if (input.pausedAt !== undefined) entity.pausedAt = input.pausedAt || null;
    if (input.resumedAt !== undefined) entity.resumedAt = input.resumedAt || null;
    if (input.nextChargeAt !== undefined) entity.nextChargeAt = input.nextChargeAt;
    if (input.retryCount !== undefined) entity.retryCount = input.retryCount;

    return this.repository.save(entity);
  }
}

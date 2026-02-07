import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SubscriptionCycleEntity } from '../../../../../domain/subscriptions/entities/subscription-cycle.entity';
import { ISubscriptionCycleRepository } from '../../../../../domain/subscriptions/repositories/ISubscriptionCycleRepository';

@Injectable()
export class SubscriptionCycleService implements ISubscriptionCycleRepository {
  private readonly logger = new Logger(SubscriptionCycleService.name);

  constructor(
    @InjectRepository(SubscriptionCycleEntity)
    private readonly repository: Repository<SubscriptionCycleEntity>,
  ) {}

  async findById(id: string): Promise<SubscriptionCycleEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findBySubscription(subscriptionId: string): Promise<SubscriptionCycleEntity[]> {
    return this.repository.find({
      where: { subscriptionId },
      order: { cycleNumber: 'DESC' },
    });
  }

  async save(entity: SubscriptionCycleEntity): Promise<SubscriptionCycleEntity> {
    return this.repository.save(entity);
  }

  async updateChargeStatus(id: string, chargeStatus: string): Promise<SubscriptionCycleEntity> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Subscription cycle ${id} not found`,
      });
    }
    entity.chargeStatus = chargeStatus;
    entity.chargeDate = new Date();
    return this.repository.save(entity);
  }

  async create(input: {
    subscriptionId: string;
    cycleNumber: number;
    periodStart: Date;
    periodEnd: Date;
    amount: number;
    chargeStatus?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SubscriptionCycleEntity> {
    const entity = this.repository.create({
      subscriptionId: input.subscriptionId,
      cycleNumber: input.cycleNumber,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      amount: input.amount,
      chargeStatus: input.chargeStatus || null,
      metadata: input.metadata || null,
    });
    return this.repository.save(entity);
  }
}

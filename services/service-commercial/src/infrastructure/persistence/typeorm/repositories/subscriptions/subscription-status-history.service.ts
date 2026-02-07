import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionStatusHistoryEntity } from '../../../../../domain/subscriptions/entities/subscription-status-history.entity';
import { ISubscriptionStatusHistoryRepository } from '../../../../../domain/subscriptions/repositories/ISubscriptionStatusHistoryRepository';

@Injectable()
export class SubscriptionStatusHistoryService implements ISubscriptionStatusHistoryRepository {
  private readonly logger = new Logger(SubscriptionStatusHistoryService.name);

  constructor(
    @InjectRepository(SubscriptionStatusHistoryEntity)
    private readonly repository: Repository<SubscriptionStatusHistoryEntity>,
  ) {}

  async findById(id: string): Promise<SubscriptionStatusHistoryEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findBySubscription(subscriptionId: string): Promise<SubscriptionStatusHistoryEntity[]> {
    return this.repository.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });
  }

  async save(entity: SubscriptionStatusHistoryEntity): Promise<SubscriptionStatusHistoryEntity> {
    return this.repository.save(entity);
  }

  async create(input: {
    subscriptionId: string;
    previousStatus?: string;
    newStatus: string;
    reason?: string;
    changedBy?: string;
  }): Promise<SubscriptionStatusHistoryEntity> {
    const entity = this.repository.create({
      subscriptionId: input.subscriptionId,
      previousStatus: input.previousStatus || null,
      newStatus: input.newStatus,
      reason: input.reason || null,
      changedBy: input.changedBy || null,
    });
    return this.repository.save(entity);
  }
}

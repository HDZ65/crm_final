import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SubscriptionHistoryEntity,
  SubscriptionTriggeredBy,
} from '../../../../../domain/subscriptions/entities/subscription-history.entity';
import { ISubscriptionHistoryRepository } from '../../../../../domain/subscriptions/repositories/ISubscriptionHistoryRepository';

@Injectable()
export class SubscriptionHistoryService implements ISubscriptionHistoryRepository {
  private readonly logger = new Logger(SubscriptionHistoryService.name);

  constructor(
    @InjectRepository(SubscriptionHistoryEntity)
    private readonly repository: Repository<SubscriptionHistoryEntity>,
  ) {}

  async findById(id: string): Promise<SubscriptionHistoryEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findBySubscription(subscriptionId: string): Promise<SubscriptionHistoryEntity[]> {
    return this.repository.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(input: {
    subscriptionId: string;
    oldStatus: string | null;
    newStatus: string;
    reason?: string | null;
    triggeredBy: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<SubscriptionHistoryEntity> {
    const entity = this.repository.create({
      subscriptionId: input.subscriptionId,
      oldStatus: input.oldStatus,
      newStatus: input.newStatus,
      reason: input.reason || null,
      triggeredBy: this.normalizeTriggeredBy(input.triggeredBy),
      metadata: input.metadata || null,
    });

    return this.repository.save(entity);
  }

  async save(entity: SubscriptionHistoryEntity): Promise<SubscriptionHistoryEntity> {
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private normalizeTriggeredBy(value: string): SubscriptionTriggeredBy {
    const normalized = String(value || '').trim().toUpperCase();

    if (Object.values(SubscriptionTriggeredBy).includes(normalized as SubscriptionTriggeredBy)) {
      return normalized as SubscriptionTriggeredBy;
    }

    this.logger.warn(`Unknown triggered_by "${value}" received, fallback to SYSTEM`);
    return SubscriptionTriggeredBy.SYSTEM;
  }
}

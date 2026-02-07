import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SubscriptionPreferenceHistoryEntity,
  AppliedCycle,
} from '../../../../../domain/subscriptions/entities/subscription-preference-history.entity';
import { ISubscriptionPreferenceHistoryRepository } from '../../../../../domain/subscriptions/repositories/ISubscriptionPreferenceHistoryRepository';
import { SubscriptionPreferenceEntity } from '../../../../../domain/subscriptions/entities/subscription-preference.entity';

@Injectable()
export class SubscriptionPreferenceHistoryService implements ISubscriptionPreferenceHistoryRepository {
  private readonly logger = new Logger(SubscriptionPreferenceHistoryService.name);

  constructor(
    @InjectRepository(SubscriptionPreferenceHistoryEntity)
    private readonly repository: Repository<SubscriptionPreferenceHistoryEntity>,
    @InjectRepository(SubscriptionPreferenceEntity)
    private readonly preferenceRepository: Repository<SubscriptionPreferenceEntity>,
  ) {}

  async findByPreference(preferenceId: string): Promise<SubscriptionPreferenceHistoryEntity[]> {
    return this.repository.find({
      where: { preferenceId },
      order: { changedAt: 'DESC' },
    });
  }

  async findBySubscription(subscriptionId: string): Promise<SubscriptionPreferenceHistoryEntity[]> {
    // Join through preference to filter by subscriptionId
    const preferences = await this.preferenceRepository.find({
      where: { subscriptionId },
      select: ['id'],
    });

    if (preferences.length === 0) {
      return [];
    }

    const preferenceIds = preferences.map((p) => p.id);

    return this.repository
      .createQueryBuilder('history')
      .where('history.preference_id IN (:...preferenceIds)', { preferenceIds })
      .orderBy('history.changed_at', 'DESC')
      .getMany();
  }

  async create(input: {
    preferenceId: string;
    oldValue: string | null;
    newValue: string;
    changedBy: string;
    appliedCycle?: string;
  }): Promise<SubscriptionPreferenceHistoryEntity> {
    const entity = this.repository.create({
      preferenceId: input.preferenceId,
      oldValue: input.oldValue,
      newValue: input.newValue,
      changedAt: new Date(),
      changedBy: input.changedBy,
      appliedCycle: this.normalizeAppliedCycle(input.appliedCycle),
    });

    return this.repository.save(entity);
  }

  private normalizeAppliedCycle(value?: string): AppliedCycle {
    if (!value) return AppliedCycle.CURRENT;
    const normalized = String(value).trim().toUpperCase();
    if (normalized === 'N+1' || normalized === 'NEXT') return AppliedCycle.NEXT;
    return AppliedCycle.CURRENT;
  }
}

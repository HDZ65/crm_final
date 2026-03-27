import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from '../../../../../domain/subscriptions/entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
  ) {}

  async findById(id: string): Promise<SubscriptionEntity | null> {
    return this.subscriptionRepository.findOne({ where: { id } });
  }

  async save(entity: Partial<SubscriptionEntity>): Promise<SubscriptionEntity> {
    return this.subscriptionRepository.save(entity as SubscriptionEntity);
  }
}

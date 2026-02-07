import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { SubscriptionPreferenceEntity } from '../../../../../domain/subscriptions/entities/subscription-preference.entity';
import { ISubscriptionPreferenceRepository } from '../../../../../domain/subscriptions/repositories/ISubscriptionPreferenceRepository';

@Injectable()
export class SubscriptionPreferenceService implements ISubscriptionPreferenceRepository {
  private readonly logger = new Logger(SubscriptionPreferenceService.name);

  constructor(
    @InjectRepository(SubscriptionPreferenceEntity)
    private readonly repository: Repository<SubscriptionPreferenceEntity>,
  ) {}

  async findById(id: string): Promise<SubscriptionPreferenceEntity | null> {
    return this.repository.findOne({ where: { id }, relations: ['schema'] });
  }

  async findBySubscription(subscriptionId: string): Promise<SubscriptionPreferenceEntity[]> {
    return this.repository.find({
      where: { subscriptionId },
      relations: ['schema'],
      order: { createdAt: 'ASC' },
    });
  }

  async findBySubscriptionAndSchema(
    subscriptionId: string,
    schemaId: string,
  ): Promise<SubscriptionPreferenceEntity | null> {
    return this.repository.findOne({
      where: { subscriptionId, schemaId },
      relations: ['schema'],
    });
  }

  async save(entity: SubscriptionPreferenceEntity): Promise<SubscriptionPreferenceEntity> {
    return this.repository.save(entity);
  }

  async set(input: {
    organisationId: string;
    subscriptionId: string;
    schemaId: string;
    value: string;
    effectiveFrom?: string;
  }): Promise<SubscriptionPreferenceEntity> {
    let entity = await this.findBySubscriptionAndSchema(input.subscriptionId, input.schemaId);

    if (entity) {
      entity.value = input.value;
      if (input.effectiveFrom) {
        entity.effectiveFrom = new Date(input.effectiveFrom);
      }
    } else {
      entity = this.repository.create({
        organisationId: input.organisationId,
        subscriptionId: input.subscriptionId,
        schemaId: input.schemaId,
        value: input.value,
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
        effectiveTo: null,
      });
    }

    return this.repository.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteBySubscription(subscriptionId: string): Promise<void> {
    await this.repository.delete({ subscriptionId });
  }
}

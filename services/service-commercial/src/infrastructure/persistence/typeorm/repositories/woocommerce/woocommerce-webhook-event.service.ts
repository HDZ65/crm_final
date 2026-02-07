import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  WooCommerceWebhookEventEntity,
  WebhookEventStatus,
} from '../../../../../domain/woocommerce/entities/woocommerce-webhook-event.entity';
import { IWooCommerceWebhookEventRepository } from '../../../../../domain/woocommerce/repositories/IWooCommerceWebhookEventRepository';

@Injectable()
export class WooCommerceWebhookEventService implements IWooCommerceWebhookEventRepository {
  private readonly logger = new Logger(WooCommerceWebhookEventService.name);

  constructor(
    @InjectRepository(WooCommerceWebhookEventEntity)
    private readonly repository: Repository<WooCommerceWebhookEventEntity>,
  ) {}

  async findById(id: string): Promise<WooCommerceWebhookEventEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByExternalEventId(
    source: string,
    externalEventId: string,
  ): Promise<WooCommerceWebhookEventEntity | null> {
    return this.repository.findOne({ where: { source, externalEventId } });
  }

  async findAll(filters?: {
    organisationId?: string;
    eventType?: string;
    status?: WebhookEventStatus;
  }): Promise<WooCommerceWebhookEventEntity[]> {
    const where: Record<string, any> = {};
    if (filters?.organisationId) where.organisationId = filters.organisationId;
    if (filters?.eventType) where.eventType = filters.eventType;
    if (filters?.status) where.status = filters.status;

    return this.repository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findPendingEvents(limit = 100): Promise<WooCommerceWebhookEventEntity[]> {
    return this.repository.find({
      where: { status: In([WebhookEventStatus.RECEIVED, WebhookEventStatus.VERIFIED]) },
      order: { receivedAt: 'ASC' },
      take: limit,
    });
  }

  async findFailedEvents(maxRetries: number): Promise<WooCommerceWebhookEventEntity[]> {
    return this.repository
      .createQueryBuilder('event')
      .where('event.status = :status', { status: WebhookEventStatus.FAILED })
      .andWhere('event.retry_count < :maxRetries', { maxRetries })
      .orderBy('event.received_at', 'ASC')
      .getMany();
  }

  async save(entity: WooCommerceWebhookEventEntity): Promise<WooCommerceWebhookEventEntity> {
    return this.repository.save(entity);
  }

  async create(input: {
    organisationId: string;
    source: string;
    externalEventId: string;
    eventType: string;
    wooResourceId: string;
    rawPayload: Record<string, any>;
    signature?: string;
    status?: WebhookEventStatus;
  }): Promise<WooCommerceWebhookEventEntity> {
    const entity = this.repository.create({
      organisationId: input.organisationId,
      source: input.source,
      externalEventId: input.externalEventId,
      eventType: input.eventType,
      wooResourceId: input.wooResourceId,
      rawPayload: input.rawPayload,
      signature: input.signature || null,
      status: input.status || WebhookEventStatus.RECEIVED,
      receivedAt: new Date(),
    });
    return this.repository.save(entity);
  }

  async markVerified(id: string): Promise<void> {
    const entity = await this.findById(id);
    if (entity) {
      entity.markVerified();
      await this.repository.save(entity);
    }
  }

  async markProcessed(id: string): Promise<void> {
    const entity = await this.findById(id);
    if (entity) {
      entity.markProcessed();
      await this.repository.save(entity);
    }
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    const entity = await this.findById(id);
    if (entity) {
      entity.markFailed(errorMessage);
      await this.repository.save(entity);
    }
  }

  async markDuplicate(id: string): Promise<void> {
    const entity = await this.findById(id);
    if (entity) {
      entity.markDuplicate();
      await this.repository.save(entity);
    }
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

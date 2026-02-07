import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ImsWebhookEventEntity,
  ImsWebhookProcessingStatus,
} from '../../../../../domain/mondial-tv/entities/ims-webhook-event.entity';
import { IImsWebhookEventRepository } from '../../../../../domain/mondial-tv/repositories/IImsWebhookEventRepository';

@Injectable()
export class ImsWebhookEventService implements IImsWebhookEventRepository {
  private readonly logger = new Logger(ImsWebhookEventService.name);

  constructor(
    @InjectRepository(ImsWebhookEventEntity)
    private readonly repository: Repository<ImsWebhookEventEntity>,
  ) {}

  async findById(id: string): Promise<ImsWebhookEventEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEventId(eventId: string): Promise<ImsWebhookEventEntity | null> {
    return this.repository.findOne({ where: { eventId } });
  }

  async isEventProcessed(eventId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { eventId } });
    return count > 0;
  }

  async findByStatus(
    status: ImsWebhookProcessingStatus,
    limit = 100,
  ): Promise<ImsWebhookEventEntity[]> {
    return this.repository.find({
      where: { processingStatus: status },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async create(input: {
    organisationId: string;
    eventId: string;
    eventType: string;
    payload: Record<string, any>;
    hmacValid: boolean;
    processingStatus?: ImsWebhookProcessingStatus;
  }): Promise<ImsWebhookEventEntity> {
    const entity = this.repository.create({
      organisationId: input.organisationId,
      eventId: input.eventId,
      eventType: input.eventType,
      payload: input.payload,
      hmacValid: input.hmacValid,
      processingStatus: input.processingStatus || ImsWebhookProcessingStatus.RECEIVED,
      retryCount: 0,
      errorMessage: null,
      processedAt: null,
    });

    return this.repository.save(entity);
  }

  async save(entity: ImsWebhookEventEntity): Promise<ImsWebhookEventEntity> {
    return this.repository.save(entity);
  }

  async markProcessing(id: string): Promise<void> {
    const entity = await this.findById(id);
    if (!entity) {
      this.logger.warn(`Cannot mark processing, event not found: ${id}`);
      return;
    }

    entity.markProcessing();
    await this.repository.save(entity);
  }

  async markDone(id: string, processedAt: Date = new Date()): Promise<void> {
    const entity = await this.findById(id);
    if (!entity) {
      this.logger.warn(`Cannot mark done, event not found: ${id}`);
      return;
    }

    entity.markDone(processedAt);
    await this.repository.save(entity);
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    const entity = await this.findById(id);
    if (!entity) {
      this.logger.warn(`Cannot mark failed, event not found: ${id}`);
      return;
    }

    entity.markFailed(errorMessage);
    await this.repository.save(entity);
  }

  async incrementRetryCount(id: string): Promise<void> {
    const entity = await this.findById(id);
    if (!entity) {
      this.logger.warn(`Cannot increment retry, event not found: ${id}`);
      return;
    }

    entity.incrementRetry();
    await this.repository.save(entity);
  }
}

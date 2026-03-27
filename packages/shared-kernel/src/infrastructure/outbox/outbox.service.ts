import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual, Repository } from 'typeorm';
import { OutboxEvent, OutboxEventStatus } from './outbox.entity.js';
import { NatsService } from '../nats/nats.service';

/**
 * Event data for outbox
 */
export interface OutboxEventData {
  /** Event type (e.g., 'ContractSigned') */
  eventType: string;

  /** NATS subject to publish to */
  subject: string;

  /** Event payload */
  payload: Record<string, unknown>;

  /** Aggregate type (e.g., 'Contract') */
  aggregateType: string;

  /** Aggregate ID */
  aggregateId: string;

  /** Correlation ID for tracing */
  correlationId?: string;

  /** Causation ID */
  causationId?: string;
}

/**
 * Outbox Service
 *
 * Implements the Transactional Outbox pattern for reliable event publishing.
 *
 * Usage:
 * 1. Call scheduleEvent() within your business transaction
 * 2. The OutboxProcessor will publish events to NATS asynchronously
 *
 * @example
 * ```typescript
 * @Injectable()
 * class ContractService {
 *   constructor(
 *     private outbox: OutboxService,
 *     private repo: Repository<Contract>,
 *   ) {}
 *
 *   async createContract(data: CreateContractDto): Promise<Contract> {
 *     return this.repo.manager.transaction(async (manager) => {
 *       const contract = await manager.save(Contract, data);
 *
 *       await this.outbox.scheduleEvent({
 *         eventType: 'ContractCreated',
 *         subject: 'crm.contracts.created',
 *         payload: { contractId: contract.id, ...data },
 *         aggregateType: 'Contract',
 *         aggregateId: contract.id,
 *       }, manager);
 *
 *       return contract;
 *     });
 *   }
 * }
 * ```
 */
@Injectable()
export class OutboxService implements OnModuleDestroy {
  private readonly logger = new Logger(OutboxService.name);
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
    private readonly natsService: NatsService,
  ) {}

  /**
   * Schedule an event for publishing
   * MUST be called within the same transaction as the business operation
   */
  async scheduleEvent(eventData: OutboxEventData, manager?: EntityManager): Promise<OutboxEvent> {
    const repo = manager ? manager.getRepository(OutboxEvent) : this.outboxRepository;

    const event = repo.create({
      eventType: eventData.eventType,
      subject: eventData.subject,
      payload: {
        event_id: this.generateEventId(),
        timestamp: Date.now(),
        correlation_id: eventData.correlationId,
        ...eventData.payload,
      },
      aggregateType: eventData.aggregateType,
      aggregateId: eventData.aggregateId,
      correlationId: eventData.correlationId,
      causationId: eventData.causationId,
      status: OutboxEventStatus.PENDING,
      attempts: 0,
      maxAttempts: 5,
    });

    return repo.save(event);
  }

  /**
   * Schedule multiple events atomically
   */
  async scheduleEvents(eventsData: OutboxEventData[], manager?: EntityManager): Promise<OutboxEvent[]> {
    const repo = manager ? manager.getRepository(OutboxEvent) : this.outboxRepository;

    const events = eventsData.map((eventData) =>
      repo.create({
        eventType: eventData.eventType,
        subject: eventData.subject,
        payload: {
          event_id: this.generateEventId(),
          timestamp: Date.now(),
          correlation_id: eventData.correlationId,
          ...eventData.payload,
        },
        aggregateType: eventData.aggregateType,
        aggregateId: eventData.aggregateId,
        correlationId: eventData.correlationId,
        causationId: eventData.causationId,
        status: OutboxEventStatus.PENDING,
        attempts: 0,
        maxAttempts: 5,
      }),
    );

    return repo.save(events);
  }

  /**
   * Start the background processor
   * Call this in your module's onModuleInit
   */
  startProcessor(intervalMs = 1000): void {
    if (this.processingInterval) {
      return;
    }

    this.logger.log(`Starting outbox processor with ${intervalMs}ms interval`);

    this.processingInterval = setInterval(() => {
      this.processOutbox().catch((err) => {
        this.logger.error('Error processing outbox', err);
      });
    }, intervalMs);
  }

  /**
   * Stop the background processor
   */
  stopProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.logger.log('Outbox processor stopped');
    }
  }

  onModuleDestroy(): void {
    this.stopProcessor();
  }

  /**
   * Process pending outbox events
   */
  async processOutbox(batchSize = 100): Promise<number> {
    if (this.isProcessing) {
      return 0;
    }

    this.isProcessing = true;

    try {
      // Find pending events that are ready for processing
      const events = await this.outboxRepository.find({
        where: [
          { status: OutboxEventStatus.PENDING },
          {
            status: OutboxEventStatus.FAILED,
            nextRetryAt: LessThanOrEqual(new Date()),
          },
        ],
        order: { createdAt: 'ASC' },
        take: batchSize,
      });

      if (events.length === 0) {
        return 0;
      }

      let publishedCount = 0;

      for (const event of events) {
        try {
          await this.publishEvent(event);
          publishedCount++;
        } catch (error) {
          await this.handlePublishError(event, error as Error);
        }
      }

      if (publishedCount > 0) {
        this.logger.log(`Published ${publishedCount}/${events.length} outbox events`);
      }

      return publishedCount;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Publish a single event to NATS
   */
  private async publishEvent(event: OutboxEvent): Promise<void> {
    // Mark as processing
    event.status = OutboxEventStatus.PROCESSING;
    event.attempts++;
    await this.outboxRepository.save(event);

    // Publish to NATS
    await this.natsService.publish(event.subject, event.payload);

    // Mark as published
    event.status = OutboxEventStatus.PUBLISHED;
    event.publishedAt = new Date();
    await this.outboxRepository.save(event);
  }

  /**
   * Handle publish error with exponential backoff
   */
  private async handlePublishError(event: OutboxEvent, error: Error): Promise<void> {
    this.logger.warn(`Failed to publish outbox event ${event.id}: ${error.message}`);

    event.lastError = error.message;

    if (event.attempts >= event.maxAttempts) {
      // Max retries exceeded
      event.status = OutboxEventStatus.FAILED;
      this.logger.error(`Outbox event ${event.id} failed permanently after ${event.attempts} attempts`);
    } else {
      // Calculate next retry with exponential backoff
      const backoffMs = Math.min(1000 * Math.pow(2, event.attempts), 60000); // Max 1 minute
      event.status = OutboxEventStatus.FAILED;
      event.nextRetryAt = new Date(Date.now() + backoffMs);
    }

    await this.outboxRepository.save(event);
  }

  /**
   * Get outbox statistics
   */
  async getStats(): Promise<OutboxStats> {
    const [pending, processing, published, failed] = await Promise.all([
      this.outboxRepository.count({ where: { status: OutboxEventStatus.PENDING } }),
      this.outboxRepository.count({ where: { status: OutboxEventStatus.PROCESSING } }),
      this.outboxRepository.count({ where: { status: OutboxEventStatus.PUBLISHED } }),
      this.outboxRepository.count({ where: { status: OutboxEventStatus.FAILED } }),
    ]);

    return { pending, processing, published, failed };
  }

  /**
   * Clean up old published events
   */
  async cleanup(olderThanDays = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.outboxRepository.delete({
      status: OutboxEventStatus.PUBLISHED,
      publishedAt: LessThanOrEqual(cutoffDate),
    });

    const deleted = result.affected || 0;
    if (deleted > 0) {
      this.logger.log(`Cleaned up ${deleted} old outbox events`);
    }

    return deleted;
  }

  /**
   * Retry failed events manually
   */
  async retryFailed(eventId: string): Promise<void> {
    const event = await this.outboxRepository.findOneBy({ id: eventId });
    if (!event) {
      throw new Error(`Outbox event ${eventId} not found`);
    }

    if (event.status !== OutboxEventStatus.FAILED) {
      throw new Error(`Outbox event ${eventId} is not in FAILED status`);
    }

    event.status = OutboxEventStatus.PENDING;
    event.attempts = 0;
    event.nextRetryAt = undefined;
    await this.outboxRepository.save(event);
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

export interface OutboxStats {
  pending: number;
  processing: number;
  published: number;
  failed: number;
}

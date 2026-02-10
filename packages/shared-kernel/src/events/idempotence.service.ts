import { Inject, Injectable, Logger } from '@nestjs/common';

export interface IdempotenceStore {
  isEventProcessed(eventId: string): Promise<boolean>;
  markEventProcessed(eventId: string, eventType: string): Promise<void>;
}

export const IDEMPOTENCE_STORE = 'IDEMPOTENCE_STORE';

/**
 * IdempotenceService
 * Ensures NATS events are processed exactly once using eventId tracking
 */
@Injectable()
export class IdempotenceService {
  private readonly logger = new Logger(IdempotenceService.name);

  constructor(
    @Inject(IDEMPOTENCE_STORE)
    private readonly store: IdempotenceStore,
  ) {}

  async isProcessed(eventId: string | undefined): Promise<boolean> {
    if (!eventId) {
      this.logger.warn('Event received without eventId - cannot check idempotence');
      return false;
    }

    const processed = await this.store.isEventProcessed(eventId);

    if (processed) {
      this.logger.log(`Event ${eventId} already processed, skipping`);
    }

    return processed;
  }

  async markProcessed(
    eventId: string | undefined,
    eventType: string,
  ): Promise<void> {
    if (!eventId) {
      this.logger.warn(
        `Event ${eventType} processed without eventId - cannot mark as processed`,
      );
      return;
    }

    try {
      await this.store.markEventProcessed(eventId, eventType);
      this.logger.debug(`Event ${eventId} (${eventType}) marked as processed`);
    } catch (error) {
      this.logger.error(
        `Failed to mark event ${eventId} as processed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ProcessedEvent } from './processed-events.entity';

@Injectable()
export class ProcessedEventsRepository {
  constructor(
    @InjectRepository(ProcessedEvent)
    private readonly repository: Repository<ProcessedEvent>,
  ) {}

  /**
   * Check if an event has already been processed
   * @param eventId - The unique event identifier
   * @returns true if event was processed, false otherwise
   */
  async exists(eventId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { eventId },
    });
    return count > 0;
  }

  /**
   * Mark an event as processed with a TTL of 30 days
   * @param eventId - The unique event identifier
   * @param eventType - The type of event
   */
  async markProcessed(eventId: string, eventType: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.repository.upsert(
      {
        eventId,
        eventType,
        expiresAt,
      },
      {
        conflictPaths: ['eventId'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
  }

  /**
   * Clean up expired events (optional utility method)
   * @returns number of deleted records
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}

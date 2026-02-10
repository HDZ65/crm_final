import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ProcessedEvent } from './processed-events.entity.js';

@Injectable()
export class ProcessedEventsRepository {
  constructor(
    @InjectRepository(ProcessedEvent)
    private readonly repository: Repository<ProcessedEvent>,
  ) {}

  async exists(eventId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { eventId } });
    return count > 0;
  }

  async markProcessed(eventId: string, eventType: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.repository.upsert(
      { eventId, eventType, expiresAt },
      { conflictPaths: ['eventId'], skipUpdateIfNoValuesChanged: true },
    );
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }
}

import { v4 as uuid } from 'uuid';

/**
 * Base class for all Domain Events
 *
 * Domain Events represent something important that happened in the domain.
 * They are immutable facts about the past, named in past tense.
 */
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventVersion: number;

  constructor(public readonly aggregateId: string) {
    this.eventId = uuid();
    this.occurredOn = new Date();
    this.eventVersion = 1;
  }

  abstract eventName(): string;
  abstract toPrimitives(): Record<string, any>;
}

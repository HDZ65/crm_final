import { DomainEvent } from '../domain-event.base.js';

/**
 * Generic Entity Deleted Event
 */
export class EntityDeletedEvent<TEntity extends string> extends DomainEvent {
  constructor(
    public readonly entityType: TEntity,
    aggregateId: string,
    public readonly reason?: string,
  ) {
    super(aggregateId);
  }

  eventName(): string {
    return `${this.entityType}.deleted`;
  }

  toPrimitives(): Record<string, any> {
    return {
      aggregateId: this.aggregateId,
      entityType: this.entityType,
      reason: this.reason,
      eventId: this.eventId,
      occurredOn: this.occurredOn.toISOString(),
      eventVersion: this.eventVersion,
    };
  }

  static fromPrimitives<T extends string>(
    data: Record<string, any>,
  ): EntityDeletedEvent<T> {
    const event = new EntityDeletedEvent<T>(
      data.entityType,
      data.aggregateId,
      data.reason,
    );
    (event as any).eventId = data.eventId;
    (event as any).occurredOn = new Date(data.occurredOn);
    (event as any).eventVersion = data.eventVersion;
    return event;
  }
}

// CRM-specific type aliases
export type ClientDeletedEvent = EntityDeletedEvent<'client'>;
export type FactureDeletedEvent = EntityDeletedEvent<'facture'>;
export type ContratDeletedEvent = EntityDeletedEvent<'contrat'>;
export type CommercialDeletedEvent = EntityDeletedEvent<'commercial'>;

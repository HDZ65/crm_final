import { AggregateRoot as NestAggregateRoot, IEvent } from '@nestjs/cqrs';

/**
 * Base class for all Aggregate Roots
 *
 * An Aggregate Root is the entry point to an aggregate - a cluster of domain objects
 * that are treated as a single unit for data changes.
 */
export abstract class AggregateRoot<EventBase extends IEvent = IEvent> extends NestAggregateRoot<EventBase> {
  private version: number = 0;

  protected incrementVersion(): void {
    this.version++;
  }

  public getVersion(): number {
    return this.version;
  }

  public markEventsAsCommitted(): void {
    this.commit();
  }
}

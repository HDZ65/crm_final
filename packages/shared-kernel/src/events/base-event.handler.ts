/**
 * Base Event Handler
 *
 * Generic base class for publishing domain events to NATS.
 *
 * @module @crm/shared-kernel/events
 */

import { Logger } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { DomainEvent } from '../domain/domain-event.base.js';

/**
 * Minimal interface for event emitter (compatible with ClientProxy)
 */
export interface IEventEmitter {
  emit<TResult = unknown, TInput = unknown>(
    pattern: string,
    data: TInput,
  ): unknown;
}

/**
 * Configuration for event handler
 */
export interface EventHandlerConfig {
  eventName: string;
  logging?: boolean;
}

export type WithEventId<T> = T & { eventId: string };
export type WithoutEventId<T> = Omit<T, 'eventId'>;

/**
 * Base event handler for publishing domain events to NATS
 */
export abstract class BaseEventHandler<E extends DomainEvent, P = Record<string, unknown>>
  implements IEventHandler<E>
{
  protected readonly logger: Logger;
  protected abstract readonly config: EventHandlerConfig;

  constructor(protected readonly natsClient: IEventEmitter) {
    this.logger = new Logger(this.constructor.name);
  }

  async handle(event: E): Promise<void> {
    const { eventName, logging = true } = this.config;

    try {
      const payload: WithEventId<WithoutEventId<P>> = {
        ...(this.mapEventToPayload(event) as WithoutEventId<P>),
        eventId: event.eventId,
      };

      if (logging) {
        this.logger.debug(
          `Publishing ${eventName}: aggregateId=${event.aggregateId}`,
        );
      }

      this.natsClient.emit(eventName, payload);

      if (logging) {
        this.logger.log(
          `Event ${eventName} published for ${event.aggregateId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to publish ${eventName}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  protected mapEventToPayload(event: E): WithoutEventId<P> {
    return event.toPrimitives() as unknown as WithoutEventId<P>;
  }
}

/**
 * Simple event handler class for events that use default payload mapping
 */
export class SimpleEventHandler<E extends DomainEvent, P = Record<string, unknown>> extends BaseEventHandler<E, P> {
  protected readonly config: EventHandlerConfig;

  constructor(natsClient: IEventEmitter, eventName: string) {
    super(natsClient);
    this.config = { eventName };
  }
}

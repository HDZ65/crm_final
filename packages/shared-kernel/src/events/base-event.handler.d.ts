import { Logger } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { DomainEvent } from '../domain/domain-event.base.js';
export interface IEventEmitter {
    emit<TResult = unknown, TInput = unknown>(pattern: string, data: TInput): unknown;
}
export interface EventHandlerConfig {
    eventName: string;
    logging?: boolean;
}
export type WithEventId<T> = T & {
    eventId: string;
};
export type WithoutEventId<T> = Omit<T, 'eventId'>;
export declare abstract class BaseEventHandler<E extends DomainEvent, P = Record<string, unknown>> implements IEventHandler<E> {
    protected readonly natsClient: IEventEmitter;
    protected readonly logger: Logger;
    protected abstract readonly config: EventHandlerConfig;
    constructor(natsClient: IEventEmitter);
    handle(event: E): Promise<void>;
    protected mapEventToPayload(event: E): WithoutEventId<P>;
}
export declare class SimpleEventHandler<E extends DomainEvent, P = Record<string, unknown>> extends BaseEventHandler<E, P> {
    protected readonly config: EventHandlerConfig;
    constructor(natsClient: IEventEmitter, eventName: string);
}
//# sourceMappingURL=base-event.handler.d.ts.map
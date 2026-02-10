import { AggregateRoot as NestAggregateRoot, IEvent } from '@nestjs/cqrs';
export declare abstract class AggregateRoot<EventBase extends IEvent = IEvent> extends NestAggregateRoot<EventBase> {
    private version;
    protected incrementVersion(): void;
    getVersion(): number;
    markEventsAsCommitted(): void;
}
//# sourceMappingURL=aggregate-root.base.d.ts.map
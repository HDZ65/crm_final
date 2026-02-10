export declare abstract class DomainEvent {
    readonly aggregateId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventVersion: number;
    constructor(aggregateId: string);
    abstract eventName(): string;
    abstract toPrimitives(): Record<string, any>;
}
//# sourceMappingURL=domain-event.base.d.ts.map
import { DomainEvent } from '../domain-event.base.js';
export declare class EntityDeletedEvent<TEntity extends string> extends DomainEvent {
    readonly entityType: TEntity;
    readonly reason?: string | undefined;
    constructor(entityType: TEntity, aggregateId: string, reason?: string | undefined);
    eventName(): string;
    toPrimitives(): Record<string, any>;
    static fromPrimitives<T extends string>(data: Record<string, any>): EntityDeletedEvent<T>;
}
export type ClientDeletedEvent = EntityDeletedEvent<'client'>;
export type FactureDeletedEvent = EntityDeletedEvent<'facture'>;
export type ContratDeletedEvent = EntityDeletedEvent<'contrat'>;
export type CommercialDeletedEvent = EntityDeletedEvent<'commercial'>;
//# sourceMappingURL=entity-deleted.event.d.ts.map
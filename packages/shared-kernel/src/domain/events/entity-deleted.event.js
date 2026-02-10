"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityDeletedEvent = void 0;
const domain_event_base_js_1 = require("../domain-event.base.js");
class EntityDeletedEvent extends domain_event_base_js_1.DomainEvent {
    entityType;
    reason;
    constructor(entityType, aggregateId, reason) {
        super(aggregateId);
        this.entityType = entityType;
        this.reason = reason;
    }
    eventName() {
        return `${this.entityType}.deleted`;
    }
    toPrimitives() {
        return {
            aggregateId: this.aggregateId,
            entityType: this.entityType,
            reason: this.reason,
            eventId: this.eventId,
            occurredOn: this.occurredOn.toISOString(),
            eventVersion: this.eventVersion,
        };
    }
    static fromPrimitives(data) {
        const event = new EntityDeletedEvent(data.entityType, data.aggregateId, data.reason);
        event.eventId = data.eventId;
        event.occurredOn = new Date(data.occurredOn);
        event.eventVersion = data.eventVersion;
        return event;
    }
}
exports.EntityDeletedEvent = EntityDeletedEvent;
//# sourceMappingURL=entity-deleted.event.js.map
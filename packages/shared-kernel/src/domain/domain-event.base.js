"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvent = void 0;
const uuid_1 = require("uuid");
class DomainEvent {
    aggregateId;
    eventId;
    occurredOn;
    eventVersion;
    constructor(aggregateId) {
        this.aggregateId = aggregateId;
        this.eventId = (0, uuid_1.v4)();
        this.occurredOn = new Date();
        this.eventVersion = 1;
    }
}
exports.DomainEvent = DomainEvent;
//# sourceMappingURL=domain-event.base.js.map
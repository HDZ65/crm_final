"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleEventHandler = exports.BaseEventHandler = void 0;
const common_1 = require("@nestjs/common");
class BaseEventHandler {
    natsClient;
    logger;
    constructor(natsClient) {
        this.natsClient = natsClient;
        this.logger = new common_1.Logger(this.constructor.name);
    }
    async handle(event) {
        const { eventName, logging = true } = this.config;
        try {
            const payload = {
                ...this.mapEventToPayload(event),
                eventId: event.eventId,
            };
            if (logging) {
                this.logger.debug(`Publishing ${eventName}: aggregateId=${event.aggregateId}`);
            }
            this.natsClient.emit(eventName, payload);
            if (logging) {
                this.logger.log(`Event ${eventName} published for ${event.aggregateId}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to publish ${eventName}: ${error.message}`, error.stack);
        }
    }
    mapEventToPayload(event) {
        return event.toPrimitives();
    }
}
exports.BaseEventHandler = BaseEventHandler;
class SimpleEventHandler extends BaseEventHandler {
    config;
    constructor(natsClient, eventName) {
        super(natsClient);
        this.config = { eventName };
    }
}
exports.SimpleEventHandler = SimpleEventHandler;
//# sourceMappingURL=base-event.handler.js.map
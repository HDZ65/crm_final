"use strict";
var IdempotenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotenceService = exports.IDEMPOTENCE_STORE = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
exports.IDEMPOTENCE_STORE = 'IDEMPOTENCE_STORE';
let IdempotenceService = IdempotenceService_1 = class IdempotenceService {
    store;
    logger = new common_1.Logger(IdempotenceService_1.name);
    constructor(store) {
        this.store = store;
    }
    async isProcessed(eventId) {
        if (!eventId) {
            this.logger.warn('Event received without eventId - cannot check idempotence');
            return false;
        }
        const processed = await this.store.isEventProcessed(eventId);
        if (processed) {
            this.logger.log(`Event ${eventId} already processed, skipping`);
        }
        return processed;
    }
    async markProcessed(eventId, eventType) {
        if (!eventId) {
            this.logger.warn(`Event ${eventType} processed without eventId - cannot mark as processed`);
            return;
        }
        try {
            await this.store.markEventProcessed(eventId, eventType);
            this.logger.debug(`Event ${eventId} (${eventType}) marked as processed`);
        }
        catch (error) {
            this.logger.error(`Failed to mark event ${eventId} as processed: ${error instanceof Error ? error.message : error}`);
        }
    }
};
exports.IdempotenceService = IdempotenceService;
exports.IdempotenceService = IdempotenceService = IdempotenceService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, common_1.Inject)(exports.IDEMPOTENCE_STORE)),
    tslib_1.__metadata("design:paramtypes", [Object])
], IdempotenceService);
//# sourceMappingURL=idempotence.service.js.map
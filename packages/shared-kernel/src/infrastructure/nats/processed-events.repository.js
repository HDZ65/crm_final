"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessedEventsRepository = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const processed_events_entity_js_1 = require("./processed-events.entity.js");
let ProcessedEventsRepository = class ProcessedEventsRepository {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async exists(eventId) {
        const count = await this.repository.count({ where: { eventId } });
        return count > 0;
    }
    async markProcessed(eventId, eventType) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await this.repository.upsert({ eventId, eventType, expiresAt }, { conflictPaths: ['eventId'], skipUpdateIfNoValuesChanged: true });
    }
    async cleanupExpired() {
        const result = await this.repository.delete({
            expiresAt: (0, typeorm_2.LessThan)(new Date()),
        });
        return result.affected || 0;
    }
};
exports.ProcessedEventsRepository = ProcessedEventsRepository;
exports.ProcessedEventsRepository = ProcessedEventsRepository = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__param(0, (0, typeorm_1.InjectRepository)(processed_events_entity_js_1.ProcessedEvent)),
    tslib_1.__metadata("design:paramtypes", [typeorm_2.Repository])
], ProcessedEventsRepository);
//# sourceMappingURL=processed-events.repository.js.map
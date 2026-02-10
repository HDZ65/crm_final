"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessedEvent = void 0;
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
let ProcessedEvent = class ProcessedEvent {
    eventId;
    eventType;
    processedAt;
    expiresAt;
};
exports.ProcessedEvent = ProcessedEvent;
tslib_1.__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 255 }),
    tslib_1.__metadata("design:type", String)
], ProcessedEvent.prototype, "eventId", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    tslib_1.__metadata("design:type", String)
], ProcessedEvent.prototype, "eventType", void 0);
tslib_1.__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'processed_at', type: 'timestamptz' }),
    tslib_1.__metadata("design:type", Date)
], ProcessedEvent.prototype, "processedAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({
        name: 'expires_at',
        type: 'timestamptz',
        nullable: true,
    }),
    tslib_1.__metadata("design:type", Object)
], ProcessedEvent.prototype, "expiresAt", void 0);
exports.ProcessedEvent = ProcessedEvent = tslib_1.__decorate([
    (0, typeorm_1.Entity)('processed_events'),
    (0, typeorm_1.Index)(['eventId']),
    (0, typeorm_1.Index)(['expiresAt'])
], ProcessedEvent);
//# sourceMappingURL=processed-events.entity.js.map
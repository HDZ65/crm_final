var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, } from 'typeorm';
export var AuditSource;
(function (AuditSource) {
    AuditSource["UI"] = "UI";
    AuditSource["CSV_IMPORT"] = "CSV_IMPORT";
    AuditSource["API"] = "API";
    AuditSource["SYSTEM"] = "SYSTEM";
})(AuditSource || (AuditSource = {}));
let CalendarAuditLogEntity = class CalendarAuditLogEntity {
    id;
    organisationId;
    entityType;
    entityId;
    action;
    actorUserId;
    source;
    beforeState;
    afterState;
    changeSummary;
    ipAddress;
    userAgent;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], CalendarAuditLogEntity.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], CalendarAuditLogEntity.prototype, "organisationId", void 0);
__decorate([
    Column({ length: 50 }),
    __metadata("design:type", String)
], CalendarAuditLogEntity.prototype, "entityType", void 0);
__decorate([
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], CalendarAuditLogEntity.prototype, "entityId", void 0);
__decorate([
    Column({ length: 20 }),
    __metadata("design:type", String)
], CalendarAuditLogEntity.prototype, "action", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    Index(),
    __metadata("design:type", String)
], CalendarAuditLogEntity.prototype, "actorUserId", void 0);
__decorate([
    Column({ type: 'enum', enum: AuditSource }),
    __metadata("design:type", String)
], CalendarAuditLogEntity.prototype, "source", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CalendarAuditLogEntity.prototype, "beforeState", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CalendarAuditLogEntity.prototype, "afterState", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CalendarAuditLogEntity.prototype, "changeSummary", void 0);
__decorate([
    Column({ type: 'inet', nullable: true }),
    __metadata("design:type", String)
], CalendarAuditLogEntity.prototype, "ipAddress", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CalendarAuditLogEntity.prototype, "userAgent", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], CalendarAuditLogEntity.prototype, "createdAt", void 0);
CalendarAuditLogEntity = __decorate([
    Entity('calendar_audit_log'),
    Index(['organisationId', 'entityType', 'entityId']),
    Index(['organisationId', 'createdAt'])
], CalendarAuditLogEntity);
export { CalendarAuditLogEntity };
//# sourceMappingURL=calendar-audit-log.entity.js.map
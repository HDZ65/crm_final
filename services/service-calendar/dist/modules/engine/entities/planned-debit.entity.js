var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, } from 'typeorm';
import { DebitBatch } from '../../configuration/entities/system-debit-configuration.entity.js';
export var PlannedDateStatus;
(function (PlannedDateStatus) {
    PlannedDateStatus["PLANNED"] = "PLANNED";
    PlannedDateStatus["CONFIRMED"] = "CONFIRMED";
    PlannedDateStatus["PROCESSING"] = "PROCESSING";
    PlannedDateStatus["EXECUTED"] = "EXECUTED";
    PlannedDateStatus["FAILED"] = "FAILED";
    PlannedDateStatus["CANCELLED"] = "CANCELLED";
})(PlannedDateStatus || (PlannedDateStatus = {}));
let PlannedDebitEntity = class PlannedDebitEntity {
    id;
    organisationId;
    societeId;
    clientId;
    contratId;
    scheduleId;
    factureId;
    plannedDebitDate;
    originalTargetDate;
    status;
    batch;
    amountCents;
    currency;
    resolvedConfig;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], PlannedDebitEntity.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], PlannedDebitEntity.prototype, "organisationId", void 0);
__decorate([
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], PlannedDebitEntity.prototype, "societeId", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], PlannedDebitEntity.prototype, "clientId", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], PlannedDebitEntity.prototype, "contratId", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PlannedDebitEntity.prototype, "scheduleId", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PlannedDebitEntity.prototype, "factureId", void 0);
__decorate([
    Column({ type: 'date' }),
    __metadata("design:type", Date)
], PlannedDebitEntity.prototype, "plannedDebitDate", void 0);
__decorate([
    Column({ type: 'date' }),
    __metadata("design:type", Date)
], PlannedDebitEntity.prototype, "originalTargetDate", void 0);
__decorate([
    Column({ type: 'enum', enum: PlannedDateStatus, default: PlannedDateStatus.PLANNED }),
    __metadata("design:type", String)
], PlannedDebitEntity.prototype, "status", void 0);
__decorate([
    Column({ type: 'enum', enum: DebitBatch, nullable: true }),
    __metadata("design:type", String)
], PlannedDebitEntity.prototype, "batch", void 0);
__decorate([
    Column({ type: 'bigint' }),
    __metadata("design:type", Number)
], PlannedDebitEntity.prototype, "amountCents", void 0);
__decorate([
    Column({ length: 3, default: 'EUR' }),
    __metadata("design:type", String)
], PlannedDebitEntity.prototype, "currency", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Object)
], PlannedDebitEntity.prototype, "resolvedConfig", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], PlannedDebitEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], PlannedDebitEntity.prototype, "updatedAt", void 0);
PlannedDebitEntity = __decorate([
    Entity('planned_debit'),
    Index(['organisationId', 'plannedDebitDate']),
    Index(['organisationId', 'status']),
    Index(['organisationId', 'plannedDebitDate', 'batch'])
], PlannedDebitEntity);
export { PlannedDebitEntity };
//# sourceMappingURL=planned-debit.entity.js.map
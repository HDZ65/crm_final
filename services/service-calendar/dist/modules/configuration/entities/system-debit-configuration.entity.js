var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
export var DebitDateMode;
(function (DebitDateMode) {
    DebitDateMode["BATCH"] = "BATCH";
    DebitDateMode["FIXED_DAY"] = "FIXED_DAY";
})(DebitDateMode || (DebitDateMode = {}));
export var DebitBatch;
(function (DebitBatch) {
    DebitBatch["L1"] = "L1";
    DebitBatch["L2"] = "L2";
    DebitBatch["L3"] = "L3";
    DebitBatch["L4"] = "L4";
})(DebitBatch || (DebitBatch = {}));
export var DateShiftStrategy;
(function (DateShiftStrategy) {
    DateShiftStrategy["NEXT_BUSINESS_DAY"] = "NEXT_BUSINESS_DAY";
    DateShiftStrategy["PREVIOUS_BUSINESS_DAY"] = "PREVIOUS_BUSINESS_DAY";
    DateShiftStrategy["NEXT_WEEK_SAME_DAY"] = "NEXT_WEEK_SAME_DAY";
})(DateShiftStrategy || (DateShiftStrategy = {}));
let SystemDebitConfigurationEntity = class SystemDebitConfigurationEntity {
    id;
    organisationId;
    defaultMode;
    defaultBatch;
    defaultFixedDay;
    shiftStrategy;
    holidayZoneId;
    cutoffConfigId;
    isActive;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], SystemDebitConfigurationEntity.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid', unique: true }),
    __metadata("design:type", String)
], SystemDebitConfigurationEntity.prototype, "organisationId", void 0);
__decorate([
    Column({ type: 'enum', enum: DebitDateMode }),
    __metadata("design:type", String)
], SystemDebitConfigurationEntity.prototype, "defaultMode", void 0);
__decorate([
    Column({ type: 'enum', enum: DebitBatch, nullable: true }),
    __metadata("design:type", String)
], SystemDebitConfigurationEntity.prototype, "defaultBatch", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SystemDebitConfigurationEntity.prototype, "defaultFixedDay", void 0);
__decorate([
    Column({ type: 'enum', enum: DateShiftStrategy, default: DateShiftStrategy.NEXT_BUSINESS_DAY }),
    __metadata("design:type", String)
], SystemDebitConfigurationEntity.prototype, "shiftStrategy", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SystemDebitConfigurationEntity.prototype, "holidayZoneId", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SystemDebitConfigurationEntity.prototype, "cutoffConfigId", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], SystemDebitConfigurationEntity.prototype, "isActive", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], SystemDebitConfigurationEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], SystemDebitConfigurationEntity.prototype, "updatedAt", void 0);
SystemDebitConfigurationEntity = __decorate([
    Entity('system_debit_configuration')
], SystemDebitConfigurationEntity);
export { SystemDebitConfigurationEntity };
//# sourceMappingURL=system-debit-configuration.entity.js.map
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
import { DebitDateMode, DebitBatch, DateShiftStrategy } from './system-debit-configuration.entity.js';
let CompanyDebitConfigurationEntity = class CompanyDebitConfigurationEntity {
    id;
    organisationId;
    societeId;
    mode;
    batch;
    fixedDay;
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
], CompanyDebitConfigurationEntity.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], CompanyDebitConfigurationEntity.prototype, "organisationId", void 0);
__decorate([
    Column({ type: 'uuid', unique: true }),
    __metadata("design:type", String)
], CompanyDebitConfigurationEntity.prototype, "societeId", void 0);
__decorate([
    Column({ type: 'enum', enum: DebitDateMode }),
    __metadata("design:type", String)
], CompanyDebitConfigurationEntity.prototype, "mode", void 0);
__decorate([
    Column({ type: 'enum', enum: DebitBatch, nullable: true }),
    __metadata("design:type", String)
], CompanyDebitConfigurationEntity.prototype, "batch", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], CompanyDebitConfigurationEntity.prototype, "fixedDay", void 0);
__decorate([
    Column({ type: 'enum', enum: DateShiftStrategy, default: DateShiftStrategy.NEXT_BUSINESS_DAY }),
    __metadata("design:type", String)
], CompanyDebitConfigurationEntity.prototype, "shiftStrategy", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanyDebitConfigurationEntity.prototype, "holidayZoneId", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], CompanyDebitConfigurationEntity.prototype, "cutoffConfigId", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], CompanyDebitConfigurationEntity.prototype, "isActive", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], CompanyDebitConfigurationEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], CompanyDebitConfigurationEntity.prototype, "updatedAt", void 0);
CompanyDebitConfigurationEntity = __decorate([
    Entity('company_debit_configuration')
], CompanyDebitConfigurationEntity);
export { CompanyDebitConfigurationEntity };
//# sourceMappingURL=company-debit-configuration.entity.js.map
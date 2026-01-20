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
let ClientDebitConfigurationEntity = class ClientDebitConfigurationEntity {
    id;
    organisationId;
    clientId;
    mode;
    batch;
    fixedDay;
    shiftStrategy;
    holidayZoneId;
    isActive;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], ClientDebitConfigurationEntity.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], ClientDebitConfigurationEntity.prototype, "organisationId", void 0);
__decorate([
    Column({ type: 'uuid', unique: true }),
    __metadata("design:type", String)
], ClientDebitConfigurationEntity.prototype, "clientId", void 0);
__decorate([
    Column({ type: 'enum', enum: DebitDateMode }),
    __metadata("design:type", String)
], ClientDebitConfigurationEntity.prototype, "mode", void 0);
__decorate([
    Column({ type: 'enum', enum: DebitBatch, nullable: true }),
    __metadata("design:type", String)
], ClientDebitConfigurationEntity.prototype, "batch", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], ClientDebitConfigurationEntity.prototype, "fixedDay", void 0);
__decorate([
    Column({ type: 'enum', enum: DateShiftStrategy, default: DateShiftStrategy.NEXT_BUSINESS_DAY }),
    __metadata("design:type", String)
], ClientDebitConfigurationEntity.prototype, "shiftStrategy", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ClientDebitConfigurationEntity.prototype, "holidayZoneId", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], ClientDebitConfigurationEntity.prototype, "isActive", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], ClientDebitConfigurationEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], ClientDebitConfigurationEntity.prototype, "updatedAt", void 0);
ClientDebitConfigurationEntity = __decorate([
    Entity('client_debit_configuration')
], ClientDebitConfigurationEntity);
export { ClientDebitConfigurationEntity };
//# sourceMappingURL=client-debit-configuration.entity.js.map
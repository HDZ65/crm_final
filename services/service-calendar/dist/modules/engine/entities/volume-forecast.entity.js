var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique, } from 'typeorm';
import { DebitBatch } from '../../configuration/entities/system-debit-configuration.entity.js';
let VolumeForecastEntity = class VolumeForecastEntity {
    id;
    organisationId;
    societeId;
    year;
    month;
    day;
    batch;
    expectedTransactionCount;
    expectedAmountCents;
    currency;
    actualTransactionCount;
    actualAmountCents;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], VolumeForecastEntity.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid' }),
    __metadata("design:type", String)
], VolumeForecastEntity.prototype, "organisationId", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], VolumeForecastEntity.prototype, "societeId", void 0);
__decorate([
    Column({ type: 'int' }),
    __metadata("design:type", Number)
], VolumeForecastEntity.prototype, "year", void 0);
__decorate([
    Column({ type: 'int' }),
    __metadata("design:type", Number)
], VolumeForecastEntity.prototype, "month", void 0);
__decorate([
    Column({ type: 'int' }),
    __metadata("design:type", Number)
], VolumeForecastEntity.prototype, "day", void 0);
__decorate([
    Column({ type: 'enum', enum: DebitBatch, nullable: true }),
    __metadata("design:type", String)
], VolumeForecastEntity.prototype, "batch", void 0);
__decorate([
    Column({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], VolumeForecastEntity.prototype, "expectedTransactionCount", void 0);
__decorate([
    Column({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], VolumeForecastEntity.prototype, "expectedAmountCents", void 0);
__decorate([
    Column({ length: 3, default: 'EUR' }),
    __metadata("design:type", String)
], VolumeForecastEntity.prototype, "currency", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], VolumeForecastEntity.prototype, "actualTransactionCount", void 0);
__decorate([
    Column({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], VolumeForecastEntity.prototype, "actualAmountCents", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], VolumeForecastEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], VolumeForecastEntity.prototype, "updatedAt", void 0);
VolumeForecastEntity = __decorate([
    Entity('volume_forecast'),
    Unique(['organisationId', 'societeId', 'year', 'month', 'day', 'batch']),
    Index(['organisationId', 'year', 'month'])
], VolumeForecastEntity);
export { VolumeForecastEntity };
//# sourceMappingURL=volume-forecast.entity.js.map
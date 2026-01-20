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
let VolumeThresholdEntity = class VolumeThresholdEntity {
    id;
    organisationId;
    societeId;
    maxTransactionCount;
    maxAmountCents;
    currency;
    alertOnExceed;
    alertEmail;
    isActive;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], VolumeThresholdEntity.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], VolumeThresholdEntity.prototype, "organisationId", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], VolumeThresholdEntity.prototype, "societeId", void 0);
__decorate([
    Column({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], VolumeThresholdEntity.prototype, "maxTransactionCount", void 0);
__decorate([
    Column({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], VolumeThresholdEntity.prototype, "maxAmountCents", void 0);
__decorate([
    Column({ length: 3, default: 'EUR' }),
    __metadata("design:type", String)
], VolumeThresholdEntity.prototype, "currency", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], VolumeThresholdEntity.prototype, "alertOnExceed", void 0);
__decorate([
    Column({ length: 255, nullable: true }),
    __metadata("design:type", String)
], VolumeThresholdEntity.prototype, "alertEmail", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], VolumeThresholdEntity.prototype, "isActive", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], VolumeThresholdEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], VolumeThresholdEntity.prototype, "updatedAt", void 0);
VolumeThresholdEntity = __decorate([
    Entity('volume_threshold')
], VolumeThresholdEntity);
export { VolumeThresholdEntity };
//# sourceMappingURL=volume-threshold.entity.js.map
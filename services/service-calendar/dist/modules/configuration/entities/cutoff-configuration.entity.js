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
let CutoffConfigurationEntity = class CutoffConfigurationEntity {
    id;
    organisationId;
    name;
    cutoffTime;
    timezone;
    daysBeforeValueDate;
    isActive;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], CutoffConfigurationEntity.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], CutoffConfigurationEntity.prototype, "organisationId", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], CutoffConfigurationEntity.prototype, "name", void 0);
__decorate([
    Column({ type: 'time' }),
    __metadata("design:type", String)
], CutoffConfigurationEntity.prototype, "cutoffTime", void 0);
__decorate([
    Column({ length: 50, default: 'Europe/Paris' }),
    __metadata("design:type", String)
], CutoffConfigurationEntity.prototype, "timezone", void 0);
__decorate([
    Column({ type: 'int', default: 2 }),
    __metadata("design:type", Number)
], CutoffConfigurationEntity.prototype, "daysBeforeValueDate", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], CutoffConfigurationEntity.prototype, "isActive", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], CutoffConfigurationEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], CutoffConfigurationEntity.prototype, "updatedAt", void 0);
CutoffConfigurationEntity = __decorate([
    Entity('cutoff_configuration')
], CutoffConfigurationEntity);
export { CutoffConfigurationEntity };
//# sourceMappingURL=cutoff-configuration.entity.js.map
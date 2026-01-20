var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany, } from 'typeorm';
import { HolidayEntity } from './holiday.entity.js';
let HolidayZoneEntity = class HolidayZoneEntity {
    id;
    organisationId;
    code;
    name;
    countryCode;
    regionCode;
    isActive;
    createdAt;
    updatedAt;
    holidays;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], HolidayZoneEntity.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], HolidayZoneEntity.prototype, "organisationId", void 0);
__decorate([
    Column({ length: 20 }),
    __metadata("design:type", String)
], HolidayZoneEntity.prototype, "code", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], HolidayZoneEntity.prototype, "name", void 0);
__decorate([
    Column({ length: 2 }),
    __metadata("design:type", String)
], HolidayZoneEntity.prototype, "countryCode", void 0);
__decorate([
    Column({ length: 10, nullable: true }),
    __metadata("design:type", String)
], HolidayZoneEntity.prototype, "regionCode", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], HolidayZoneEntity.prototype, "isActive", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], HolidayZoneEntity.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], HolidayZoneEntity.prototype, "updatedAt", void 0);
__decorate([
    OneToMany(() => HolidayEntity, (holiday) => holiday.holidayZone),
    __metadata("design:type", Array)
], HolidayZoneEntity.prototype, "holidays", void 0);
HolidayZoneEntity = __decorate([
    Entity('holiday_zone')
], HolidayZoneEntity);
export { HolidayZoneEntity };
//# sourceMappingURL=holiday-zone.entity.js.map
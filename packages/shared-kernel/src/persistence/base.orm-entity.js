"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionedOrmEntity = exports.BaseOrmEntity = void 0;
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
class BaseOrmEntity {
    id;
    createdAt;
    updatedAt;
    deletedAt;
}
exports.BaseOrmEntity = BaseOrmEntity;
tslib_1.__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    tslib_1.__metadata("design:type", String)
], BaseOrmEntity.prototype, "id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    tslib_1.__metadata("design:type", Date)
], BaseOrmEntity.prototype, "createdAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    tslib_1.__metadata("design:type", Date)
], BaseOrmEntity.prototype, "updatedAt", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_at', type: 'timestamptz', nullable: true }),
    tslib_1.__metadata("design:type", Object)
], BaseOrmEntity.prototype, "deletedAt", void 0);
class VersionedOrmEntity extends BaseOrmEntity {
    version;
}
exports.VersionedOrmEntity = VersionedOrmEntity;
tslib_1.__decorate([
    (0, typeorm_1.VersionColumn)({ default: 1 }),
    tslib_1.__metadata("design:type", Number)
], VersionedOrmEntity.prototype, "version", void 0);
//# sourceMappingURL=base.orm-entity.js.map
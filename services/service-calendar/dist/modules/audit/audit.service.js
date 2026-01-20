var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuditService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CalendarAuditLogEntity, AuditSource } from './entities/calendar-audit-log.entity.js';
let AuditService = AuditService_1 = class AuditService {
    auditLogRepo;
    logger = new Logger(AuditService_1.name);
    constructor(auditLogRepo) {
        this.auditLogRepo = auditLogRepo;
    }
    async log(input) {
        const auditLog = this.auditLogRepo.create({
            organisationId: input.organisationId,
            entityType: input.entityType,
            entityId: input.entityId,
            action: input.action,
            actorUserId: input.actorUserId,
            source: input.source,
            beforeState: input.beforeState,
            afterState: input.afterState,
            changeSummary: input.changeSummary ?? this.generateChangeSummary(input),
            ipAddress: input.ipAddress,
            userAgent: input.userAgent,
        });
        const saved = await this.auditLogRepo.save(auditLog);
        this.logger.debug(`Audit log created: ${input.action} on ${input.entityType}/${input.entityId}`);
        return saved;
    }
    async logConfigurationChange(organisationId, configType, configId, action, actorUserId, source, beforeState, afterState, metadata) {
        return this.log({
            organisationId,
            entityType: `debit_configuration_${configType}`,
            entityId: configId,
            action,
            actorUserId,
            source,
            beforeState,
            afterState,
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
        });
    }
    async logHolidayChange(organisationId, holidayId, action, actorUserId, source, beforeState, afterState) {
        return this.log({
            organisationId,
            entityType: 'holiday',
            entityId: holidayId,
            action,
            actorUserId,
            source,
            beforeState,
            afterState,
        });
    }
    async logBulkImport(organisationId, importType, importId, actorUserId, summary, details) {
        return this.log({
            organisationId,
            entityType: `import_${importType}`,
            entityId: importId,
            action: 'IMPORT',
            actorUserId,
            source: AuditSource.CSV_IMPORT,
            afterState: details,
            changeSummary: summary,
        });
    }
    async getAuditLogs(filter) {
        const where = {
            organisationId: filter.organisationId,
        };
        if (filter.entityType)
            where.entityType = filter.entityType;
        if (filter.entityId)
            where.entityId = filter.entityId;
        if (filter.actorUserId)
            where.actorUserId = filter.actorUserId;
        if (filter.source)
            where.source = filter.source;
        if (filter.fromDate && filter.toDate) {
            where.createdAt = Between(filter.fromDate, filter.toDate);
        }
        const [logs, total] = await this.auditLogRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            take: filter.limit ?? 50,
            skip: filter.offset ?? 0,
        });
        return { logs, total };
    }
    async getEntityHistory(organisationId, entityType, entityId) {
        return this.auditLogRepo.find({
            where: { organisationId, entityType, entityId },
            order: { createdAt: 'DESC' },
        });
    }
    generateChangeSummary(input) {
        if (input.action === 'CREATE') {
            return `Created ${input.entityType}`;
        }
        if (input.action === 'DELETE') {
            return `Deleted ${input.entityType}`;
        }
        if (input.action === 'UPDATE' && input.beforeState && input.afterState) {
            const changedFields = [];
            for (const key of Object.keys(input.afterState)) {
                if (JSON.stringify(input.beforeState[key]) !== JSON.stringify(input.afterState[key])) {
                    changedFields.push(key);
                }
            }
            return changedFields.length > 0
                ? `Updated ${changedFields.join(', ')}`
                : 'No changes detected';
        }
        return `${input.action} on ${input.entityType}`;
    }
};
AuditService = AuditService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(CalendarAuditLogEntity)),
    __metadata("design:paramtypes", [Repository])
], AuditService);
export { AuditService };
//# sourceMappingURL=audit.service.js.map
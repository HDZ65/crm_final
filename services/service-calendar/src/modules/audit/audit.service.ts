import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';

import { CalendarAuditLogEntity, AuditSource } from './entities/calendar-audit-log.entity';
import type { GetAuditLogsRequest } from '@crm/proto/calendar';

export interface CreateAuditLogInput {
  organisationId: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT';
  actorUserId?: string;
  source: AuditSource;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  changeSummary?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  organisationId: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  source?: AuditSource;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(CalendarAuditLogEntity)
    private readonly auditLogRepo: Repository<CalendarAuditLogEntity>,
  ) {}

  async log(input: CreateAuditLogInput): Promise<CalendarAuditLogEntity> {
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

  async logConfigurationChange(
    organisationId: string,
    configType: 'system' | 'company' | 'client' | 'contract',
    configId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    actorUserId: string,
    source: AuditSource,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<CalendarAuditLogEntity> {
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

  async logHolidayChange(
    organisationId: string,
    holidayId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    actorUserId: string,
    source: AuditSource,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>,
  ): Promise<CalendarAuditLogEntity> {
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

  async logBulkImport(
    organisationId: string,
    importType: string,
    importId: string,
    actorUserId: string,
    summary: string,
    details: Record<string, unknown>,
  ): Promise<CalendarAuditLogEntity> {
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

  async getAuditLogs(filter: AuditLogFilter): Promise<{
    logs: CalendarAuditLogEntity[];
    total: number;
  }> {
    const where: FindOptionsWhere<CalendarAuditLogEntity> = {
      organisationId: filter.organisationId,
    };

    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.actorUserId) where.actorUserId = filter.actorUserId;
    if (filter.source) where.source = filter.source;

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

  async getEntityHistory(
    organisationId: string,
    entityType: string,
    entityId: string,
  ): Promise<CalendarAuditLogEntity[]> {
    return this.auditLogRepo.find({
      where: { organisationId, entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  private generateChangeSummary(input: CreateAuditLogInput): string {
    if (input.action === 'CREATE') {
      return `Created ${input.entityType}`;
    }

    if (input.action === 'DELETE') {
      return `Deleted ${input.entityType}`;
    }

    if (input.action === 'UPDATE' && input.beforeState && input.afterState) {
      const changedFields: string[] = [];
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
}

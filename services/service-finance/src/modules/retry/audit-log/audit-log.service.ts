import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetryAuditLogEntity, AuditActorType } from './entities/retry-audit-log.entity';
import type { PaginationRequest } from '@crm/proto/retry';

export interface CreateAuditLogInput {
  organisationId: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue?: Record<string, unknown>;
  newValue: Record<string, unknown>;
  changedFields?: string;
  retryScheduleId?: string;
  retryAttemptId?: string;
  reminderId?: string;
  paymentId?: string;
  actorType: AuditActorType;
  actorId?: string;
  actorIp?: string;
  metadata?: Record<string, unknown>;
}

export interface ListAuditLogsInput {
  organisationId: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
  pagination?: Partial<PaginationRequest>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(RetryAuditLogEntity)
    private readonly auditLogRepository: Repository<RetryAuditLogEntity>,
  ) {}

  async log(input: CreateAuditLogInput): Promise<RetryAuditLogEntity> {
    const auditLog = this.auditLogRepository.create({
      organisationId: input.organisationId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      oldValue: input.oldValue || null,
      newValue: input.newValue,
      changedFields: input.changedFields || null,
      retryScheduleId: input.retryScheduleId || null,
      retryAttemptId: input.retryAttemptId || null,
      reminderId: input.reminderId || null,
      paymentId: input.paymentId || null,
      actorType: input.actorType,
      actorId: input.actorId || null,
      actorIp: input.actorIp || null,
      metadata: input.metadata || {},
      timestamp: new Date(),
    });

    return this.auditLogRepository.save(auditLog);
  }

  async findAll(input: ListAuditLogsInput): Promise<{
    logs: RetryAuditLogEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = input.pagination?.page ?? 1;
    const limit = input.pagination?.limit ?? 50;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.organisationId = :organisationId', { organisationId: input.organisationId });

    if (input.entityType) {
      queryBuilder.andWhere('log.entityType = :entityType', { entityType: input.entityType });
    }

    if (input.entityId) {
      queryBuilder.andWhere('log.entityId = :entityId', { entityId: input.entityId });
    }

    if (input.action) {
      queryBuilder.andWhere('log.action = :action', { action: input.action });
    }

    if (input.fromDate) {
      queryBuilder.andWhere('log.timestamp >= :fromDate', { fromDate: input.fromDate });
    }

    if (input.toDate) {
      queryBuilder.andWhere('log.timestamp <= :toDate', { toDate: input.toDate });
    }

    const [logs, total] = await queryBuilder
      .orderBy('log.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySchedule(retryScheduleId: string): Promise<RetryAuditLogEntity[]> {
    return this.auditLogRepository.find({
      where: { retryScheduleId },
      order: { timestamp: 'ASC' },
    });
  }
}

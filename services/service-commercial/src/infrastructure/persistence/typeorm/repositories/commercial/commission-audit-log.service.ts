import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionAuditLogEntity } from '../../../../../domain/commercial/entities/commission-audit-log.entity';

@Injectable()
export class CommissionAuditLogService {
  constructor(
    @InjectRepository(CommissionAuditLogEntity)
    private readonly auditLogRepository: Repository<CommissionAuditLogEntity>,
  ) {}

  async create(data: Partial<CommissionAuditLogEntity>): Promise<CommissionAuditLogEntity> {
    const log = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(log);
  }

  async findAll(
    filters?: {
      organisationId?: string;
      scope?: string;
      refId?: string;
      action?: string;
      commissionId?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CommissionAuditLogEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.auditLogRepository.createQueryBuilder('a');

    if (filters?.organisationId) {
      qb.andWhere('a.organisationId = :orgId', { orgId: filters.organisationId });
    }
    if (filters?.scope) {
      qb.andWhere('a.scope = :scope', { scope: filters.scope });
    }
    if (filters?.refId) {
      qb.andWhere('a.refId = :refId', { refId: filters.refId });
    }
    if (filters?.action) {
      qb.andWhere('a.action = :action', { action: filters.action });
    }
    if (filters?.commissionId) {
      qb.andWhere('(a.refId = :commissionId AND a.scope = :commScope)', {
        commissionId: filters.commissionId,
        commScope: 'commission',
      });
    }

    qb.orderBy('a.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

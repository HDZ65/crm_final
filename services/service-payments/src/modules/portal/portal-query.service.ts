import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThan, MoreThan, Between } from 'typeorm';
import {
  PortalPaymentSessionEntity,
  PortalSessionStatus,
} from './entities/portal-session.entity.js';
import { PortalSessionAuditEntity } from './entities/portal-session-audit.entity.js';
import {
  ListPortalSessionsRequest,
  GetPortalSessionAuditRequest,
} from '@proto/payments/payment.js';

export type ListSessionsParams = Pick<ListPortalSessionsRequest, 'organisationId' | 'customerId'> & {
  contractId?: string;
  status?: PortalSessionStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  page?: number;
  limit?: number;
};

export interface ListSessionsResult {
  sessions: PortalPaymentSessionEntity[];
  total: number;
  page: number;
  totalPages: number;
}

export type GetAuditParams = Pick<GetPortalSessionAuditRequest, 'sessionId'> & {
  page?: number;
  limit?: number;
};

export interface GetAuditResult {
  events: PortalSessionAuditEntity[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SessionStats {
  total: number;
  byStatus: Record<PortalSessionStatus, number>;
  activeCount: number;
  expiredCount: number;
  completedCount: number;
  failedCount: number;
  conversionRate: number;
}

@Injectable()
export class PortalQueryService {
  private readonly logger = new Logger(PortalQueryService.name);

  constructor(
    @InjectRepository(PortalPaymentSessionEntity)
    private readonly sessionRepository: Repository<PortalPaymentSessionEntity>,
    @InjectRepository(PortalSessionAuditEntity)
    private readonly auditRepository: Repository<PortalSessionAuditEntity>,
  ) {}

  async listSessions(params: ListSessionsParams): Promise<ListSessionsResult> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<PortalPaymentSessionEntity> = {
      organisationId: params.organisationId,
    };

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.contractId) {
      where.contractId = params.contractId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.createdAfter && params.createdBefore) {
      where.createdAt = Between(params.createdAfter, params.createdBefore);
    } else if (params.createdAfter) {
      where.createdAt = MoreThan(params.createdAfter);
    } else if (params.createdBefore) {
      where.createdAt = LessThan(params.createdBefore);
    }

    const [sessions, total] = await this.sessionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      sessions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSessionAudit(params: GetAuditParams): Promise<GetAuditResult> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const [events, total] = await this.auditRepository.findAndCount({
      where: { portalSessionId: params.sessionId },
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });

    return {
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSessionStats(
    organisationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SessionStats> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .where('session.organisation_id = :organisationId', { organisationId });

    if (startDate) {
      queryBuilder.andWhere('session.created_at >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('session.created_at <= :endDate', { endDate });
    }

    const sessions = await queryBuilder.getMany();

    const byStatus: Record<PortalSessionStatus, number> = {
      [PortalSessionStatus.CREATED]: 0,
      [PortalSessionStatus.ACTIVE]: 0,
      [PortalSessionStatus.REDIRECTED]: 0,
      [PortalSessionStatus.COMPLETED]: 0,
      [PortalSessionStatus.FAILED]: 0,
      [PortalSessionStatus.EXPIRED]: 0,
      [PortalSessionStatus.CANCELLED]: 0,
    };

    for (const session of sessions) {
      byStatus[session.status]++;
    }

    const total = sessions.length;
    const completedCount = byStatus[PortalSessionStatus.COMPLETED];
    const redirectedOrBeyond =
      completedCount +
      byStatus[PortalSessionStatus.FAILED] +
      byStatus[PortalSessionStatus.REDIRECTED];

    const conversionRate = redirectedOrBeyond > 0 ? completedCount / redirectedOrBeyond : 0;

    return {
      total,
      byStatus,
      activeCount: byStatus[PortalSessionStatus.ACTIVE],
      expiredCount: byStatus[PortalSessionStatus.EXPIRED],
      completedCount,
      failedCount: byStatus[PortalSessionStatus.FAILED],
      conversionRate: Math.round(conversionRate * 10000) / 100,
    };
  }

  async findExpiredSessions(limit: number = 100): Promise<PortalPaymentSessionEntity[]> {
    return this.sessionRepository.find({
      where: {
        status: PortalSessionStatus.CREATED,
        expiresAt: LessThan(new Date()),
      },
      take: limit,
      order: { expiresAt: 'ASC' },
    });
  }

  async findActiveSessions(limit: number = 100): Promise<PortalPaymentSessionEntity[]> {
    return this.sessionRepository.find({
      where: {
        status: PortalSessionStatus.ACTIVE,
        expiresAt: LessThan(new Date()),
      },
      take: limit,
      order: { expiresAt: 'ASC' },
    });
  }

  async markExpiredSessions(): Promise<number> {
    const expiredCreated = await this.findExpiredSessions();
    const expiredActive = await this.findActiveSessions();
    const allExpired = [...expiredCreated, ...expiredActive];

    let count = 0;
    for (const session of allExpired) {
      session.status = PortalSessionStatus.EXPIRED;
      await this.sessionRepository.save(session);

      const audit = this.auditRepository.create({
        portalSessionId: session.id,
        eventType: 'SESSION_EXPIRED' as any,
        actorType: 'SYSTEM' as any,
        previousStatus: session.status,
        newStatus: PortalSessionStatus.EXPIRED,
        data: {},
      });
      await this.auditRepository.save(audit);

      count++;
    }

    if (count > 0) {
      this.logger.log(`Marked ${count} sessions as expired`);
    }

    return count;
  }

  async getSessionWithAudit(
    sessionId: string,
  ): Promise<{ session: PortalPaymentSessionEntity; audit: PortalSessionAuditEntity[] } | null> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    const audit = await this.auditRepository.find({
      where: { portalSessionId: sessionId },
      order: { createdAt: 'ASC' },
    });

    return { session, audit };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentAuditLogEntity, AuditAction } from './entities/payment-audit-log.entity';
import { randomUUID } from 'crypto';
import { PortalRequestContext } from '@crm/proto/payments';

export interface AuditContext {
  actorId?: string;
  actorType?: 'user' | 'system' | 'webhook';
  actorIp?: string;
  correlationId?: string;
}

export interface AuditLogParams {
  societeId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  metadata?: Record<string, any>;
  context?: AuditContext;
}

@Injectable()
export class PaymentAuditService {
  private readonly logger = new Logger(PaymentAuditService.name);

  constructor(
    @InjectRepository(PaymentAuditLogEntity)
    private readonly auditRepository: Repository<PaymentAuditLogEntity>,
  ) {}

  async log(params: AuditLogParams): Promise<PaymentAuditLogEntity> {
    const auditLog = this.auditRepository.create({
      societeId: params.societeId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      previousState: params.previousState || null,
      newState: params.newState || null,
      metadata: params.metadata || null,
      actorId: params.context?.actorId || null,
      actorType: params.context?.actorType || 'system',
      actorIp: params.context?.actorIp || null,
      correlationId: params.context?.correlationId || randomUUID(),
    });

    const saved = await this.auditRepository.save(auditLog);

    this.logger.debug(
      `Audit log created: ${params.action} on ${params.entityType}/${params.entityId}`,
    );

    return saved;
  }

  async logPaymentCreated(
    societeId: string,
    paymentIntentId: string,
    newState: Record<string, any>,
    context?: AuditContext,
  ): Promise<void> {
    await this.log({
      societeId,
      entityType: 'PaymentIntent',
      entityId: paymentIntentId,
      action: AuditAction.PAYMENT_CREATED,
      newState,
      context,
    });
  }

  async logPaymentStatusChange(
    societeId: string,
    paymentIntentId: string,
    previousState: Record<string, any>,
    newState: Record<string, any>,
    action: AuditAction,
    context?: AuditContext,
  ): Promise<void> {
    await this.log({
      societeId,
      entityType: 'PaymentIntent',
      entityId: paymentIntentId,
      action,
      previousState,
      newState,
      context,
    });
  }

  async logMandateCreated(
    societeId: string,
    mandateId: string,
    newState: Record<string, any>,
    context?: AuditContext,
  ): Promise<void> {
    await this.log({
      societeId,
      entityType: 'Mandate',
      entityId: mandateId,
      action: AuditAction.MANDATE_CREATED,
      newState,
      context,
    });
  }

  async logEmission(
    societeId: string,
    emissionId: string,
    action: AuditAction.EMISSION_STARTED | AuditAction.EMISSION_COMPLETED,
    metadata: Record<string, any>,
    context?: AuditContext,
  ): Promise<void> {
    await this.log({
      societeId,
      entityType: 'Emission',
      entityId: emissionId,
      action,
      metadata,
      context,
    });
  }

  async getAuditTrail(
    entityType: string,
    entityId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ logs: PaymentAuditLogEntity[]; total: number }> {
    const [logs, total] = await this.auditRepository.findAndCount({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return { logs, total };
  }

  async getAuditBySociete(
    societeId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      action?: AuditAction;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ logs: PaymentAuditLogEntity[]; total: number }> {
    const query = this.auditRepository
      .createQueryBuilder('audit')
      .where('audit.societe_id = :societeId', { societeId });

    if (options?.startDate) {
      query.andWhere('audit.created_at >= :startDate', { startDate: options.startDate });
    }

    if (options?.endDate) {
      query.andWhere('audit.created_at <= :endDate', { endDate: options.endDate });
    }

    if (options?.action) {
      query.andWhere('audit.action = :action', { action: options.action });
    }

    query.orderBy('audit.created_at', 'DESC');

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    const [logs, total] = await query.getManyAndCount();

    return { logs, total };
  }

  async getByCorrelationId(correlationId: string): Promise<PaymentAuditLogEntity[]> {
    return this.auditRepository.find({
      where: { correlationId },
      order: { createdAt: 'ASC' },
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  CommissionAuditLogEntity,
  AuditAction,
  AuditScope,
} from './entities/commission-audit-log.entity';

export interface AuditLogInput {
  organisationId: string;
  scope: AuditScope;
  action: AuditAction;
  refId?: string;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
  metadata?: Record<string, any>;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  motif?: string;
  baremeId?: string;
  baremeVersion?: number;
  contratId?: string;
  apporteurId?: string;
  periode?: string;
  montantCalcule?: number;
}

export interface AuditLogFilters {
  organisationId: string;
  scope?: AuditScope;
  action?: AuditAction;
  refId?: string;
  userId?: string;
  apporteurId?: string;
  contratId?: string;
  baremeId?: string;
  periode?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class CommissionAuditService {
  private readonly logger = new Logger(CommissionAuditService.name);

  constructor(
    @InjectRepository(CommissionAuditLogEntity)
    private readonly auditRepository: Repository<CommissionAuditLogEntity>,
  ) {}

  async log(input: AuditLogInput): Promise<CommissionAuditLogEntity> {
    const auditLog = this.auditRepository.create({
      organisationId: input.organisationId,
      scope: input.scope,
      action: input.action,
      refId: input.refId || null,
      beforeData: input.beforeData || null,
      afterData: input.afterData || null,
      metadata: input.metadata || null,
      userId: input.userId || null,
      userName: input.userName || null,
      ipAddress: input.ipAddress || null,
      motif: input.motif || null,
      baremeId: input.baremeId || null,
      baremeVersion: input.baremeVersion || null,
      contratId: input.contratId || null,
      apporteurId: input.apporteurId || null,
      periode: input.periode || null,
      montantCalcule: input.montantCalcule || null,
    });

    const saved = await this.auditRepository.save(auditLog);
    this.logger.debug(`Audit log created: ${input.action} on ${input.scope} ${input.refId || ''}`);
    return saved;
  }

  async logCalculation(
    organisationId: string,
    commissionId: string,
    baremeId: string,
    baremeVersion: number,
    contratId: string,
    apporteurId: string,
    periode: string,
    montantCalcule: number,
    calculDetails: Record<string, any>,
  ): Promise<CommissionAuditLogEntity> {
    return this.log({
      organisationId,
      scope: AuditScope.ENGINE,
      action: AuditAction.COMMISSION_CALCULATED,
      refId: commissionId,
      baremeId,
      baremeVersion,
      contratId,
      apporteurId,
      periode,
      montantCalcule,
      metadata: calculDetails,
    });
  }

  async logRecurrence(
    organisationId: string,
    commissionId: string,
    contratId: string,
    apporteurId: string,
    periode: string,
    montant: number,
    echeanceId: string,
    numeroMois: number,
  ): Promise<CommissionAuditLogEntity> {
    return this.log({
      organisationId,
      scope: AuditScope.RECURRENCE,
      action: AuditAction.RECURRENCE_GENERATED,
      refId: commissionId,
      contratId,
      apporteurId,
      periode,
      montantCalcule: montant,
      metadata: { echeanceId, numeroMois },
    });
  }

  async logReprise(
    organisationId: string,
    repriseId: string,
    action: AuditAction,
    contratId: string,
    apporteurId: string,
    periodeOrigine: string,
    periodeApplication: string,
    montant: number,
    motif?: string,
  ): Promise<CommissionAuditLogEntity> {
    return this.log({
      organisationId,
      scope: AuditScope.REPRISE,
      action,
      refId: repriseId,
      contratId,
      apporteurId,
      periode: periodeApplication,
      montantCalcule: montant,
      motif,
      metadata: { periodeOrigine },
    });
  }

  async logReportNegatif(
    organisationId: string,
    apporteurId: string,
    periodeOrigine: string,
    periodeApplication: string,
    montant: number,
    action: AuditAction,
  ): Promise<CommissionAuditLogEntity> {
    return this.log({
      organisationId,
      scope: AuditScope.REPORT,
      action,
      apporteurId,
      periode: periodeApplication,
      montantCalcule: montant,
      metadata: { periodeOrigine },
    });
  }

  async logBordereau(
    organisationId: string,
    bordereauId: string,
    action: AuditAction,
    userId?: string,
    userName?: string,
    totaux?: { brut: number; reprises: number; net: number },
  ): Promise<CommissionAuditLogEntity> {
    return this.log({
      organisationId,
      scope: AuditScope.BORDEREAU,
      action,
      refId: bordereauId,
      userId,
      userName,
      afterData: totaux,
    });
  }

  async logLigneSelection(
    organisationId: string,
    ligneId: string,
    selected: boolean,
    userId?: string,
    userName?: string,
    motif?: string,
  ): Promise<CommissionAuditLogEntity> {
    return this.log({
      organisationId,
      scope: AuditScope.LIGNE,
      action: selected ? AuditAction.LIGNE_SELECTED : AuditAction.LIGNE_DESELECTED,
      refId: ligneId,
      userId,
      userName,
      motif,
    });
  }

  async logBareme(
    organisationId: string,
    baremeId: string,
    action: AuditAction,
    beforeData?: Record<string, any>,
    afterData?: Record<string, any>,
    userId?: string,
    userName?: string,
    motif?: string,
  ): Promise<CommissionAuditLogEntity> {
    return this.log({
      organisationId,
      scope: AuditScope.BAREME,
      action,
      refId: baremeId,
      baremeId,
      beforeData,
      afterData,
      userId,
      userName,
      motif,
    });
  }

  async findAll(filters: AuditLogFilters): Promise<{ logs: CommissionAuditLogEntity[]; total: number }> {
    const qb = this.auditRepository
      .createQueryBuilder('log')
      .where('log.organisation_id = :organisationId', { organisationId: filters.organisationId });

    if (filters.scope) {
      qb.andWhere('log.scope = :scope', { scope: filters.scope });
    }
    if (filters.action) {
      qb.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters.refId) {
      qb.andWhere('log.ref_id = :refId', { refId: filters.refId });
    }
    if (filters.userId) {
      qb.andWhere('log.user_id = :userId', { userId: filters.userId });
    }
    if (filters.apporteurId) {
      qb.andWhere('log.apporteur_id = :apporteurId', { apporteurId: filters.apporteurId });
    }
    if (filters.contratId) {
      qb.andWhere('log.contrat_id = :contratId', { contratId: filters.contratId });
    }
    if (filters.baremeId) {
      qb.andWhere('log.bareme_id = :baremeId', { baremeId: filters.baremeId });
    }
    if (filters.periode) {
      qb.andWhere('log.periode = :periode', { periode: filters.periode });
    }
    if (filters.dateFrom) {
      qb.andWhere('log.created_at >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      qb.andWhere('log.created_at <= :dateTo', { dateTo: filters.dateTo });
    }

    qb.orderBy('log.created_at', 'DESC');

    const total = await qb.getCount();

    if (filters.limit) qb.take(filters.limit);
    if (filters.offset) qb.skip(filters.offset);

    const logs = await qb.getMany();
    return { logs, total };
  }

  async findByRef(organisationId: string, scope: AuditScope, refId: string): Promise<CommissionAuditLogEntity[]> {
    return this.auditRepository.find({
      where: { organisationId, scope, refId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByCommission(organisationId: string, commissionId: string): Promise<CommissionAuditLogEntity[]> {
    return this.auditRepository.find({
      where: [
        { organisationId, scope: AuditScope.COMMISSION, refId: commissionId },
        { organisationId, scope: AuditScope.ENGINE, refId: commissionId },
        { organisationId, scope: AuditScope.RECURRENCE, refId: commissionId },
      ],
      order: { createdAt: 'DESC' },
    });
  }
}

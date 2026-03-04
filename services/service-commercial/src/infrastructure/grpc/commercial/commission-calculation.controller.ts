import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CommissionCalculationServiceControllerMethods } from '@proto/commission/calculation';
import type {
  CalculerCommissionRequest,
  GenererBordereauRequest,
  DeclencherRepriseRequest,
  GetAuditLogsRequest,
  GetAuditLogsByRefRequest,
  GetByCommissionRequest,
  GetRecurrencesRequest,
  GetRecurrencesByContratRequest,
} from '@proto/commission';
import { CommissionService } from '../../persistence/typeorm/repositories/commercial/commission.service';
import { BaremeService } from '../../persistence/typeorm/repositories/commercial/bareme.service';
import { RepriseService } from '../../persistence/typeorm/repositories/commercial/reprise.service';
import { CommissionAuditLogService } from '../../persistence/typeorm/repositories/commercial/commission-audit-log.service';
import { CommissionRecurrenteService } from '../../persistence/typeorm/repositories/commercial/commission-recurrente.service';
import { CommissionCalculationService } from '../../../domain/commercial/services/commission-calculation.service';
import { RepriseCalculationService } from '../../../domain/commercial/services/reprise-calculation.service';
import { GenererBordereauWorkflowService } from '../../../domain/commercial/services/generer-bordereau-workflow.service';
import { TypeReprise } from '../../../domain/commercial/entities/reprise-commission.entity';

/** Convert proto limit/offset to pagination object expected by services */
function toPagination(data: { limit?: number; offset?: number }) {
  return {
    page: data.offset && data.limit ? Math.floor(data.offset / data.limit) + 1 : 1,
    limit: data.limit || 20,
  };
}

@Controller()
@CommissionCalculationServiceControllerMethods()
export class CommissionCalculationController {
  constructor(
    private readonly commissionService: CommissionService,
    private readonly baremeService: BaremeService,
    private readonly repriseService: RepriseService,
    private readonly auditLogService: CommissionAuditLogService,
    private readonly recurrenteService: CommissionRecurrenteService,
    private readonly commissionCalculationService: CommissionCalculationService,
    private readonly repriseCalculationService: RepriseCalculationService,
    private readonly genererBordereauWorkflowService: GenererBordereauWorkflowService,
  ) {}

  // ============================================================================
  // COMMISSION ENGINE (3 RPCs)
  // ============================================================================

  async calculerCommission(data: CalculerCommissionRequest) {
    // Find applicable bareme
    const bareme = await this.baremeService.findApplicable(
      data.organisation_id,
      data.type_produit,
      new Date().toISOString().split('T')[0],
    );

    const montantBase = parseFloat(data.montant_base) || 0;
    const commissionResult = this.commissionCalculationService.calculer({ id: data.contrat_id }, bareme, montantBase);
    const montantCalcule = commissionResult.montantCalcule;

    // Log audit
    await this.auditLogService.create({
      organisationId: data.organisation_id,
      scope: 'engine' as any,
      action: 'commission_calculated' as any,
      afterData: { montantBase, montantCalcule, baremeId: bareme.id },
      contratId: data.contrat_id,
      apporteurId: data.apporteur_id,
      baremeId: bareme.id,
      montantCalcule,
    });

    return {
      montant_calcule: String(montantCalcule),
      bareme_id: bareme.id,
      bareme_code: bareme.code,
      type_calcul: bareme.typeCalcul,
      taux_applique: String(bareme.tauxPourcentage || 0),
      details: JSON.stringify({ montantBase, typeCalcul: bareme.typeCalcul, ...commissionResult.details }),
    };
  }

  async genererBordereau(data: GenererBordereauRequest) {
    const result = await this.genererBordereauWorkflowService.execute({
      organisationId: data.organisation_id,
      apporteurId: data.apporteur_id,
      periode: data.periode,
      creePar: data.cree_par || null,
    });

    return {
      bordereau: result.bordereau as any,
      summary: result.summary,
      bordereau_id: (result.bordereau as any)?.id,
      reference: (result.bordereau as any)?.reference,
      nombre_lignes: (result.bordereau as any)?.nombreLignes || 0,
      total_brut: result.summary.total_brut,
      total_reprises: result.summary.total_reprises,
      total_net: result.summary.total_net,
    };
  }

  async declencherReprise(data: DeclencherRepriseRequest) {
    const commission = await this.commissionService.findById(data.commission_id);
    const typeReprise = this.mapTypeReprise(data.type_reprise as unknown);
    const fenetre = typeReprise === TypeReprise.RESILIATION ? 12 : 3;
    const repriseCalculee = await this.repriseCalculationService.calculerReprise(
      commission.contratId,
      typeReprise,
      fenetre,
      commission.periode,
    );

    const tauxReprise = commission.montantBrut > 0
      ? Math.round((repriseCalculee.montantReprise / Number(commission.montantBrut)) * 10000) / 100
      : 0;

    const reprise = await this.repriseService.create({
      organisationId: commission.organisationId,
      commissionOriginaleId: data.commission_id,
      contratId: commission.contratId,
      apporteurId: commission.apporteurId,
      reference: `RPR-${Date.now()}`,
      typeReprise,
      montantReprise: repriseCalculee.montantReprise,
      tauxReprise,
      montantOriginal: Number(commission.montantBrut),
      periodeOrigine: commission.periode,
      periodeApplication: commission.periode,
      dateEvenement: new Date(data.date_evenement),
      dateLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      motif: data.motif || null,
      commentaire: repriseCalculee.suspendRecurrence ? 'Recurrence suspendue suite impaye' : null,
    });

    return { reprise };
  }

  private mapTypeReprise(rawType: unknown): TypeReprise {
    if (rawType === TypeReprise.RESILIATION || rawType === 1 || rawType === 'TYPE_REPRISE_RESILIATION') {
      return TypeReprise.RESILIATION;
    }
    if (rawType === TypeReprise.IMPAYE || rawType === 2 || rawType === 'TYPE_REPRISE_IMPAYE') {
      return TypeReprise.IMPAYE;
    }
    if (rawType === TypeReprise.ANNULATION || rawType === 3 || rawType === 'TYPE_REPRISE_ANNULATION') {
      return TypeReprise.ANNULATION;
    }
    if (rawType === TypeReprise.REGULARISATION || rawType === 4 || rawType === 'TYPE_REPRISE_REGULARISATION') {
      return TypeReprise.REGULARISATION;
    }
    return TypeReprise.RESILIATION;
  }

  // ============================================================================
  // AUDIT LOGS (3 RPCs)
  // ============================================================================

  async getAuditLogs(data: GetAuditLogsRequest) {
    const result = await this.auditLogService.findAll(
      {
        organisationId: data.organisation_id,
        scope: data.scope as any,
        action: data.action as any,
      },
      toPagination(data),
    );
    return {
      audit_logs: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  async getAuditLogsByRef(data: GetAuditLogsByRefRequest) {
    const result = await this.auditLogService.findAll(
      { refId: data.ref_id, scope: data.scope as any },
      toPagination({}),
    );
    return {
      audit_logs: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  async getAuditLogsByCommission(data: GetByCommissionRequest) {
    const result = await this.auditLogService.findAll(
      { commissionId: data.commission_id },
      toPagination({}),
    );
    return {
      audit_logs: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  // ============================================================================
  // RECURRENCES (2 RPCs)
  // ============================================================================

  async getRecurrences(data: GetRecurrencesRequest) {
    const result = await this.recurrenteService.findAll(
      {
        organisationId: data.organisation_id,
        apporteurId: data.apporteur_id,
        statutRecurrence: data.statut as any,
      },
      toPagination(data),
    );
    return {
      recurrences: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  async getRecurrencesByContrat(data: GetRecurrencesByContratRequest) {
    const result = await this.recurrenteService.findByContrat(
      data.contrat_id,
      toPagination({}),
    );
    return {
      recurrences: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }
}

import { Controller } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CommissionContestationServiceControllerMethods } from '@proto/commission/contestation';
import type {
  CreateRepriseRequest,
  GetByIdRequest,
  GetReprisesRequest,
  GetByCommissionRequest,
  ApplyRepriseRequest,
  CreerContestationRequest,
  GetContestationsRequest,
  ResoudreContestationRequest,
} from '@proto/commission';
import { CommissionService } from '../../persistence/typeorm/repositories/commercial/commission.service';
import { BordereauService } from '../../persistence/typeorm/repositories/commercial/bordereau.service';
import { LigneBordereauService } from '../../persistence/typeorm/repositories/commercial/ligne-bordereau.service';
import { RepriseService } from '../../persistence/typeorm/repositories/commercial/reprise.service';
import { StatutCommissionService } from '../../persistence/typeorm/repositories/commercial/statut-commission.service';
import { ContestationCommissionService } from '../../persistence/typeorm/repositories/commercial/contestation-commission.service';
import { RepriseCalculationService } from '../../../domain/commercial/services/reprise-calculation.service';
import { ContestationWorkflowService } from '../../../domain/commercial/services/contestation-workflow.service';
import { StatutContestation } from '../../../domain/commercial/entities/contestation-commission.entity';

/** Convert proto limit/offset to pagination object expected by services */
function toPagination(data: { limit?: number; offset?: number }) {
  return {
    page: data.offset && data.limit ? Math.floor(data.offset / data.limit) + 1 : 1,
    limit: data.limit || 20,
  };
}

@Controller()
@CommissionContestationServiceControllerMethods()
export class CommissionContestationController {
  constructor(
    private readonly commissionService: CommissionService,
    private readonly bordereauService: BordereauService,
    private readonly ligneBordereauService: LigneBordereauService,
    private readonly repriseService: RepriseService,
    private readonly statutService: StatutCommissionService,
    private readonly contestationService: ContestationCommissionService,
    private readonly repriseCalculationService: RepriseCalculationService,
    private readonly contestationWorkflowService: ContestationWorkflowService,
  ) {}

  // ============================================================================
  // REPRISE CRUD (7 RPCs)
  // ============================================================================

  async createReprise(data: CreateRepriseRequest) {
    return { reprise: await this.repriseService.create({
      organisationId: data.organisation_id,
      commissionOriginaleId: data.commission_originale_id,
      contratId: data.contrat_id,
      apporteurId: data.apporteur_id,
      reference: data.reference,
      typeReprise: data.type_reprise as any,
      montantReprise: Number(data.montant_reprise),
      tauxReprise: Number(data.taux_reprise) || 100,
      montantOriginal: Number(data.montant_original),
      periodeOrigine: data.periode_origine,
      periodeApplication: data.periode_application,
      dateEvenement: new Date(data.date_evenement),
      dateLimite: new Date(data.date_limite),
      motif: data.motif || null,
      commentaire: data.commentaire || null,
    }) };
  }

  async getReprise(data: GetByIdRequest) {
    return { reprise: await this.repriseService.findById(data.id) };
  }

  async getReprises(data: GetReprisesRequest) {
    const result = await this.repriseService.findAll(
      {
        organisationId: data.organisation_id,
        apporteurId: data.apporteur_id,
        statutReprise: data.statut as any,
      },
      toPagination(data),
    );
    return {
      reprises: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  async getReprisesByCommission(data: GetByCommissionRequest) {
    const result = await this.repriseService.findAll(
      { commissionId: data.commission_id },
      toPagination({}),
    );
    return {
      reprises: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  async applyReprise(data: ApplyRepriseRequest) {
    return { reprise: await this.repriseService.apply(data.id) };
  }

  async cancelReprise(data: GetByIdRequest) {
    return { reprise: await this.repriseService.cancel(data.id) };
  }

  async deleteReprise(data: GetByIdRequest) {
    const success = await this.repriseService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // CONTESTATIONS (3 RPCs)
  // ============================================================================

  async creerContestation(data: CreerContestationRequest) {
    const commission = await this.commissionService.findById(data.commission_id);
    const bordereau = await this.bordereauService.findById(data.bordereau_id);

    const datePublication = bordereau.dateValidation || bordereau.createdAt;
    const dateContestation = data.date_contestation ? new Date(data.date_contestation) : new Date();

    try {
      this.contestationWorkflowService.verifierDelaiContestation(datePublication, dateContestation);
    } catch (error) {
      if (error instanceof Error && error.message.includes('delai de contestation')) {
        throw new RpcException({
          code: status.DEADLINE_EXCEEDED,
          message: error.message,
        });
      }
      throw error;
    }

    const statutContestee = await this.statutService.findByCode('contestee');
    const statutCommissionPrecedentId = commission.statutId;
    await this.commissionService.update(commission.id, { statutId: statutContestee.id });

    const contestation = await this.contestationService.create({
      organisationId: data.organisation_id,
      commissionId: data.commission_id,
      bordereauId: data.bordereau_id,
      apporteurId: data.apporteur_id,
      motif: data.motif,
      dateContestation,
      dateLimite: this.contestationWorkflowService.calculerDateLimite(datePublication),
      statut: StatutContestation.EN_COURS,
      statutCommissionPrecedentId,
    });

    return { contestation };
  }

  async getContestations(data: GetContestationsRequest) {
    const result = await this.contestationService.findAll(
      {
        organisationId: data.organisation_id,
        commissionId: data.commission_id,
        bordereauId: data.bordereau_id,
        apporteurId: data.apporteur_id,
        statut: this.mapStatutContestation(data.statut as unknown),
      },
      toPagination(data),
    );

    return {
      contestations: result.data,
      total: result.total,
    };
  }

  async resoudreContestation(data: ResoudreContestationRequest) {
    this.contestationWorkflowService.validerResolution(data.commentaire);

    const contestation = await this.contestationService.findById(data.id);
    if (contestation.statut !== StatutContestation.EN_COURS) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Cette contestation est deja resolue',
      });
    }

    const commission = await this.commissionService.findById(contestation.commissionId);
    const statutResolution = this.contestationWorkflowService.determinerStatutResolution(
      data.acceptee,
      data.commentaire,
    );

    let ligneRegularisationId: string | null = null;
    if (statutResolution === StatutContestation.ACCEPTEE) {
      const regularisation = this.repriseCalculationService.genererRegularisation({
        organisationId: contestation.organisationId,
        bordereauId: contestation.bordereauId,
        commissionId: contestation.commissionId,
        contratId: commission.contratId,
        apporteurId: commission.apporteurId,
        referenceContrat: commission.reference,
        montantNetCommission: Number(commission.montantNetAPayer),
        motif: contestation.motif,
      });

      const ligne = await this.ligneBordereauService.create({
        organisationId: regularisation.organisationId,
        bordereauId: regularisation.bordereauId,
        commissionId: regularisation.commissionId,
        typeLigne: regularisation.typeLigne as any,
        contratId: regularisation.contratId,
        contratReference: regularisation.contratReference,
        montantBrut: regularisation.montantBrut,
        montantReprise: regularisation.montantReprise,
        montantNet: regularisation.montantNet,
      });
      ligneRegularisationId = ligne.id;
    } else if (contestation.statutCommissionPrecedentId) {
      await this.commissionService.update(contestation.commissionId, {
        statutId: contestation.statutCommissionPrecedentId,
      });
    }

    const updated = await this.contestationService.update(data.id, {
      statut: statutResolution,
      commentaireResolution: data.commentaire,
      resoluPar: data.resolu_par,
      dateResolution: new Date(),
      ligneRegularisationId,
    });

    return { contestation: updated };
  }

  private mapStatutContestation(rawStatut: unknown): StatutContestation | undefined {
    if (rawStatut === undefined || rawStatut === null || rawStatut === 0 || rawStatut === 'STATUT_CONTESTATION_UNSPECIFIED') {
      return undefined;
    }
    if (rawStatut === 1 || rawStatut === 'STATUT_CONTESTATION_EN_COURS' || rawStatut === StatutContestation.EN_COURS) {
      return StatutContestation.EN_COURS;
    }
    if (rawStatut === 2 || rawStatut === 'STATUT_CONTESTATION_ACCEPTEE' || rawStatut === StatutContestation.ACCEPTEE) {
      return StatutContestation.ACCEPTEE;
    }
    if (rawStatut === 3 || rawStatut === 'STATUT_CONTESTATION_REJETEE' || rawStatut === StatutContestation.REJETEE) {
      return StatutContestation.REJETEE;
    }
    return undefined;
  }
}

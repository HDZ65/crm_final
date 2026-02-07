import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CommissionService } from '../../persistence/typeorm/repositories/commercial/commission.service';
import { BaremeService } from '../../persistence/typeorm/repositories/commercial/bareme.service';
import { PalierService } from '../../persistence/typeorm/repositories/commercial/palier.service';
import { BordereauService } from '../../persistence/typeorm/repositories/commercial/bordereau.service';
import { LigneBordereauService } from '../../persistence/typeorm/repositories/commercial/ligne-bordereau.service';
import { RepriseService } from '../../persistence/typeorm/repositories/commercial/reprise.service';
import { StatutCommissionService } from '../../persistence/typeorm/repositories/commercial/statut-commission.service';
import { CommissionAuditLogService } from '../../persistence/typeorm/repositories/commercial/commission-audit-log.service';
import { CommissionRecurrenteService } from '../../persistence/typeorm/repositories/commercial/commission-recurrente.service';
import { ReportNegatifService } from '../../persistence/typeorm/repositories/commercial/report-negatif.service';
import { ContestationCommissionService } from '../../persistence/typeorm/repositories/commercial/contestation-commission.service';
import { CommissionCalculationService } from '../../../domain/commercial/services/commission-calculation.service';
import { RepriseCalculationService } from '../../../domain/commercial/services/reprise-calculation.service';
import { GenererBordereauWorkflowService } from '../../../domain/commercial/services/generer-bordereau-workflow.service';
import { TypeReprise } from '../../../domain/commercial/entities/reprise-commission.entity';
import { ContestationWorkflowService } from '../../../domain/commercial/services/contestation-workflow.service';
import { BordereauExportService } from '../../../domain/commercial/services/bordereau-export.service';
import { BordereauFileStorageService } from '../../../domain/commercial/services/bordereau-file-storage.service';
import { SnapshotKpiService } from '../../../domain/commercial/services/snapshot-kpi.service';
import { StatutContestation } from '../../../domain/commercial/entities/contestation-commission.entity';
import { StatutBordereau } from '../../../domain/commercial/entities/bordereau-commission.entity';
import { StatutLigne, TypeLigne } from '../../../domain/commercial/entities/ligne-bordereau.entity';
import { ExportFormatAnalytique } from '@proto/commission';
import type {
  CreateCommissionRequest,
  GetByIdRequest,
  GetCommissionsRequest,
  GetByApporteurRequest,
  GetByPeriodeRequest,
  UpdateCommissionRequest,
  CreateBaremeRequest,
  GetBaremesRequest,
  GetBaremeApplicableRequest,
  UpdateBaremeRequest,
  CreatePalierRequest,
  UpdatePalierRequest,
  GetByBaremeRequest,
  CreateBordereauRequest,
  GetBordereauxRequest,
  GetBordereauByApporteurPeriodeRequest,
  UpdateBordereauRequest,
  ValidateBordereauRequest,
  CreateLigneBordereauRequest,
  UpdateLigneBordereauRequest,
  ValidateLigneRequest,
  GetByBordereauRequest,
  CreateRepriseRequest,
  GetReprisesRequest,
  GetByCommissionRequest,
  ApplyRepriseRequest,
  CreateStatutRequest,
  GetStatutsRequest,
  GetStatutByCodeRequest,
  UpdateStatutRequest,
  CalculerCommissionRequest,
  GenererBordereauRequest,
  DeclencherRepriseRequest,
  GetAuditLogsRequest,
  GetAuditLogsByRefRequest,
  GetRecurrencesRequest,
  GetRecurrencesByContratRequest,
  GetReportsNegatifsRequest,
  CreerContestationRequest,
  GetContestationsRequest,
  ResoudreContestationRequest,
  PreselectionRequest,
  RecalculerTotauxRequest,
  ValiderBordereauFinalRequest,
  GetLignesForValidationRequest,
  ExportBordereauRequest,
  GetDashboardKpiRequest,
  GenererSnapshotKpiRequest,
  GetComparatifsRequest,
  ExportAnalytiqueRequest,
} from '@proto/commission';

/** Convert proto limit/offset to pagination object expected by services */
function toPagination(data: { limit?: number; offset?: number }) {
  return {
    page: data.offset && data.limit ? Math.floor(data.offset / data.limit) + 1 : 1,
    limit: data.limit || 20,
  };
}

function toMoneyString(value: number): string {
  return value.toFixed(2);
}

function toDashboardFilters(filters?: {
  organisation_id?: string;
  periode?: string;
  apporteur_id?: string;
  produit_id?: string;
  date_debut?: string;
  date_fin?: string;
}) {
  return {
    organisationId: filters?.organisation_id || '',
    periode: filters?.periode,
    apporteurId: filters?.apporteur_id,
    produitId: filters?.produit_id,
    dateDebut: filters?.date_debut,
    dateFin: filters?.date_fin,
  };
}

@Controller()
export class CommissionController {
  constructor(
    private readonly commissionService: CommissionService,
    private readonly baremeService: BaremeService,
    private readonly palierService: PalierService,
    private readonly bordereauService: BordereauService,
    private readonly ligneBordereauService: LigneBordereauService,
    private readonly repriseService: RepriseService,
    private readonly statutService: StatutCommissionService,
    private readonly auditLogService: CommissionAuditLogService,
    private readonly recurrenteService: CommissionRecurrenteService,
    private readonly reportNegatifService: ReportNegatifService,
    private readonly contestationService: ContestationCommissionService,
    private readonly commissionCalculationService: CommissionCalculationService,
    private readonly repriseCalculationService: RepriseCalculationService,
    private readonly genererBordereauWorkflowService: GenererBordereauWorkflowService,
    private readonly contestationWorkflowService: ContestationWorkflowService,
    private readonly bordereauExportService: BordereauExportService,
    private readonly bordereauFileStorageService: BordereauFileStorageService,
    private readonly snapshotKpiService: SnapshotKpiService,
  ) {}

  // ============================================================================
  // COMMISSION CRUD (7 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionService', 'CreateCommission')
  async createCommission(data: CreateCommissionRequest) {
    return { commission: await this.commissionService.create({
      organisationId: data.organisation_id,
      reference: data.reference,
      apporteurId: data.apporteur_id,
      contratId: data.contrat_id,
      produitId: data.produit_id || null,
      compagnie: data.compagnie,
      typeBase: data.type_base,
      montantBrut: Number(data.montant_brut),
      montantReprises: Number(data.montant_reprises) || 0,
      montantAcomptes: Number(data.montant_acomptes) || 0,
      montantNetAPayer: Number(data.montant_net_a_payer),
      statutId: data.statut_id,
      periode: data.periode,
      dateCreation: new Date(data.date_creation),
    }) };
  }

  @GrpcMethod('CommissionService', 'GetCommission')
  async getCommission(data: GetByIdRequest) {
    return { commission: await this.commissionService.findById(data.id) };
  }

  @GrpcMethod('CommissionService', 'GetCommissions')
  async getCommissions(data: GetCommissionsRequest) {
    const result = await this.commissionService.findAll(
      {
        organisationId: data.organisation_id,
        apporteurId: data.apporteur_id,
        periode: data.periode,
        statutId: data.statut_id,
      },
      toPagination(data),
    );
    return {
      commissions: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('CommissionService', 'GetCommissionsByApporteur')
  async getCommissionsByApporteur(data: GetByApporteurRequest) {
    const result = await this.commissionService.findAll(
      { organisationId: data.organisation_id, apporteurId: data.apporteur_id },
      toPagination(data),
    );
    return {
      commissions: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('CommissionService', 'GetCommissionsByPeriode')
  async getCommissionsByPeriode(data: GetByPeriodeRequest) {
    const result = await this.commissionService.findAll(
      {
        organisationId: data.organisation_id,
        periode: data.periode,
      },
      toPagination(data),
    );
    return {
      commissions: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('CommissionService', 'UpdateCommission')
  async updateCommission(data: UpdateCommissionRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.montant_brut !== undefined) updateData.montantBrut = Number(data.montant_brut);
    if (data.montant_reprises !== undefined) updateData.montantReprises = Number(data.montant_reprises);
    if (data.montant_acomptes !== undefined) updateData.montantAcomptes = Number(data.montant_acomptes);
    if (data.montant_net_a_payer !== undefined) updateData.montantNetAPayer = Number(data.montant_net_a_payer);
    if (data.statut_id) updateData.statutId = data.statut_id;

    return { commission: await this.commissionService.update(data.id, updateData) };
  }

  @GrpcMethod('CommissionService', 'DeleteCommission')
  async deleteCommission(data: GetByIdRequest) {
    const success = await this.commissionService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // BAREME CRUD (6 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionService', 'CreateBareme')
  async createBareme(data: CreateBaremeRequest) {
    return { bareme: await this.baremeService.create({
      organisationId: data.organisation_id,
      code: data.code,
      nom: data.nom,
      description: data.description || null,
      typeCalcul: data.type_calcul as any,
      baseCalcul: data.base_calcul as any,
      montantFixe: data.montant_fixe ? Number(data.montant_fixe) : null,
      tauxPourcentage: data.taux_pourcentage ? Number(data.taux_pourcentage) : null,
      recurrenceActive: data.recurrence_active || false,
      tauxRecurrence: data.taux_recurrence ? Number(data.taux_recurrence) : null,
      dureeRecurrenceMois: data.duree_recurrence_mois || null,
      dureeReprisesMois: data.duree_reprises_mois || 3,
      tauxReprise: Number(data.taux_reprise) || 100,
      typeProduit: data.type_produit || null,
      profilRemuneration: data.profil_remuneration || null,
      societeId: data.societe_id || null,
      canalVente: data.canal_vente || null,
      dateEffet: new Date(data.date_effet),
      dateFin: data.date_fin ? new Date(data.date_fin) : null,
    }) };
  }

  @GrpcMethod('CommissionService', 'GetBareme')
  async getBareme(data: GetByIdRequest) {
    return { bareme: await this.baremeService.findById(data.id) };
  }

  @GrpcMethod('CommissionService', 'GetBaremes')
  async getBaremes(data: GetBaremesRequest) {
    const result = await this.baremeService.findAll(
      {
        organisationId: data.organisation_id,
        typeProduit: data.type_produit,
        actif: data.actif_only,
      },
      toPagination(data),
    );
    return {
      baremes: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('CommissionService', 'GetBaremeApplicable')
  async getBaremeApplicable(data: GetBaremeApplicableRequest) {
    return {
      bareme: await this.baremeService.findApplicable(
        data.organisation_id,
        data.type_produit || '',
        data.date,
      ),
    };
  }

  @GrpcMethod('CommissionService', 'UpdateBareme')
  async updateBareme(data: UpdateBaremeRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.nom) updateData.nom = data.nom;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.actif !== undefined) updateData.actif = data.actif;
    if (data.date_fin !== undefined) updateData.dateFin = data.date_fin ? new Date(data.date_fin) : null;

    return { bareme: await this.baremeService.update(data.id, updateData) };
  }

  @GrpcMethod('CommissionService', 'DeleteBareme')
  async deleteBareme(data: GetByIdRequest) {
    const success = await this.baremeService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // PALIER CRUD (5 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionService', 'CreatePalier')
  async createPalier(data: CreatePalierRequest) {
    return { palier: await this.palierService.create({
      organisationId: data.organisation_id,
      baremeId: data.bareme_id,
      code: data.code,
      nom: data.nom,
      description: data.description || null,
      typePalier: data.type_palier as any,
      seuilMin: Number(data.seuil_min),
      seuilMax: data.seuil_max ? Number(data.seuil_max) : null,
      montantPrime: Number(data.montant_prime),
      tauxBonus: data.taux_bonus ? Number(data.taux_bonus) : null,
      cumulable: data.cumulable || false,
      parPeriode: data.par_periode !== undefined ? data.par_periode : true,
      typeProduit: data.type_produit || null,
      ordre: data.ordre || 0,
      actif: true,
    }) };
  }

  @GrpcMethod('CommissionService', 'GetPalier')
  async getPalier(data: GetByIdRequest) {
    return { palier: await this.palierService.findById(data.id) };
  }

  @GrpcMethod('CommissionService', 'GetPaliersByBareme')
  async getPaliersByBareme(data: GetByBaremeRequest) {
    const paliers = await this.palierService.findByBareme(data.bareme_id);
    return { paliers };
  }

  @GrpcMethod('CommissionService', 'UpdatePalier')
  async updatePalier(data: UpdatePalierRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.nom) updateData.nom = data.nom;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.seuil_min !== undefined) updateData.seuilMin = Number(data.seuil_min);
    if (data.seuil_max !== undefined) updateData.seuilMax = data.seuil_max ? Number(data.seuil_max) : null;
    if (data.montant_prime !== undefined) updateData.montantPrime = Number(data.montant_prime);
    if (data.taux_bonus !== undefined) updateData.tauxBonus = data.taux_bonus ? Number(data.taux_bonus) : null;
    if (data.cumulable !== undefined) updateData.cumulable = data.cumulable;
    if (data.ordre !== undefined) updateData.ordre = data.ordre;
    if (data.actif !== undefined) updateData.actif = data.actif;

    return { palier: await this.palierService.update(data.id, updateData) };
  }

  @GrpcMethod('CommissionService', 'DeletePalier')
  async deletePalier(data: GetByIdRequest) {
    const success = await this.palierService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // BORDEREAU CRUD (8 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionService', 'CreateBordereau')
  async createBordereau(data: CreateBordereauRequest) {
    return { bordereau: await this.bordereauService.create({
      organisationId: data.organisation_id,
      reference: data.reference,
      periode: data.periode,
      apporteurId: data.apporteur_id,
      commentaire: data.commentaire || null,
      creePar: data.cree_par || null,
    }) };
  }

  @GrpcMethod('CommissionService', 'GetBordereau')
  async getBordereau(data: GetByIdRequest) {
    return { bordereau: await this.bordereauService.findById(data.id) };
  }

  @GrpcMethod('CommissionService', 'GetBordereaux')
  async getBordereaux(data: GetBordereauxRequest) {
    const result = await this.bordereauService.findAll(
      {
        organisationId: data.organisation_id,
        apporteurId: data.apporteur_id,
        periode: data.periode,
        statutBordereau: data.statut as any,
      },
      toPagination(data),
    );
    return {
      bordereaux: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('CommissionService', 'GetBordereauByApporteurPeriode')
  async getBordereauByApporteurPeriode(data: GetBordereauByApporteurPeriodeRequest) {
    return {
      bordereau: await this.bordereauService.findByApporteurPeriode(
        data.organisation_id,
        data.apporteur_id,
        data.periode,
      ),
    };
  }

  @GrpcMethod('CommissionService', 'UpdateBordereau')
  async updateBordereau(data: UpdateBordereauRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.statut_bordereau) updateData.statutBordereau = data.statut_bordereau;
    if (data.commentaire !== undefined) updateData.commentaire = data.commentaire || null;

    return { bordereau: await this.bordereauService.update(data.id, updateData) };
  }

  @GrpcMethod('CommissionService', 'ValidateBordereau')
  async validateBordereau(data: ValidateBordereauRequest) {
    return {
      bordereau: await this.bordereauService.validate(data.id, data.validateur_id),
    };
  }

  @GrpcMethod('CommissionService', 'ExportBordereau')
  async exportBordereau(data: GetByIdRequest) {
    const bordereau = await this.bordereauService.findById(data.id);
    // Mark as exported
    await this.bordereauService.update(data.id, {
      statutBordereau: 'exporte' as any,
      dateExport: new Date(),
    } as any);
    return {
      bordereau_id: bordereau.id,
      format: 'pdf',
      url: bordereau.fichierPdfUrl || '',
    };
  }

  @GrpcMethod('CommissionService', 'ExportBordereauFiles')
  async exportBordereauFiles(data: ExportBordereauRequest) {
    const bordereau = await this.bordereauService.findById(data.bordereau_id);
    if (bordereau.organisationId !== data.organisation_id) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Bordereau non accessible pour cette organisation',
      });
    }

    try {
      const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
      const pdfBuffer = await this.bordereauExportService.genererPDF(bordereau, lignes);
      const excelBuffer = await this.bordereauExportService.genererExcel(bordereau, lignes);
      const hashSha256 = this.bordereauExportService.calculerHashSHA256(pdfBuffer);

      const [annee] = String(bordereau.periode || '').split('-');
      const storage = await this.bordereauFileStorageService.sauvegarderExports({
        societe: data.organisation_id,
        annee: annee || 'na',
        referenceBordereau: bordereau.reference,
        pdfBuffer,
        excelBuffer,
      });

      await this.bordereauService.update(data.bordereau_id, {
        statutBordereau: StatutBordereau.EXPORTE,
        dateExport: new Date(),
        fichierPdfUrl: storage.pdfUrl,
        fichierExcelUrl: storage.excelUrl,
        hashSha256,
      });

      return {
        success: true,
        pdf_url: storage.pdfUrl,
        excel_url: storage.excelUrl,
        hash_sha256: hashSha256,
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Echec export bordereau',
      });
    }
  }

  @GrpcMethod('CommissionService', 'DeleteBordereau')
  async deleteBordereau(data: GetByIdRequest) {
    const success = await this.bordereauService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // LIGNE BORDEREAU CRUD (6 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionService', 'CreateLigneBordereau')
  async createLigneBordereau(data: CreateLigneBordereauRequest) {
    return { ligne: await this.ligneBordereauService.create({
      organisationId: data.organisation_id,
      bordereauId: data.bordereau_id,
      commissionId: data.commission_id || null,
      repriseId: data.reprise_id || null,
      typeLigne: data.type_ligne as any,
      contratId: data.contrat_id,
      contratReference: data.contrat_reference,
      clientNom: data.client_nom || null,
      produitNom: data.produit_nom || null,
      montantBrut: Number(data.montant_brut),
      montantReprise: Number(data.montant_reprise) || 0,
      montantNet: Number(data.montant_net),
      baseCalcul: data.base_calcul || null,
      tauxApplique: data.taux_applique ? Number(data.taux_applique) : null,
      baremeId: data.bareme_id || null,
      ordre: data.ordre || 0,
    }) };
  }

  @GrpcMethod('CommissionService', 'GetLigneBordereau')
  async getLigneBordereau(data: GetByIdRequest) {
    return { ligne: await this.ligneBordereauService.findById(data.id) };
  }

  @GrpcMethod('CommissionService', 'GetLignesByBordereau')
  async getLignesByBordereau(data: GetByBordereauRequest) {
    const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
    return { lignes };
  }

  @GrpcMethod('CommissionService', 'UpdateLigneBordereau')
  async updateLigneBordereau(data: UpdateLigneBordereauRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.montant_brut !== undefined) updateData.montantBrut = Number(data.montant_brut);
    if (data.montant_reprise !== undefined) updateData.montantReprise = Number(data.montant_reprise);
    if (data.montant_net !== undefined) updateData.montantNet = Number(data.montant_net);
    if (data.selectionne !== undefined) updateData.selectionne = data.selectionne;
    if (data.motif_deselection !== undefined) updateData.motifDeselection = data.motif_deselection || null;

    return { ligne: await this.ligneBordereauService.update(data.id, updateData) };
  }

  @GrpcMethod('CommissionService', 'ValidateLigne')
  async validateLigne(data: ValidateLigneRequest) {
    return {
      ligne: await this.ligneBordereauService.validate(data.id, data.validateur_id),
    };
  }

  @GrpcMethod('CommissionService', 'DeleteLigneBordereau')
  async deleteLigneBordereau(data: GetByIdRequest) {
    const success = await this.ligneBordereauService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // REPRISE CRUD (7 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionService', 'CreateReprise')
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

  @GrpcMethod('CommissionService', 'GetReprise')
  async getReprise(data: GetByIdRequest) {
    return { reprise: await this.repriseService.findById(data.id) };
  }

  @GrpcMethod('CommissionService', 'GetReprises')
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

  @GrpcMethod('CommissionService', 'GetReprisesByCommission')
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

  @GrpcMethod('CommissionService', 'ApplyReprise')
  async applyReprise(data: ApplyRepriseRequest) {
    return { reprise: await this.repriseService.apply(data.id) };
  }

  @GrpcMethod('CommissionService', 'CancelReprise')
  async cancelReprise(data: GetByIdRequest) {
    return { reprise: await this.repriseService.cancel(data.id) };
  }

  @GrpcMethod('CommissionService', 'DeleteReprise')
  async deleteReprise(data: GetByIdRequest) {
    const success = await this.repriseService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // STATUT COMMISSION CRUD (6 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionService', 'CreateStatut')
  async createStatut(data: CreateStatutRequest) {
    return { statut: await this.statutService.create({
      code: data.code,
      nom: data.nom,
      description: data.description || null,
      ordreAffichage: data.ordre_affichage || 0,
    }) };
  }

  @GrpcMethod('CommissionService', 'GetStatut')
  async getStatut(data: GetByIdRequest) {
    return { statut: await this.statutService.findById(data.id) };
  }

  @GrpcMethod('CommissionService', 'GetStatuts')
  async getStatuts(data: GetStatutsRequest) {
    const result = await this.statutService.findAll(toPagination(data));
    return {
      statuts: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('CommissionService', 'GetStatutByCode')
  async getStatutByCode(data: GetStatutByCodeRequest) {
    return { statut: await this.statutService.findByCode(data.code) };
  }

  @GrpcMethod('CommissionService', 'UpdateStatut')
  async updateStatut(data: UpdateStatutRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.nom) updateData.nom = data.nom;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.ordre_affichage !== undefined) updateData.ordreAffichage = data.ordre_affichage;

    return { statut: await this.statutService.update(data.id, updateData) };
  }

  @GrpcMethod('CommissionService', 'DeleteStatut')
  async deleteStatut(data: GetByIdRequest) {
    const success = await this.statutService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // COMMISSION ENGINE (3 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionService', 'CalculerCommission')
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

  @GrpcMethod('CommissionService', 'GenererBordereau')
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

  @GrpcMethod('CommissionService', 'DeclencherReprise')
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
  // CONTESTATIONS (3 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionService', 'CreerContestation')
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

  @GrpcMethod('CommissionService', 'GetContestations')
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

  @GrpcMethod('CommissionService', 'ResoudreContestation')
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

  // ============================================================================
  // AUDIT LOGS (3 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionService', 'GetAuditLogs')
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

  @GrpcMethod('CommissionService', 'GetAuditLogsByRef')
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

  @GrpcMethod('CommissionService', 'GetAuditLogsByCommission')
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

  @GrpcMethod('CommissionService', 'GetRecurrences')
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

  @GrpcMethod('CommissionService', 'GetRecurrencesByContrat')
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

  // ============================================================================
  // REPORTS NEGATIFS (1 RPC)
  // ============================================================================

  @GrpcMethod('CommissionService', 'GetReportsNegatifs')
  async getReportsNegatifs(data: GetReportsNegatifsRequest) {
    const result = await this.reportNegatifService.findAll(
      {
        organisationId: data.organisation_id,
        apporteurId: data.apporteur_id,
        statutReport: data.statut as any,
      },
      toPagination(data),
    );
    return {
      reports: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('CommissionService', 'PreselectionnerLignes')
  async preselectionnerLignes(data: PreselectionRequest) {
    const bordereau = await this.bordereauService.findById(data.bordereau_id);
    if (bordereau.organisationId !== data.organisation_id) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Bordereau non accessible pour cette organisation',
      });
    }

    const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
    const ligneIdsSelectionnees: string[] = [];

    for (const ligne of lignes) {
      const estEligible = ligne.statutLigne !== StatutLigne.REJETEE;
      if (!estEligible) {
        continue;
      }

      const updated = await this.ligneBordereauService.update(ligne.id, {
        selectionne: true,
        statutLigne: StatutLigne.SELECTIONNEE,
        motifDeselection: null,
      });
      ligneIdsSelectionnees.push(updated.id);
    }

    return {
      nombre_lignes_selectionnees: ligneIdsSelectionnees.length,
      nombre_lignes_total: lignes.length,
      ligne_ids_selectionnees: ligneIdsSelectionnees,
    };
  }

  @GrpcMethod('CommissionService', 'RecalculerTotauxBordereau')
  async recalculerTotauxBordereau(data: RecalculerTotauxRequest) {
    const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
    const selectedSet = new Set(data.ligne_ids_selectionnees || []);
    const selectedLignes = lignes.filter((ligne) => selectedSet.has(ligne.id));

    let totalBrut = 0;
    let totalReprises = 0;
    let totalAcomptes = 0;
    let totalNet = 0;

    for (const ligne of selectedLignes) {
      const brut = Number(ligne.montantBrut) || 0;
      const reprise = Number(ligne.montantReprise) || 0;
      const net = Number(ligne.montantNet) || 0;

      totalBrut += brut;
      totalReprises += reprise;
      totalNet += net;

      if (ligne.typeLigne === TypeLigne.ACOMPTE) {
        totalAcomptes += Math.abs(net);
      }
    }

    return {
      total_brut: toMoneyString(totalBrut),
      total_reprises: toMoneyString(totalReprises),
      total_acomptes: toMoneyString(totalAcomptes),
      total_net: toMoneyString(totalNet),
      nombre_lignes_selectionnees: selectedLignes.length,
    };
  }

  @GrpcMethod('CommissionService', 'ValiderBordereauFinal')
  async validerBordereauFinal(data: ValiderBordereauFinalRequest) {
    const bordereau = await this.bordereauService.findById(data.bordereau_id);
    if (bordereau.statutBordereau !== StatutBordereau.BROUILLON) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Seuls les bordereaux en brouillon peuvent etre valides',
      });
    }

    const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
    const selectedSet = new Set(data.ligne_ids_validees || []);
    const dateValidation = new Date();
    let validatedCount = 0;

    let totalBrut = 0;
    let totalReprises = 0;
    let totalAcomptes = 0;
    let totalNet = 0;

    for (const ligne of lignes) {
      if (selectedSet.has(ligne.id)) {
        validatedCount += 1;
        const brut = Number(ligne.montantBrut) || 0;
        const reprise = Number(ligne.montantReprise) || 0;
        const net = Number(ligne.montantNet) || 0;
        totalBrut += brut;
        totalReprises += reprise;
        totalNet += net;
        if (ligne.typeLigne === TypeLigne.ACOMPTE) {
          totalAcomptes += Math.abs(net);
        }

        await this.ligneBordereauService.update(ligne.id, {
          selectionne: true,
          statutLigne: StatutLigne.VALIDEE,
          validateurId: data.validateur_id,
          dateValidation,
          motifDeselection: null,
        });
      } else {
        await this.ligneBordereauService.update(ligne.id, {
          selectionne: false,
          statutLigne: StatutLigne.DESELECTIONNEE,
        });
      }
    }

    const updatedBordereau = await this.bordereauService.update(data.bordereau_id, {
      statutBordereau: StatutBordereau.VALIDE,
      validateurId: data.validateur_id,
      dateValidation,
      nombreLignes: validatedCount,
      totalBrut,
      totalReprises,
      totalAcomptes,
      totalNetAPayer: totalNet,
    });

    await this.auditLogService.create({
      organisationId: updatedBordereau.organisationId,
      scope: 'bordereau' as any,
      action: 'bordereau_validated' as any,
      refId: updatedBordereau.id,
      userId: data.validateur_id,
      beforeData: {
        statut: bordereau.statutBordereau,
      },
      afterData: {
        statut: updatedBordereau.statutBordereau,
        dateValidation: dateValidation.toISOString(),
        nombreLignes: validatedCount,
      },
      metadata: {
        ligneIdsValidees: Array.from(selectedSet),
      },
    });

    await this.snapshotKpiService.genererSnapshot(
      {
        organisationId: updatedBordereau.organisationId,
        periode: updatedBordereau.periode,
        apporteurId: updatedBordereau.apporteurId,
      },
      'auto',
      data.validateur_id,
    );

    return {
      success: true,
      bordereau: updatedBordereau,
      date_validation: dateValidation.toISOString(),
    };
  }

  @GrpcMethod('CommissionService', 'GetLignesForValidation')
  async getLignesForValidation(data: GetLignesForValidationRequest) {
    const lignes = await this.ligneBordereauService.findByBordereau(data.bordereau_id);
    const filtered = lignes.filter((ligne) => ligne.organisationId === data.organisation_id);

    const total = filtered.length;
    const offset = data.offset || 0;
    const limit = data.limit || total;
    const paginated = filtered.slice(offset, offset + limit);

    const selected = filtered.filter((ligne) => ligne.selectionne);
    let totalBrut = 0;
    let totalReprises = 0;
    let totalAcomptes = 0;
    let totalNet = 0;

    for (const ligne of selected) {
      const brut = Number(ligne.montantBrut) || 0;
      const reprise = Number(ligne.montantReprise) || 0;
      const net = Number(ligne.montantNet) || 0;
      totalBrut += brut;
      totalReprises += reprise;
      totalNet += net;

      if (ligne.typeLigne === TypeLigne.ACOMPTE) {
        totalAcomptes += Math.abs(net);
      }
    }

    return {
      lignes: paginated,
      total,
      totaux: {
        total_brut: toMoneyString(totalBrut),
        total_reprises: toMoneyString(totalReprises),
        total_acomptes: toMoneyString(totalAcomptes),
        total_net: toMoneyString(totalNet),
        nombre_lignes_selectionnees: selected.length,
      },
    };
  }

  @GrpcMethod('CommissionService', 'GetDashboardKpi')
  async getDashboardKpi(data: GetDashboardKpiRequest) {
    const filters = toDashboardFilters(data.filters);
    const result = await this.snapshotKpiService.getDashboardKpi(filters);
    return {
      kpi: {
        periode: result.periode,
        generated_at: result.generatedAt,
        source: result.source,
        total_brut: toMoneyString(result.totalBrut),
        total_net: toMoneyString(result.totalNet),
        total_reprises: toMoneyString(result.totalReprises),
        total_recurrence: toMoneyString(result.totalRecurrence),
        taux_reprise: toMoneyString(result.tauxReprise),
        volume: result.volume,
        delai_validation_moyen_jours: toMoneyString(result.delaiValidationMoyenJours),
        par_produit: result.parProduit.map((item) => ({
          produit_id: item.produitId,
          total_brut: toMoneyString(item.totalBrut),
          total_net: toMoneyString(item.totalNet),
          total_reprises: toMoneyString(item.totalReprises),
          volume: item.volume,
        })),
      },
    };
  }

  @GrpcMethod('CommissionService', 'GenererSnapshotKpi')
  async genererSnapshotKpi(data: GenererSnapshotKpiRequest) {
    const filters = toDashboardFilters(data.filters);
    const payload = await this.snapshotKpiService.genererSnapshot(
      filters,
      'manual',
      data.generated_by || null,
    );
    return {
      success: true,
      kpi: {
        periode: filters.periode || new Date().toISOString().slice(0, 7),
        generated_at: new Date().toISOString(),
        source: 'manual',
        total_brut: toMoneyString(payload.totalBrut),
        total_net: toMoneyString(payload.totalNet),
        total_reprises: toMoneyString(payload.totalReprises),
        total_recurrence: toMoneyString(payload.totalRecurrence),
        taux_reprise: toMoneyString(payload.tauxReprise),
        volume: payload.volume,
        delai_validation_moyen_jours: toMoneyString(payload.delaiValidationMoyenJours),
        par_produit: payload.parProduit.map((item) => ({
          produit_id: item.produitId,
          total_brut: toMoneyString(item.totalBrut),
          total_net: toMoneyString(item.totalNet),
          total_reprises: toMoneyString(item.totalReprises),
          volume: item.volume,
        })),
      },
    };
  }

  @GrpcMethod('CommissionService', 'GetComparatifs')
  async getComparatifs(data: GetComparatifsRequest) {
    const filters = toDashboardFilters(data.filters);
    const comparatifs = await this.snapshotKpiService.getComparatifs(filters);

    const toProto = (input: typeof comparatifs.courant) => ({
      periode: input.periode,
      total_brut: toMoneyString(input.totalBrut),
      total_net: toMoneyString(input.totalNet),
      total_reprises: toMoneyString(input.totalReprises),
      total_recurrence: toMoneyString(input.totalRecurrence),
      taux_reprise: toMoneyString(input.tauxReprise),
      volume: input.volume,
      delai_validation_moyen_jours: toMoneyString(input.delaiValidationMoyenJours),
      variation_brut_pct: toMoneyString(input.variationBrutPct),
    });

    return {
      courant: toProto(comparatifs.courant),
      m1: toProto(comparatifs.m1),
      m3: toProto(comparatifs.m3),
      m12: toProto(comparatifs.m12),
    };
  }

  @GrpcMethod('CommissionService', 'ExportAnalytique')
  async exportAnalytique(data: ExportAnalytiqueRequest) {
    const filters = toDashboardFilters(data.filters);
    const format = data.format === ExportFormatAnalytique.EXPORT_FORMAT_ANALYTIQUE_EXCEL
      ? 'excel'
      : 'csv';

    const result = await this.snapshotKpiService.exportAnalytique({
      ...filters,
      format,
      includeComparatifs: data.include_comparatifs || false,
    });

    return {
      file_name: result.fileName,
      mime_type: result.mimeType,
      content: result.content,
    };
  }
}

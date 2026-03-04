import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CommissionService } from '../../persistence/typeorm/repositories/commercial/commission.service';
import { BaremeService } from '../../persistence/typeorm/repositories/commercial/bareme.service';
import { PalierService } from '../../persistence/typeorm/repositories/commercial/palier.service';
import { StatutCommissionService } from '../../persistence/typeorm/repositories/commercial/statut-commission.service';
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
  CreateStatutRequest,
  GetStatutsRequest,
  GetStatutByCodeRequest,
  UpdateStatutRequest,
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

@Controller()
export class CommissionCrudController {
  constructor(
    private readonly commissionService: CommissionService,
    private readonly baremeService: BaremeService,
    private readonly palierService: PalierService,
    private readonly statutService: StatutCommissionService,
  ) {}

  // ============================================================================
  // COMMISSION CRUD (7 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionCrudService', 'CreateCommission')
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

  @GrpcMethod('CommissionCrudService', 'GetCommission')
  async getCommission(data: GetByIdRequest) {
    return { commission: await this.commissionService.findById(data.id) };
  }

  @GrpcMethod('CommissionCrudService', 'GetCommissions')
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

  @GrpcMethod('CommissionCrudService', 'GetCommissionsByApporteur')
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

  @GrpcMethod('CommissionCrudService', 'GetCommissionsByPeriode')
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

  @GrpcMethod('CommissionCrudService', 'UpdateCommission')
  async updateCommission(data: UpdateCommissionRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.montant_brut !== undefined) updateData.montantBrut = Number(data.montant_brut);
    if (data.montant_reprises !== undefined) updateData.montantReprises = Number(data.montant_reprises);
    if (data.montant_acomptes !== undefined) updateData.montantAcomptes = Number(data.montant_acomptes);
    if (data.montant_net_a_payer !== undefined) updateData.montantNetAPayer = Number(data.montant_net_a_payer);
    if (data.statut_id) updateData.statutId = data.statut_id;

    return { commission: await this.commissionService.update(data.id, updateData) };
  }

  @GrpcMethod('CommissionCrudService', 'DeleteCommission')
  async deleteCommission(data: GetByIdRequest) {
    const success = await this.commissionService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // BAREME CRUD (6 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionCrudService', 'CreateBareme')
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

  @GrpcMethod('CommissionCrudService', 'GetBareme')
  async getBareme(data: GetByIdRequest) {
    return { bareme: await this.baremeService.findById(data.id) };
  }

  @GrpcMethod('CommissionCrudService', 'GetBaremes')
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

  @GrpcMethod('CommissionCrudService', 'GetBaremeApplicable')
  async getBaremeApplicable(data: GetBaremeApplicableRequest) {
    return {
      bareme: await this.baremeService.findApplicable(
        data.organisation_id,
        data.type_produit || '',
        data.date,
      ),
    };
  }

  @GrpcMethod('CommissionCrudService', 'UpdateBareme')
  async updateBareme(data: UpdateBaremeRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.nom) updateData.nom = data.nom;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.actif !== undefined) updateData.actif = data.actif;
    if (data.date_fin !== undefined) updateData.dateFin = data.date_fin ? new Date(data.date_fin) : null;

    return { bareme: await this.baremeService.update(data.id, updateData) };
  }

  @GrpcMethod('CommissionCrudService', 'DeleteBareme')
  async deleteBareme(data: GetByIdRequest) {
    const success = await this.baremeService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // PALIER CRUD (5 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionCrudService', 'CreatePalier')
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

  @GrpcMethod('CommissionCrudService', 'GetPalier')
  async getPalier(data: GetByIdRequest) {
    return { palier: await this.palierService.findById(data.id) };
  }

  @GrpcMethod('CommissionCrudService', 'GetPaliersByBareme')
  async getPaliersByBareme(data: GetByBaremeRequest) {
    const paliers = await this.palierService.findByBareme(data.bareme_id);
    return { paliers };
  }

  @GrpcMethod('CommissionCrudService', 'UpdatePalier')
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

  @GrpcMethod('CommissionCrudService', 'DeletePalier')
  async deletePalier(data: GetByIdRequest) {
    const success = await this.palierService.delete(data.id);
    return { success };
  }

  // ============================================================================
  // STATUT COMMISSION CRUD (6 RPCs)
  // ============================================================================

  @GrpcMethod('CommissionCrudService', 'CreateStatut')
  async createStatut(data: CreateStatutRequest) {
    return { statut: await this.statutService.create({
      code: data.code,
      nom: data.nom,
      description: data.description || null,
      ordreAffichage: data.ordre_affichage || 0,
    }) };
  }

  @GrpcMethod('CommissionCrudService', 'GetStatut')
  async getStatut(data: GetByIdRequest) {
    return { statut: await this.statutService.findById(data.id) };
  }

  @GrpcMethod('CommissionCrudService', 'GetStatuts')
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

  @GrpcMethod('CommissionCrudService', 'GetStatutByCode')
  async getStatutByCode(data: GetStatutByCodeRequest) {
    return { statut: await this.statutService.findByCode(data.code) };
  }

  @GrpcMethod('CommissionCrudService', 'UpdateStatut')
  async updateStatut(data: UpdateStatutRequest) {
    const updateData: Record<string, unknown> = {};
    if (data.nom) updateData.nom = data.nom;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.ordre_affichage !== undefined) updateData.ordreAffichage = data.ordre_affichage;

    return { statut: await this.statutService.update(data.id, updateData) };
  }

  @GrpcMethod('CommissionCrudService', 'DeleteStatut')
  async deleteStatut(data: GetByIdRequest) {
    const success = await this.statutService.delete(data.id);
    return { success };
  }
}

import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ApporteurService } from './modules/apporteur/apporteur.service';
import { BaremeCommissionService } from './modules/bareme-commission/bareme-commission.service';
import { PalierCommissionService } from './modules/palier-commission/palier-commission.service';
import { ModeleDistributionService } from './modules/modele-distribution/modele-distribution.service';
import type {
  Apporteur,
  CreateApporteurRequest,
  UpdateApporteurRequest,
  GetApporteurRequest,
  GetApporteurByUtilisateurRequest,
  ListApporteurRequest,
  ListApporteurByOrganisationRequest,
  ActivateApporteurRequest,
  DeleteApporteurRequest,
  ListApporteurResponse,
  BaremeCommission,
  BaremeCommissionWithPaliers,
  CreateBaremeCommissionRequest,
  UpdateBaremeCommissionRequest,
  GetBaremeCommissionRequest,
  GetBaremeCommissionByCodeRequest,
  ListBaremeCommissionRequest,
  ListBaremeByOrganisationRequest,
  ListBaremeActifsRequest,
  GetBaremeWithPaliersRequest,
  ActivateBaremeRequest,
  DeleteBaremeCommissionRequest,
  ListBaremeCommissionResponse,
  PalierCommission,
  CreatePalierCommissionRequest,
  UpdatePalierCommissionRequest,
  GetPalierCommissionRequest,
  ListPalierByBaremeRequest,
  ActivatePalierRequest,
  DeletePalierCommissionRequest,
  ListPalierCommissionResponse,
  ModeleDistribution,
  CreateModeleDistributionRequest,
  UpdateModeleDistributionRequest,
  GetModeleDistributionRequest,
  GetModeleDistributionByCodeRequest,
  ListModeleDistributionRequest,
  DeleteModeleDistributionRequest,
  ListModeleDistributionResponse,
  DeleteResponse,
} from '@proto/commerciaux/commerciaux';

@Controller()
export class CommerciauxController {
  constructor(
    private readonly apporteurService: ApporteurService,
    private readonly baremeCommissionService: BaremeCommissionService,
    private readonly palierCommissionService: PalierCommissionService,
    private readonly modeleDistributionService: ModeleDistributionService,
  ) {}

  @GrpcMethod('ApporteurService', 'Create')
  async createApporteur(data: CreateApporteurRequest): Promise<Apporteur> {
    const apporteur = await this.apporteurService.create({
      ...data,
      societeId: data.societeId || null,
    });
    return this.mapApporteur(apporteur);
  }

  @GrpcMethod('ApporteurService', 'Update')
  async updateApporteur(data: UpdateApporteurRequest): Promise<Apporteur> {
    const { id, ...updateData } = data;
    const apporteur = await this.apporteurService.update(id, {
      ...updateData,
      societeId: updateData.societeId === '' ? null : updateData.societeId,
    });
    return this.mapApporteur(apporteur);
  }

  @GrpcMethod('ApporteurService', 'Get')
  async getApporteur(data: GetApporteurRequest): Promise<Apporteur> {
    const apporteur = await this.apporteurService.findById(data.id);
    return this.mapApporteur(apporteur);
  }

  @GrpcMethod('ApporteurService', 'GetByUtilisateur')
  async getApporteurByUtilisateur(data: GetApporteurByUtilisateurRequest): Promise<Apporteur> {
    const apporteur = await this.apporteurService.findByUtilisateur(data.utilisateurId);
    return this.mapApporteur(apporteur);
  }

  @GrpcMethod('ApporteurService', 'List')
  async listApporteur(data: ListApporteurRequest): Promise<ListApporteurResponse> {
    const result = await this.apporteurService.findAll(
      { search: data.search, typeApporteur: data.typeApporteur, actif: data.actif },
      data.pagination,
    );
    return {
      apporteurs: result.data.map((a) => this.mapApporteur(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ApporteurService', 'ListByOrganisation')
  async listApporteurByOrganisation(data: ListApporteurByOrganisationRequest): Promise<ListApporteurResponse> {
    const result = await this.apporteurService.findByOrganisation(
      data.organisationId,
      data.actif,
      data.pagination,
    );
    return {
      apporteurs: result.data.map((a) => this.mapApporteur(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ApporteurService', 'Activer')
  async activerApporteur(data: ActivateApporteurRequest): Promise<Apporteur> {
    const apporteur = await this.apporteurService.activer(data.id);
    return this.mapApporteur(apporteur);
  }

  @GrpcMethod('ApporteurService', 'Desactiver')
  async desactiverApporteur(data: ActivateApporteurRequest): Promise<Apporteur> {
    const apporteur = await this.apporteurService.desactiver(data.id);
    return this.mapApporteur(apporteur);
  }

  @GrpcMethod('ApporteurService', 'Delete')
  async deleteApporteur(data: DeleteApporteurRequest): Promise<DeleteResponse> {
    const success = await this.apporteurService.delete(data.id);
    return { success };
  }

  @GrpcMethod('BaremeCommissionService', 'Create')
  async createBaremeCommission(data: CreateBaremeCommissionRequest): Promise<BaremeCommission> {
    const { dateEffet, dateFin, ...rest } = data;
    const bareme = await this.baremeCommissionService.create({
      ...rest,
      dateEffet: dateEffet ? new Date(dateEffet) : new Date(),
      dateFin: dateFin ? new Date(dateFin) : undefined,
    });
    return this.mapBaremeCommission(bareme);
  }

  @GrpcMethod('BaremeCommissionService', 'Update')
  async updateBaremeCommission(data: UpdateBaremeCommissionRequest): Promise<BaremeCommission> {
    const { id, dateEffet, dateFin, ...rest } = data;
    const bareme = await this.baremeCommissionService.update(id, {
      ...rest,
      dateEffet: dateEffet ? new Date(dateEffet) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
    });
    return this.mapBaremeCommission(bareme);
  }

  @GrpcMethod('BaremeCommissionService', 'Get')
  async getBaremeCommission(data: GetBaremeCommissionRequest): Promise<BaremeCommission> {
    const bareme = await this.baremeCommissionService.findById(data.id);
    return this.mapBaremeCommission(bareme);
  }

  @GrpcMethod('BaremeCommissionService', 'GetByCode')
  async getBaremeCommissionByCode(data: GetBaremeCommissionByCodeRequest): Promise<BaremeCommission> {
    const bareme = await this.baremeCommissionService.findByCode(data.code);
    return this.mapBaremeCommission(bareme);
  }

  @GrpcMethod('BaremeCommissionService', 'List')
  async listBaremeCommission(data: ListBaremeCommissionRequest): Promise<ListBaremeCommissionResponse> {
    const result = await this.baremeCommissionService.findAll(
      { search: data.search, typeCalcul: data.typeCalcul, canalVente: data.canalVente, actif: data.actif },
      data.pagination,
    );
    return {
      baremes: result.data.map((b) => this.mapBaremeCommission(b)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BaremeCommissionService', 'ListByOrganisation')
  async listBaremeByOrganisation(data: ListBaremeByOrganisationRequest): Promise<ListBaremeCommissionResponse> {
    const result = await this.baremeCommissionService.findByOrganisation(
      data.organisationId,
      data.actif,
      data.pagination,
    );
    return {
      baremes: result.data.map((b) => this.mapBaremeCommission(b)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BaremeCommissionService', 'ListActifs')
  async listBaremeActifs(data: ListBaremeActifsRequest): Promise<ListBaremeCommissionResponse> {
    const date = data.date ? new Date(data.date) : new Date();
    const result = await this.baremeCommissionService.findActifs(
      data.organisationId,
      date,
      data.pagination,
    );
    return {
      baremes: result.data.map((b) => this.mapBaremeCommission(b)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('BaremeCommissionService', 'GetWithPaliers')
  async getBaremeWithPaliers(data: GetBaremeWithPaliersRequest): Promise<BaremeCommissionWithPaliers> {
    const bareme = await this.baremeCommissionService.findWithPaliers(data.id);
    return {
      bareme: this.mapBaremeCommission(bareme),
      paliers: bareme.paliers?.map((p) => this.mapPalierCommission(p)) || [],
    };
  }

  @GrpcMethod('BaremeCommissionService', 'Activer')
  async activerBareme(data: ActivateBaremeRequest): Promise<BaremeCommission> {
    const bareme = await this.baremeCommissionService.activer(data.id);
    return this.mapBaremeCommission(bareme);
  }

  @GrpcMethod('BaremeCommissionService', 'Desactiver')
  async desactiverBareme(data: ActivateBaremeRequest): Promise<BaremeCommission> {
    const bareme = await this.baremeCommissionService.desactiver(data.id);
    return this.mapBaremeCommission(bareme);
  }

  @GrpcMethod('BaremeCommissionService', 'Delete')
  async deleteBaremeCommission(data: DeleteBaremeCommissionRequest): Promise<DeleteResponse> {
    const success = await this.baremeCommissionService.delete(data.id);
    return { success };
  }

  @GrpcMethod('PalierCommissionService', 'Create')
  async createPalierCommission(data: CreatePalierCommissionRequest): Promise<PalierCommission> {
    const palier = await this.palierCommissionService.create(data);
    return this.mapPalierCommission(palier);
  }

  @GrpcMethod('PalierCommissionService', 'Update')
  async updatePalierCommission(data: UpdatePalierCommissionRequest): Promise<PalierCommission> {
    const { id, ...updateData } = data;
    const palier = await this.palierCommissionService.update(id, updateData);
    return this.mapPalierCommission(palier);
  }

  @GrpcMethod('PalierCommissionService', 'Get')
  async getPalierCommission(data: GetPalierCommissionRequest): Promise<PalierCommission> {
    const palier = await this.palierCommissionService.findById(data.id);
    return this.mapPalierCommission(palier);
  }

  @GrpcMethod('PalierCommissionService', 'ListByBareme')
  async listPalierByBareme(data: ListPalierByBaremeRequest): Promise<ListPalierCommissionResponse> {
    const result = await this.palierCommissionService.findByBareme(data.baremeId, data.pagination);
    return {
      paliers: result.data.map((p) => this.mapPalierCommission(p)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('PalierCommissionService', 'Activer')
  async activerPalier(data: ActivatePalierRequest): Promise<PalierCommission> {
    const palier = await this.palierCommissionService.activer(data.id);
    return this.mapPalierCommission(palier);
  }

  @GrpcMethod('PalierCommissionService', 'Desactiver')
  async desactiverPalier(data: ActivatePalierRequest): Promise<PalierCommission> {
    const palier = await this.palierCommissionService.desactiver(data.id);
    return this.mapPalierCommission(palier);
  }

  @GrpcMethod('PalierCommissionService', 'Delete')
  async deletePalierCommission(data: DeletePalierCommissionRequest): Promise<DeleteResponse> {
    const success = await this.palierCommissionService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ModeleDistributionService', 'Create')
  async createModeleDistribution(data: CreateModeleDistributionRequest): Promise<ModeleDistribution> {
    const modele = await this.modeleDistributionService.create(data);
    return this.mapModeleDistribution(modele);
  }

  @GrpcMethod('ModeleDistributionService', 'Update')
  async updateModeleDistribution(data: UpdateModeleDistributionRequest): Promise<ModeleDistribution> {
    const { id, ...updateData } = data;
    const modele = await this.modeleDistributionService.update(id, updateData);
    return this.mapModeleDistribution(modele);
  }

  @GrpcMethod('ModeleDistributionService', 'Get')
  async getModeleDistribution(data: GetModeleDistributionRequest): Promise<ModeleDistribution> {
    const modele = await this.modeleDistributionService.findById(data.id);
    return this.mapModeleDistribution(modele);
  }

  @GrpcMethod('ModeleDistributionService', 'GetByCode')
  async getModeleDistributionByCode(data: GetModeleDistributionByCodeRequest): Promise<ModeleDistribution> {
    const modele = await this.modeleDistributionService.findByCode(data.code);
    return this.mapModeleDistribution(modele);
  }

  @GrpcMethod('ModeleDistributionService', 'List')
  async listModeleDistribution(data: ListModeleDistributionRequest): Promise<ListModeleDistributionResponse> {
    const result = await this.modeleDistributionService.findAll({ search: data.search }, data.pagination);
    return {
      modeles: result.data.map((m) => this.mapModeleDistribution(m)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ModeleDistributionService', 'Delete')
  async deleteModeleDistribution(data: DeleteModeleDistributionRequest): Promise<DeleteResponse> {
    const success = await this.modeleDistributionService.delete(data.id);
    return { success };
  }

  private mapApporteur(apporteur: any): Apporteur {
    return {
      id: apporteur.id,
      organisationId: apporteur.organisationId,
      utilisateurId: apporteur.utilisateurId || '',
      nom: apporteur.nom,
      prenom: apporteur.prenom,
      typeApporteur: apporteur.typeApporteur,
      email: apporteur.email || '',
      telephone: apporteur.telephone || '',
      societeId: apporteur.societeId || '',
      actif: apporteur.actif,
      createdAt: apporteur.createdAt?.toISOString() || '',
      updatedAt: apporteur.updatedAt?.toISOString() || '',
    };
  }

  private mapBaremeCommission(bareme: any): BaremeCommission {
    return {
      id: bareme.id,
      organisationId: bareme.organisationId,
      code: bareme.code,
      nom: bareme.nom,
      description: bareme.description || '',
      typeCalcul: bareme.typeCalcul,
      baseCalcul: bareme.baseCalcul,
      montantFixe: bareme.montantFixe || 0,
      tauxPourcentage: bareme.tauxPourcentage || 0,
      precomptee: bareme.precomptee,
      recurrenceActive: bareme.recurrenceActive,
      tauxRecurrence: bareme.tauxRecurrence || 0,
      dureeRecurrenceMois: bareme.dureeRecurrenceMois || 0,
      dureeReprisesMois: bareme.dureeReprisesMois || 0,
      tauxReprise: bareme.tauxReprise || 0,
      typeProduit: bareme.typeProduit || '',
      profilRemuneration: bareme.profilRemuneration || '',
      societeId: bareme.societeId || '',
      canalVente: bareme.canalVente || '',
      repartitionCommercial: bareme.repartitionCommercial || 0,
      repartitionManager: bareme.repartitionManager || 0,
      repartitionAgence: bareme.repartitionAgence || 0,
      repartitionEntreprise: bareme.repartitionEntreprise || 0,
      version: bareme.version || 1,
      dateEffet: bareme.dateEffet?.toISOString?.() || bareme.dateEffet || '',
      dateFin: bareme.dateFin?.toISOString?.() || '',
      actif: bareme.actif,
      creePar: bareme.creePar || '',
      modifiePar: bareme.modifiePar || '',
      motifModification: bareme.motifModification || '',
      createdAt: bareme.createdAt?.toISOString() || '',
      updatedAt: bareme.updatedAt?.toISOString() || '',
    };
  }

  private mapPalierCommission(palier: any): PalierCommission {
    return {
      id: palier.id,
      organisationId: palier.organisationId,
      baremeId: palier.baremeId,
      code: palier.code,
      nom: palier.nom,
      description: palier.description || '',
      typePalier: palier.typePalier,
      seuilMin: palier.seuilMin || 0,
      seuilMax: palier.seuilMax || 0,
      montantPrime: palier.montantPrime || 0,
      tauxBonus: palier.tauxBonus || 0,
      cumulable: palier.cumulable,
      parPeriode: palier.parPeriode,
      typeProduit: palier.typeProduit || '',
      ordre: palier.ordre || 0,
      actif: palier.actif,
      createdAt: palier.createdAt?.toISOString() || '',
      updatedAt: palier.updatedAt?.toISOString() || '',
    };
  }

  private mapModeleDistribution(modele: any): ModeleDistribution {
    return {
      id: modele.id,
      code: modele.code,
      nom: modele.nom,
      description: modele.description || '',
      createdAt: modele.createdAt?.toISOString() || '',
      updatedAt: modele.updatedAt?.toISOString() || '',
    };
  }
}

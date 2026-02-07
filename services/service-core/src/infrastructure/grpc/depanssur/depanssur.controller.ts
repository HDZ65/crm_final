import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AbonnementService } from '../../persistence/typeorm/repositories/depanssur/abonnement.service';
import { OptionAbonnementService } from '../../persistence/typeorm/repositories/depanssur/option-abonnement.service';
import { CompteurPlafondService } from '../../persistence/typeorm/repositories/depanssur/compteur-plafond.service';
import { DossierDeclaratifService } from '../../persistence/typeorm/repositories/depanssur/dossier-declaratif.service';
import type {
  CreateAbonnementRequest,
  UpdateAbonnementRequest,
  GetAbonnementRequest,
  GetAbonnementByClientRequest,
  ListAbonnementsRequest,
  CreateDossierRequest,
  UpdateDossierRequest,
  GetDossierRequest,
  GetDossierByReferenceRequest,
  ListDossiersRequest,
  DeleteDossierRequest,
  CreateOptionRequest,
  UpdateOptionRequest,
  GetOptionRequest,
  ListOptionsRequest,
  DeleteOptionRequest,
  GetCompteurRequest,
  UpdateCompteurRequest,
  ResetCompteurRequest,
  ListCompteursRequest,
} from '@proto/depanssur';

// Statut enum mapping (proto enum int → string)
const STATUT_ABONNEMENT_MAP: Record<number, string> = {
  0: 'UNSPECIFIED',
  1: 'ACTIF',
  2: 'PAUSE',
  3: 'SUSPENDU_IMPAYE',
  4: 'RESILIE',
};

function mapStatutFromProto(statut: number | string | undefined): string | undefined {
  if (statut === undefined || statut === null) return undefined;
  if (typeof statut === 'string') return statut;
  return STATUT_ABONNEMENT_MAP[statut] || undefined;
}

function entityToAbonnementResponse(entity: any) {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    client_id: entity.clientId,
    plan_type: entity.planType,
    periodicite: entity.periodicite,
    periode_attente: entity.periodeAttente,
    franchise: entity.franchise ? Number(entity.franchise) : undefined,
    plafond_par_intervention: entity.plafondParIntervention ? Number(entity.plafondParIntervention) : undefined,
    plafond_annuel: entity.plafondAnnuel ? Number(entity.plafondAnnuel) : undefined,
    nb_interventions_max: entity.nbInterventionsMax ?? undefined,
    statut: entity.statut,
    motif_resiliation: entity.motifResiliation ?? undefined,
    date_souscription: entity.dateSouscription instanceof Date ? entity.dateSouscription.toISOString() : entity.dateSouscription,
    date_effet: entity.dateEffet instanceof Date ? entity.dateEffet.toISOString() : entity.dateEffet,
    date_fin: entity.dateFin instanceof Date ? entity.dateFin.toISOString() : entity.dateFin ?? undefined,
    prochaine_echeance: entity.prochaineEcheance instanceof Date ? entity.prochaineEcheance.toISOString() : entity.prochaineEcheance,
    prix_ttc: Number(entity.prixTtc),
    taux_tva: Number(entity.tauxTva),
    montant_ht: Number(entity.montantHt),
    code_remise: entity.codeRemise ?? undefined,
    montant_remise: entity.montantRemise ? Number(entity.montantRemise) : undefined,
    created_at: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
    updated_at: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
  };
}

function entityToOptionResponse(entity: any) {
  return {
    id: entity.id,
    abonnement_id: entity.abonnementId,
    type: entity.type,
    label: entity.label,
    prix_ttc: Number(entity.prixTtc),
    actif: entity.actif,
    created_at: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
    updated_at: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
  };
}

const STATUT_DOSSIER_MAP: Record<number, string> = {
  0: 'UNSPECIFIED',
  1: 'ENREGISTRE',
  2: 'EN_ANALYSE',
  3: 'ACCEPTE',
  4: 'REFUSE',
  5: 'CLOTURE',
};

const TYPE_DOSSIER_MAP: Record<number, string> = {
  0: 'UNSPECIFIED',
  1: 'ELECTRICITE',
  2: 'PLOMBERIE',
  3: 'ELECTROMENAGER',
  4: 'SERRURERIE',
  5: 'AUTRE',
};

function mapStatutDossierFromProto(statut: number | string | undefined): string | undefined {
  if (statut === undefined || statut === null) return undefined;
  if (typeof statut === 'string') return statut;
  return STATUT_DOSSIER_MAP[statut] || undefined;
}

function mapTypeDossierFromProto(type: number | string | undefined): string | undefined {
  if (type === undefined || type === null) return undefined;
  if (typeof type === 'string') return type;
  return TYPE_DOSSIER_MAP[type] || undefined;
}

function entityToDossierResponse(entity: any) {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    abonnement_id: entity.abonnementId,
    client_id: entity.clientId,
    reference_externe: entity.referenceExterne,
    date_ouverture: entity.dateOuverture instanceof Date ? entity.dateOuverture.toISOString() : entity.dateOuverture,
    type: entity.type,
    statut: entity.statut,
    adresse_risque_id: entity.adresseRisqueId ?? undefined,
    montant_estimatif: entity.montantEstimatif != null ? Number(entity.montantEstimatif) : undefined,
    prise_en_charge: entity.priseEnCharge ?? undefined,
    franchise_appliquee: entity.franchiseAppliquee != null ? Number(entity.franchiseAppliquee) : undefined,
    reste_a_charge: entity.resteACharge != null ? Number(entity.resteACharge) : undefined,
    montant_pris_en_charge: entity.montantPrisEnCharge != null ? Number(entity.montantPrisEnCharge) : undefined,
    nps_score: entity.npsScore ?? undefined,
    nps_commentaire: entity.npsCommentaire ?? undefined,
    date_cloture: entity.dateCloture instanceof Date ? entity.dateCloture.toISOString() : entity.dateCloture ?? undefined,
    created_at: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
    updated_at: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
  };
}

function entityToCompteurResponse(entity: any) {
  return {
    id: entity.id,
    abonnement_id: entity.abonnementId,
    annee_glissante_debut: entity.anneeGlissanteDebut instanceof Date ? entity.anneeGlissanteDebut.toISOString() : entity.anneeGlissanteDebut,
    annee_glissante_fin: entity.anneeGlissanteFin instanceof Date ? entity.anneeGlissanteFin.toISOString() : entity.anneeGlissanteFin,
    nb_interventions_utilisees: entity.nbInterventionsUtilisees,
    montant_cumule: Number(entity.montantCumule),
    created_at: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
    updated_at: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
  };
}

@Controller()
export class DepanssurController {
  constructor(
    private readonly abonnementService: AbonnementService,
    private readonly optionService: OptionAbonnementService,
    private readonly compteurService: CompteurPlafondService,
    private readonly dossierService: DossierDeclaratifService,
  ) {}

  // ---- Abonnement CRUD ----

  @GrpcMethod('DepanssurService', 'CreateAbonnement')
  async createAbonnement(data: CreateAbonnementRequest) {
    const entity = await this.abonnementService.create(data);
    return entityToAbonnementResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'GetAbonnement')
  async getAbonnement(data: GetAbonnementRequest) {
    const entity = await this.abonnementService.findById(data.id);
    if (!entity) {
      const { RpcException } = await import('@nestjs/microservices');
      const { status } = await import('@grpc/grpc-js');
      throw new RpcException({ code: status.NOT_FOUND, message: `Abonnement ${data.id} not found` });
    }
    return entityToAbonnementResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'GetAbonnementByClient')
  async getAbonnementByClient(data: GetAbonnementByClientRequest) {
    const entity = await this.abonnementService.findByClientId(data.organisation_id, data.client_id);
    if (!entity) {
      const { RpcException } = await import('@nestjs/microservices');
      const { status } = await import('@grpc/grpc-js');
      throw new RpcException({ code: status.NOT_FOUND, message: `No abonnement found for client ${data.client_id}` });
    }
    return entityToAbonnementResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'UpdateAbonnement')
  async updateAbonnement(data: UpdateAbonnementRequest) {
    // Map proto statut enum to string if needed
    const input: any = { ...data };
    if (data.statut !== undefined) {
      input.statut = mapStatutFromProto(data.statut);
    }
    const entity = await this.abonnementService.update(input);
    return entityToAbonnementResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'ListAbonnements')
  async listAbonnements(data: ListAbonnementsRequest) {
    const statutStr = data.statut !== undefined ? mapStatutFromProto(data.statut) : undefined;
    const result = await this.abonnementService.findAll(
      data.organisation_id,
      {
        clientId: data.client_id,
        statut: statutStr,
        planType: data.plan_type,
        search: data.search,
      },
      data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    );
    return {
      abonnements: result.abonnements.map(entityToAbonnementResponse),
      pagination: result.pagination,
    };
  }

  // ---- Dossier Declaratif CRUD ----

  @GrpcMethod('DepanssurService', 'CreateDossier')
  async createDossier(data: CreateDossierRequest) {
    const input: any = { ...data };
    if (data.type !== undefined) {
      input.type = mapTypeDossierFromProto(data.type);
    }
    const entity = await this.dossierService.create(input);
    return entityToDossierResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'GetDossier')
  async getDossier(data: GetDossierRequest) {
    const entity = await this.dossierService.findById(data.id);
    if (!entity) {
      const { RpcException } = await import('@nestjs/microservices');
      const { status } = await import('@grpc/grpc-js');
      throw new RpcException({ code: status.NOT_FOUND, message: `Dossier ${data.id} not found` });
    }
    return entityToDossierResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'GetDossierByReference')
  async getDossierByReference(data: GetDossierByReferenceRequest) {
    const entity = await this.dossierService.findByReferenceExterne(data.organisation_id, data.reference_externe);
    if (!entity) {
      const { RpcException } = await import('@nestjs/microservices');
      const { status } = await import('@grpc/grpc-js');
      throw new RpcException({ code: status.NOT_FOUND, message: `Dossier with ref ${data.reference_externe} not found` });
    }
    return entityToDossierResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'UpdateDossier')
  async updateDossier(data: UpdateDossierRequest) {
    const input: any = { ...data };
    if (data.statut !== undefined) {
      input.statut = mapStatutDossierFromProto(data.statut);
    }
    const entity = await this.dossierService.update(input);
    return entityToDossierResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'ListDossiers')
  async listDossiers(data: ListDossiersRequest) {
    const statutStr = data.statut !== undefined ? mapStatutDossierFromProto(data.statut) : undefined;
    const typeStr = data.type !== undefined ? mapTypeDossierFromProto(data.type) : undefined;
    const result = await this.dossierService.findAll(
      data.organisation_id,
      {
        abonnementId: data.abonnement_id,
        clientId: data.client_id,
        type: typeStr,
        statut: statutStr,
        search: data.search,
      },
      data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    );
    return {
      dossiers: result.dossiers.map(entityToDossierResponse),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('DepanssurService', 'DeleteDossier')
  async deleteDossier(data: DeleteDossierRequest) {
    await this.dossierService.delete(data.id);
    return { success: true };
  }

  // ---- Option Abonnement CRUD ----

  @GrpcMethod('DepanssurService', 'CreateOption')
  async createOption(data: CreateOptionRequest) {
    const entity = await this.optionService.create(data);
    return entityToOptionResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'GetOption')
  async getOption(data: GetOptionRequest) {
    const entity = await this.optionService.findById(data.id);
    if (!entity) {
      const { RpcException } = await import('@nestjs/microservices');
      const { status } = await import('@grpc/grpc-js');
      throw new RpcException({ code: status.NOT_FOUND, message: `Option ${data.id} not found` });
    }
    return entityToOptionResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'UpdateOption')
  async updateOption(data: UpdateOptionRequest) {
    const entity = await this.optionService.update(data);
    return entityToOptionResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'ListOptions')
  async listOptions(data: ListOptionsRequest) {
    const result = await this.optionService.findAll(
      data.abonnement_id,
      { actif: data.actif },
      data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    );
    return {
      options: result.options.map(entityToOptionResponse),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('DepanssurService', 'DeleteOption')
  async deleteOption(data: DeleteOptionRequest) {
    await this.optionService.delete(data.id);
    return { success: true };
  }

  // ---- Compteur Plafond ----

  @GrpcMethod('DepanssurService', 'GetCompteur')
  async getCompteur(data: GetCompteurRequest) {
    const entity = await this.compteurService.findCurrentByAbonnementId(data.abonnement_id);
    if (!entity) {
      const { RpcException } = await import('@nestjs/microservices');
      const { status } = await import('@grpc/grpc-js');
      throw new RpcException({ code: status.NOT_FOUND, message: `No current compteur for abonnement ${data.abonnement_id}` });
    }
    return entityToCompteurResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'UpdateCompteur')
  async updateCompteur(data: UpdateCompteurRequest) {
    const entity = await this.compteurService.update(data);
    return entityToCompteurResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'ResetCompteur')
  async resetCompteur(data: ResetCompteurRequest) {
    const entity = await this.compteurService.resetCompteur(
      data.abonnement_id,
      data.annee_glissante_debut,
      data.annee_glissante_fin,
    );
    return entityToCompteurResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'ListCompteurs')
  async listCompteurs(data: ListCompteursRequest) {
    const result = await this.compteurService.findAll(
      data.abonnement_id,
      data.pagination ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        sortBy: data.pagination.sort_by,
        sortOrder: data.pagination.sort_order,
      } : undefined,
    );
    return {
      compteurs: result.compteurs.map(entityToCompteurResponse),
      pagination: result.pagination,
    };
  }
}

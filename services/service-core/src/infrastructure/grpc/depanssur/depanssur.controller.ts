/**
 * Depanssur gRPC Controller
 *
 * Refactored to use unified error system with assertion helpers.
 * No more dynamic imports of RpcException/grpc-js status.
 */
import { Controller, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { assertFound, EnhancedGrpcExceptionFilter } from '@crm/shared-kernel/errors';
import type {
  CreateAbonnementRequest,
  CreateConsentementRequest,
  CreateDossierRequest,
  CreateOptionRequest,
  DeleteConsentementRequest,
  DeleteDossierRequest,
  DeleteOptionRequest,
  GetAbonnementByClientRequest,
  GetAbonnementRequest,
  GetCompteurRequest,
  GetConsentementRequest,
  GetDossierByReferenceRequest,
  GetDossierRequest,
  GetOptionRequest,
  ListAbonnementsRequest,
  ListCompteursRequest,
  ListConsentementsRequest,
  ListDossiersRequest,
  ListOptionsRequest,
  ResetCompteurRequest,
  UpdateAbonnementRequest,
  UpdateCompteurRequest,
  UpdateConsentementRequest,
  UpdateDossierRequest,
  UpdateOptionRequest,
} from '@proto/depanssur';
import { AbonnementService } from '../../persistence/typeorm/repositories/depanssur/abonnement.service';
import { CompteurPlafondService } from '../../persistence/typeorm/repositories/depanssur/compteur-plafond.service';
import { ConsentementService } from '../../persistence/typeorm/repositories/depanssur/consentement.service';
import { DossierDeclaratifService } from '../../persistence/typeorm/repositories/depanssur/dossier-declaratif.service';
import { OptionAbonnementService } from '../../persistence/typeorm/repositories/depanssur/option-abonnement.service';

// ---- Enum Mappings ----

const STATUT_ABONNEMENT_MAP: Record<number, string> = {
  0: 'UNSPECIFIED',
  1: 'ACTIF',
  2: 'PAUSE',
  3: 'SUSPENDU_IMPAYE',
  4: 'RESILIE',
};

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

const TYPE_CONSENTEMENT_MAP: Record<number, string> = {
  0: 'UNSPECIFIED',
  1: 'RGPD_EMAIL',
  2: 'RGPD_SMS',
  3: 'CGS_DEPANSSUR',
};

// ---- Mapping Helpers ----

function mapEnumFromProto(value: number | string | undefined, map: Record<number, string>): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  return map[value];
}

function toIsoString(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  return date instanceof Date ? date.toISOString() : date;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

// ---- Entity to Response Mappers ----
// Note: Using generic parameter to preserve entity type while allowing property access

function entityToAbonnementResponse<T extends object>(entity: T) {
  const e = entity as Record<string, unknown>;
  return {
    id: e.id,
    organisationId: e.keycloakGroupId,
    clientId: e.clientId,
    planType: e.planType,
    periodicite: e.periodicite,
    periodeAttente: e.periodeAttente,
    franchise: toNumber(e.franchise),
    plafondParIntervention: toNumber(e.plafondParIntervention),
    plafondAnnuel: toNumber(e.plafondAnnuel),
    nbInterventionsMax: e.nbInterventionsMax ?? undefined,
    statut: e.statut,
    motifResiliation: e.motifResiliation ?? undefined,
    dateSouscription: toIsoString(e.dateSouscription as Date),
    dateEffet: toIsoString(e.dateEffet as Date),
    dateFin: toIsoString(e.dateFin as Date),
    prochaineEcheance: toIsoString(e.prochaineEcheance as Date),
    prixTtc: Number(e.prixTtc),
    tauxTva: Number(e.tauxTva),
    montantHt: Number(e.montantHt),
    codeRemise: e.codeRemise ?? undefined,
    montantRemise: toNumber(e.montantRemise),
    createdAt: toIsoString(e.createdAt as Date),
    updatedAt: toIsoString(e.updatedAt as Date),
  };
}

function entityToOptionResponse<T extends object>(entity: T) {
  const e = entity as Record<string, unknown>;
  return {
    id: e.id,
    abonnementId: e.abonnementId,
    type: e.type,
    label: e.label,
    prixTtc: Number(e.prixTtc),
    actif: e.actif,
    createdAt: toIsoString(e.createdAt as Date),
    updatedAt: toIsoString(e.updatedAt as Date),
  };
}

function entityToDossierResponse<T extends object>(entity: T) {
  const e = entity as Record<string, unknown>;
  return {
    id: e.id,
    organisationId: e.keycloakGroupId,
    abonnementId: e.abonnementId,
    clientId: e.clientId,
    referenceExterne: e.referenceExterne,
    dateOuverture: toIsoString(e.dateOuverture as Date),
    type: e.type,
    statut: e.statut,
    adresseRisqueId: e.adresseRisqueId ?? undefined,
    montantEstimatif: toNumber(e.montantEstimatif),
    priseEnCharge: e.priseEnCharge ?? undefined,
    franchiseAppliquee: toNumber(e.franchiseAppliquee),
    resteACharge: toNumber(e.resteACharge),
    montantPrisEnCharge: toNumber(e.montantPrisEnCharge),
    npsScore: e.npsScore ?? undefined,
    npsCommentaire: e.npsCommentaire ?? undefined,
    dateCloture: toIsoString(e.dateCloture as Date),
    createdAt: toIsoString(e.createdAt as Date),
    updatedAt: toIsoString(e.updatedAt as Date),
  };
}

function entityToCompteurResponse<T extends object>(entity: T) {
  const e = entity as Record<string, unknown>;
  return {
    id: e.id,
    abonnementId: e.abonnementId,
    anneeGlissanteDebut: toIsoString(e.anneeGlissanteDebut as Date),
    anneeGlissanteFin: toIsoString(e.anneeGlissanteFin as Date),
    nbInterventionsUtilisees: e.nbInterventionsUtilisees,
    montantCumule: Number(e.montantCumule),
    createdAt: toIsoString(e.createdAt as Date),
    updatedAt: toIsoString(e.updatedAt as Date),
  };
}

function entityToConsentementResponse<T extends object>(entity: T) {
  const e = entity as Record<string, unknown>;
  return {
    id: e.id,
    clientId: e.clientBaseId,
    type: e.type,
    accorde: e.accorde,
    dateAccord: toIsoString(e.dateAccord as Date),
    dateRetrait: toIsoString(e.dateRetrait as Date),
    source: e.source ?? undefined,
    createdAt: toIsoString(e.createdAt as Date),
    updatedAt: toIsoString(e.updatedAt as Date),
  };
}

// ---- Controller ----

@Controller()
@UseFilters(EnhancedGrpcExceptionFilter)
export class DepanssurController {
  constructor(
    private readonly abonnementService: AbonnementService,
    private readonly optionService: OptionAbonnementService,
    private readonly compteurService: CompteurPlafondService,
    private readonly dossierService: DossierDeclaratifService,
    private readonly consentementService: ConsentementService,
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
    assertFound(entity, 'Abonnement', data.id);
    return entityToAbonnementResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'GetAbonnementByClient')
  async getAbonnementByClient(data: GetAbonnementByClientRequest) {
    const entity = await this.abonnementService.findByClientId(data.organisationId, data.clientId);
    assertFound(entity, 'Abonnement', { clientId: data.clientId });
    return entityToAbonnementResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'UpdateAbonnement')
  async updateAbonnement(data: UpdateAbonnementRequest) {
    const input: Record<string, unknown> = { ...data };
    if (data.statut !== undefined) {
      input.statut = mapEnumFromProto(data.statut, STATUT_ABONNEMENT_MAP);
    }
    const entity = await this.abonnementService.update(input);
    return entityToAbonnementResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'ListAbonnements')
  async listAbonnements(data: ListAbonnementsRequest) {
    const result = await this.abonnementService.findAll(
      data.organisationId,
      {
        clientId: data.clientId,
        statut: mapEnumFromProto(data.statut, STATUT_ABONNEMENT_MAP),
        planType: data.planType,
        search: data.search,
      },
      data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
    );
    return {
      abonnements: result.abonnements.map(entityToAbonnementResponse),
      pagination: result.pagination,
    };
  }

  // ---- Dossier Declaratif CRUD ----

  @GrpcMethod('DepanssurService', 'CreateDossier')
  async createDossier(data: CreateDossierRequest) {
    const input: Record<string, unknown> = { ...data };
    if (data.type !== undefined) {
      input.type = mapEnumFromProto(data.type, TYPE_DOSSIER_MAP);
    }
    const entity = await this.dossierService.create(input);
    return entityToDossierResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'GetDossier')
  async getDossier(data: GetDossierRequest) {
    const entity = await this.dossierService.findById(data.id);
    assertFound(entity, 'Dossier', data.id);
    return entityToDossierResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'GetDossierByReference')
  async getDossierByReference(data: GetDossierByReferenceRequest) {
    const entity = await this.dossierService.findByReferenceExterne(data.organisationId, data.referenceExterne);
    assertFound(entity, 'Dossier', { referenceExterne: data.referenceExterne });
    return entityToDossierResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'UpdateDossier')
  async updateDossier(data: UpdateDossierRequest) {
    const input: Record<string, unknown> = { ...data };
    if (data.statut !== undefined) {
      input.statut = mapEnumFromProto(data.statut, STATUT_DOSSIER_MAP);
    }
    const entity = await this.dossierService.update(input);
    return entityToDossierResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'ListDossiers')
  async listDossiers(data: ListDossiersRequest) {
    const result = await this.dossierService.findAll(
      data.organisationId,
      {
        abonnementId: data.abonnementId,
        clientId: data.clientId,
        type: mapEnumFromProto(data.type, TYPE_DOSSIER_MAP),
        statut: mapEnumFromProto(data.statut, STATUT_DOSSIER_MAP),
        search: data.search,
      },
      data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
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
    assertFound(entity, 'Option', data.id);
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
      data.abonnementId,
      { actif: data.actif },
      data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
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
    const entity = await this.compteurService.findCurrentByAbonnementId(data.abonnementId);
    assertFound(entity, 'Compteur', { abonnementId: data.abonnementId });
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
      data.abonnementId,
      data.anneeGlissanteDebut,
      data.anneeGlissanteFin,
    );
    return entityToCompteurResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'ListCompteurs')
  async listCompteurs(data: ListCompteursRequest) {
    const result = await this.compteurService.findAll(
      data.abonnementId,
      data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
    );
    return {
      compteurs: result.compteurs.map(entityToCompteurResponse),
      pagination: result.pagination,
    };
  }

  // ---- Consentement RGPD CRUD ----

  @GrpcMethod('DepanssurService', 'CreateConsentement')
  async createConsentement(data: CreateConsentementRequest) {
    const input: Record<string, unknown> = { ...data };
    if (data.type !== undefined) {
      input.type = mapEnumFromProto(data.type, TYPE_CONSENTEMENT_MAP);
    }
    const entity = await this.consentementService.create(input);
    return entityToConsentementResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'GetConsentement')
  async getConsentement(data: GetConsentementRequest) {
    const entity = await this.consentementService.findById(data.id);
    assertFound(entity, 'Consentement', data.id);
    return entityToConsentementResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'UpdateConsentement')
  async updateConsentement(data: UpdateConsentementRequest) {
    const entity = await this.consentementService.update(data.id, data);
    return entityToConsentementResponse(entity);
  }

  @GrpcMethod('DepanssurService', 'ListConsentements')
  async listConsentements(data: ListConsentementsRequest) {
    const result = await this.consentementService.findByClient(
      data.clientId,
      { type: mapEnumFromProto(data.type, TYPE_CONSENTEMENT_MAP) },
      data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
    );
    return {
      consentements: result.consentements.map(entityToConsentementResponse),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('DepanssurService', 'DeleteConsentement')
  async deleteConsentement(data: DeleteConsentementRequest) {
    await this.consentementService.delete(data.id);
    return { success: true };
  }
}

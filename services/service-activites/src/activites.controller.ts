import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TypeActiviteService } from './modules/type-activite/type-activite.service';
import { ActiviteService } from './modules/activite/activite.service';
import { TacheService } from './modules/tache/tache.service';
import { EvenementSuiviService } from './modules/evenement-suivi/evenement-suivi.service';
import { TacheStatut, TacheType, TachePriorite } from './modules/tache/entities/tache.entity';
import type {
  TypeActivite,
  CreateTypeActiviteRequest,
  UpdateTypeActiviteRequest,
  GetTypeActiviteRequest,
  GetTypeActiviteByCodeRequest,
  ListTypeActiviteRequest,
  ListTypeActiviteResponse,
  DeleteTypeActiviteRequest,
  Activite,
  CreateActiviteRequest,
  UpdateActiviteRequest,
  GetActiviteRequest,
  ListActiviteByClientRequest,
  ListActiviteByContratRequest,
  ListActiviteRequest,
  ListActiviteResponse,
  DeleteActiviteRequest,
  Tache,
  TacheStats,
  TacheAlertes,
  CreateTacheRequest,
  UpdateTacheRequest,
  GetTacheRequest,
  ListTacheRequest,
  ListTacheByAssigneRequest,
  ListTacheByClientRequest,
  ListTacheByContratRequest,
  ListTacheByFactureRequest,
  ListTacheEnRetardRequest,
  GetTacheStatsRequest,
  GetTacheAlertesRequest,
  MarquerTacheRequest,
  ListTacheResponse,
  DeleteTacheRequest,
  EvenementSuivi,
  CreateEvenementSuiviRequest,
  UpdateEvenementSuiviRequest,
  GetEvenementSuiviRequest,
  ListEvenementByExpeditionRequest,
  ListEvenementSuiviRequest,
  ListEvenementSuiviResponse,
  DeleteEvenementSuiviRequest,
  DeleteResponse,
} from '@proto/activites/activites';

@Controller()
export class ActivitesController {
  constructor(
    private readonly typeActiviteService: TypeActiviteService,
    private readonly activiteService: ActiviteService,
    private readonly tacheService: TacheService,
    private readonly evenementSuiviService: EvenementSuiviService,
  ) {}

  // ========== TYPE ACTIVITE SERVICE ==========

  @GrpcMethod('TypeActiviteService', 'Create')
  async createTypeActivite(data: CreateTypeActiviteRequest): Promise<TypeActivite> {
    const typeActivite = await this.typeActiviteService.create(data);
    return this.mapTypeActivite(typeActivite);
  }

  @GrpcMethod('TypeActiviteService', 'Update')
  async updateTypeActivite(data: UpdateTypeActiviteRequest): Promise<TypeActivite> {
    const { id, ...updateData } = data;
    const typeActivite = await this.typeActiviteService.update(id, updateData);
    return this.mapTypeActivite(typeActivite);
  }

  @GrpcMethod('TypeActiviteService', 'Get')
  async getTypeActivite(data: GetTypeActiviteRequest): Promise<TypeActivite> {
    const typeActivite = await this.typeActiviteService.findById(data.id);
    return this.mapTypeActivite(typeActivite);
  }

  @GrpcMethod('TypeActiviteService', 'GetByCode')
  async getTypeActiviteByCode(data: GetTypeActiviteByCodeRequest): Promise<TypeActivite> {
    const typeActivite = await this.typeActiviteService.findByCode(data.code);
    return this.mapTypeActivite(typeActivite);
  }

  @GrpcMethod('TypeActiviteService', 'List')
  async listTypeActivite(data: ListTypeActiviteRequest): Promise<ListTypeActiviteResponse> {
    const result = await this.typeActiviteService.findAll(data.pagination);
    return {
      types: result.data.map((t) => this.mapTypeActivite(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TypeActiviteService', 'Delete')
  async deleteTypeActivite(data: DeleteTypeActiviteRequest): Promise<DeleteResponse> {
    const success = await this.typeActiviteService.delete(data.id);
    return { success };
  }

  // ========== ACTIVITE SERVICE ==========

  @GrpcMethod('ActiviteService', 'Create')
  async createActivite(data: CreateActiviteRequest): Promise<Activite> {
    const activite = await this.activiteService.create({
      ...data,
      dateActivite: new Date(data.dateActivite),
      echeance: data.echeance ? new Date(data.echeance) : undefined,
    });
    return this.mapActivite(activite);
  }

  @GrpcMethod('ActiviteService', 'Update')
  async updateActivite(data: UpdateActiviteRequest): Promise<Activite> {
    const { id, dateActivite, echeance, ...rest } = data;
    const activite = await this.activiteService.update(id, {
      ...rest,
      dateActivite: dateActivite ? new Date(dateActivite) : undefined,
      echeance: echeance ? new Date(echeance) : undefined,
    });
    return this.mapActivite(activite);
  }

  @GrpcMethod('ActiviteService', 'Get')
  async getActivite(data: GetActiviteRequest): Promise<Activite> {
    const activite = await this.activiteService.findById(data.id);
    return this.mapActivite(activite);
  }

  @GrpcMethod('ActiviteService', 'ListByClient')
  async listActiviteByClient(data: ListActiviteByClientRequest): Promise<ListActiviteResponse> {
    const result = await this.activiteService.findByClient(data.clientBaseId, data.pagination);
    return {
      activites: result.data.map((a) => this.mapActivite(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ActiviteService', 'ListByContrat')
  async listActiviteByContrat(data: ListActiviteByContratRequest): Promise<ListActiviteResponse> {
    const result = await this.activiteService.findByContrat(data.contratId, data.pagination);
    return {
      activites: result.data.map((a) => this.mapActivite(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ActiviteService', 'List')
  async listActivite(data: ListActiviteRequest): Promise<ListActiviteResponse> {
    const result = await this.activiteService.findAll(
      { search: data.search, typeId: data.typeId },
      data.pagination,
    );
    return {
      activites: result.data.map((a) => this.mapActivite(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ActiviteService', 'Delete')
  async deleteActivite(data: DeleteActiviteRequest): Promise<DeleteResponse> {
    const success = await this.activiteService.delete(data.id);
    return { success };
  }

  // ========== TACHE SERVICE ==========

  @GrpcMethod('TacheService', 'Create')
  async createTache(data: CreateTacheRequest): Promise<Tache> {
    const { dateEcheance, metadata, ...rest } = data;
    const tache = await this.tacheService.create({
      ...rest,
      type: data.type as TacheType,
      priorite: data.priorite as TachePriorite,
      dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
    });
    return this.mapTache(tache);
  }

  @GrpcMethod('TacheService', 'Update')
  async updateTache(data: UpdateTacheRequest): Promise<Tache> {
    const { id, dateEcheance, metadata, ...rest } = data;
    const tache = await this.tacheService.update(id, {
      ...rest,
      type: data.type as TacheType,
      priorite: data.priorite as TachePriorite,
      statut: data.statut as TacheStatut,
      dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
    });
    return this.mapTache(tache);
  }

  @GrpcMethod('TacheService', 'Get')
  async getTache(data: GetTacheRequest): Promise<Tache> {
    const tache = await this.tacheService.findById(data.id);
    return this.mapTache(tache);
  }

  @GrpcMethod('TacheService', 'List')
  async listTache(data: ListTacheRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findAll(
      {
        organisationId: data.organisationId,
        statut: data.statut as TacheStatut,
        type: data.type as TacheType,
        priorite: data.priorite as TachePriorite,
        search: data.search,
        enRetard: data.enRetard,
      },
      data.pagination,
    );
    return {
      taches: result.data.map((t) => this.mapTache(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByAssigne')
  async listTacheByAssigne(data: ListTacheByAssigneRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByAssigne(data.assigneA, data.periode, data.pagination);
    return {
      taches: result.data.map((t) => this.mapTache(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByClient')
  async listTacheByClient(data: ListTacheByClientRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByClient(data.clientId, data.pagination);
    return {
      taches: result.data.map((t) => this.mapTache(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByContrat')
  async listTacheByContrat(data: ListTacheByContratRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByContrat(data.contratId, data.pagination);
    return {
      taches: result.data.map((t) => this.mapTache(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByFacture')
  async listTacheByFacture(data: ListTacheByFactureRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByFacture(data.factureId, data.pagination);
    return {
      taches: result.data.map((t) => this.mapTache(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListEnRetard')
  async listTacheEnRetard(data: ListTacheEnRetardRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findEnRetard(data.organisationId, data.pagination);
    return {
      taches: result.data.map((t) => this.mapTache(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'GetStats')
  async getTacheStats(data: GetTacheStatsRequest): Promise<TacheStats> {
    const stats = await this.tacheService.getStats(data.organisationId);
    return {
      aFaire: stats.aFaire,
      enCours: stats.enCours,
      terminee: stats.terminee,
      annulee: stats.annulee,
      enRetard: stats.enRetard,
      total: stats.total,
    };
  }

  @GrpcMethod('TacheService', 'GetAlertes')
  async getTacheAlertes(data: GetTacheAlertesRequest): Promise<TacheAlertes> {
    const alertes = await this.tacheService.getAlertes(data.organisationId);
    return {
      enRetard: alertes.enRetard.map((t) => this.mapTache(t)),
      echeanceDemain: alertes.echeanceDemain.map((t) => this.mapTache(t)),
    };
  }

  @GrpcMethod('TacheService', 'MarquerEnCours')
  async marquerTacheEnCours(data: MarquerTacheRequest): Promise<Tache> {
    const tache = await this.tacheService.marquerEnCours(data.id);
    return this.mapTache(tache);
  }

  @GrpcMethod('TacheService', 'MarquerTerminee')
  async marquerTacheTerminee(data: MarquerTacheRequest): Promise<Tache> {
    const tache = await this.tacheService.marquerTerminee(data.id);
    return this.mapTache(tache);
  }

  @GrpcMethod('TacheService', 'MarquerAnnulee')
  async marquerTacheAnnulee(data: MarquerTacheRequest): Promise<Tache> {
    const tache = await this.tacheService.marquerAnnulee(data.id);
    return this.mapTache(tache);
  }

  @GrpcMethod('TacheService', 'Delete')
  async deleteTache(data: DeleteTacheRequest): Promise<DeleteResponse> {
    const success = await this.tacheService.delete(data.id);
    return { success };
  }

  // ========== EVENEMENT SUIVI SERVICE ==========

  @GrpcMethod('EvenementSuiviService', 'Create')
  async createEvenementSuivi(data: CreateEvenementSuiviRequest): Promise<EvenementSuivi> {
    const { dateEvenement, raw, ...rest } = data;
    const evenement = await this.evenementSuiviService.create({
      ...rest,
      dateEvenement: new Date(dateEvenement),
      raw: raw ? JSON.parse(raw) : undefined,
    });
    return this.mapEvenementSuivi(evenement);
  }

  @GrpcMethod('EvenementSuiviService', 'Update')
  async updateEvenementSuivi(data: UpdateEvenementSuiviRequest): Promise<EvenementSuivi> {
    const { id, dateEvenement, raw, ...rest } = data;
    const evenement = await this.evenementSuiviService.update(id, {
      ...rest,
      dateEvenement: dateEvenement ? new Date(dateEvenement) : undefined,
      raw: raw ? JSON.parse(raw) : undefined,
    });
    return this.mapEvenementSuivi(evenement);
  }

  @GrpcMethod('EvenementSuiviService', 'Get')
  async getEvenementSuivi(data: GetEvenementSuiviRequest): Promise<EvenementSuivi> {
    const evenement = await this.evenementSuiviService.findById(data.id);
    return this.mapEvenementSuivi(evenement);
  }

  @GrpcMethod('EvenementSuiviService', 'ListByExpedition')
  async listEvenementByExpedition(data: ListEvenementByExpeditionRequest): Promise<ListEvenementSuiviResponse> {
    const result = await this.evenementSuiviService.findByExpedition(data.expeditionId, data.pagination);
    return {
      evenements: result.data.map((e) => this.mapEvenementSuivi(e)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('EvenementSuiviService', 'List')
  async listEvenementSuivi(data: ListEvenementSuiviRequest): Promise<ListEvenementSuiviResponse> {
    const result = await this.evenementSuiviService.findAll({ search: data.search }, data.pagination);
    return {
      evenements: result.data.map((e) => this.mapEvenementSuivi(e)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('EvenementSuiviService', 'Delete')
  async deleteEvenementSuivi(data: DeleteEvenementSuiviRequest): Promise<DeleteResponse> {
    const success = await this.evenementSuiviService.delete(data.id);
    return { success };
  }

  // ========== MAPPERS ==========

  private mapTypeActivite(typeActivite: any): TypeActivite {
    return {
      id: typeActivite.id,
      code: typeActivite.code,
      nom: typeActivite.nom,
      description: typeActivite.description || '',
      createdAt: typeActivite.createdAt?.toISOString() || '',
      updatedAt: typeActivite.updatedAt?.toISOString() || '',
    };
  }

  private mapActivite(activite: any): Activite {
    return {
      id: activite.id,
      typeId: activite.typeId,
      dateActivite: activite.dateActivite?.toISOString() || '',
      sujet: activite.sujet,
      commentaire: activite.commentaire || '',
      echeance: activite.echeance?.toISOString() || '',
      clientBaseId: activite.clientBaseId || '',
      contratId: activite.contratId || '',
      clientPartenaireId: activite.clientPartenaireId || '',
      createdAt: activite.createdAt?.toISOString() || '',
      updatedAt: activite.updatedAt?.toISOString() || '',
    };
  }

  private mapTache(tache: any): Tache {
    return {
      id: tache.id,
      organisationId: tache.organisationId,
      titre: tache.titre,
      description: tache.description || '',
      type: tache.type,
      priorite: tache.priorite,
      statut: tache.statut,
      dateEcheance: tache.dateEcheance?.toISOString() || '',
      dateCompletion: tache.dateCompletion?.toISOString() || '',
      assigneA: tache.assigneA || '',
      creePar: tache.creePar || '',
      clientId: tache.clientId || '',
      contratId: tache.contratId || '',
      factureId: tache.factureId || '',
      regleRelanceId: tache.regleRelanceId || '',
      metadata: tache.metadata ? JSON.stringify(tache.metadata) : '',
      enRetard: tache.enRetard || false,
      createdAt: tache.createdAt?.toISOString() || '',
      updatedAt: tache.updatedAt?.toISOString() || '',
    };
  }

  private mapEvenementSuivi(evenement: any): EvenementSuivi {
    return {
      id: evenement.id,
      expeditionId: evenement.expeditionId,
      code: evenement.code,
      label: evenement.label,
      dateEvenement: evenement.dateEvenement?.toISOString() || '',
      lieu: evenement.lieu || '',
      raw: evenement.raw ? JSON.stringify(evenement.raw) : '',
      createdAt: evenement.createdAt?.toISOString() || '',
      updatedAt: evenement.updatedAt?.toISOString() || '',
    };
  }
}

import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TacheService } from '../persistence/typeorm/repositories/engagement';
import { TacheEntity, TacheStatut, TacheType, TachePriorite } from '../../domain/engagement/entities';
import type {
  Tache as TacheProto,
  CreateTacheRequest,
  UpdateTacheRequest,
  GetTacheRequest,
  ListTacheRequest,
  ListTacheByAssigneRequest,
  ListTacheByClientRequest,
  ListTacheByContratRequest,
  ListTacheByFactureRequest,
  ListTacheEnRetardRequest,
  ListTacheResponse,
  GetTacheStatsRequest,
  TacheStats,
  GetTacheAlertesRequest,
  TacheAlertes,
  MarquerTacheRequest,
  DeleteTacheRequest,
  DeleteResponse,
} from '@proto/activites';

@Controller()
export class TacheController {
  constructor(private readonly tacheService: TacheService) {}

  @GrpcMethod('TacheService', 'Create')
  async create(data: CreateTacheRequest): Promise<TacheProto> {
    const tache = await this.tacheService.create({
      organisationId: data.organisation_id,
      titre: data.titre,
      description: data.description,
      type: data.type as TacheType,
      priorite: data.priorite as TachePriorite,
      assigneA: data.assigne_a,
      creePar: data.cree_par,
      clientId: data.client_id || undefined,
      contratId: data.contrat_id || undefined,
      factureId: data.facture_id || undefined,
      regleRelanceId: data.regle_relance_id || undefined,
      dateEcheance: data.date_echeance ? new Date(data.date_echeance) : undefined,
      metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
    });
    return this.toProto(tache);
  }

  @GrpcMethod('TacheService', 'Update')
  async update(data: UpdateTacheRequest): Promise<TacheProto> {
    const tache = await this.tacheService.update(data.id, {
      titre: data.titre,
      description: data.description,
      type: data.type as TacheType,
      priorite: data.priorite as TachePriorite,
      statut: data.statut as TacheStatut,
      assigneA: data.assigne_a,
      clientId: data.client_id || undefined,
      contratId: data.contrat_id || undefined,
      factureId: data.facture_id || undefined,
      dateEcheance: data.date_echeance ? new Date(data.date_echeance) : undefined,
      metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
    });
    return this.toProto(tache);
  }

  @GrpcMethod('TacheService', 'Get')
  async get(data: GetTacheRequest): Promise<TacheProto> {
    const tache = await this.tacheService.findById(data.id);
    return this.toProto(tache);
  }

  @GrpcMethod('TacheService', 'List')
  async list(data: ListTacheRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findAll(
      {
        organisationId: data.organisation_id,
        statut: data.statut as TacheStatut,
        type: data.type as TacheType,
        priorite: data.priorite as TachePriorite,
        search: data.search,
        enRetard: data.en_retard,
      },
      data.pagination,
    );
    return {
      taches: result.data.map((t) => this.toProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByAssigne')
  async listByAssigne(data: ListTacheByAssigneRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByAssigne(data.assigne_a, data.periode, data.pagination);
    return {
      taches: result.data.map((t) => this.toProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByClient')
  async listByClient(data: ListTacheByClientRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByClient(data.client_id, data.pagination);
    return {
      taches: result.data.map((t) => this.toProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByContrat')
  async listByContrat(data: ListTacheByContratRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByContrat(data.contrat_id, data.pagination);
    return {
      taches: result.data.map((t) => this.toProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByFacture')
  async listByFacture(data: ListTacheByFactureRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByFacture(data.facture_id, data.pagination);
    return {
      taches: result.data.map((t) => this.toProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListEnRetard')
  async listEnRetard(data: ListTacheEnRetardRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findEnRetard(data.organisation_id, data.pagination);
    return {
      taches: result.data.map((t) => this.toProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'GetStats')
  async getStats(data: GetTacheStatsRequest): Promise<TacheStats> {
    const stats = await this.tacheService.getStats(data.organisation_id);
    return {
      a_faire: stats.aFaire,
      en_cours: stats.enCours,
      terminee: stats.terminee,
      annulee: stats.annulee,
      en_retard: stats.enRetard,
      total: stats.total,
    };
  }

  @GrpcMethod('TacheService', 'GetAlertes')
  async getAlertes(data: GetTacheAlertesRequest): Promise<TacheAlertes> {
    const result = await this.tacheService.getAlertes(data.organisation_id);
    return {
      en_retard: result.enRetard.map((t) => this.toProto(t)),
      echeance_demain: result.echeanceDemain.map((t) => this.toProto(t)),
    };
  }

  @GrpcMethod('TacheService', 'MarquerEnCours')
  async marquerEnCours(data: MarquerTacheRequest): Promise<TacheProto> {
    const tache = await this.tacheService.marquerEnCours(data.id);
    return this.toProto(tache);
  }

  @GrpcMethod('TacheService', 'MarquerTerminee')
  async marquerTerminee(data: MarquerTacheRequest): Promise<TacheProto> {
    const tache = await this.tacheService.marquerTerminee(data.id);
    return this.toProto(tache);
  }

  @GrpcMethod('TacheService', 'MarquerAnnulee')
  async marquerAnnulee(data: MarquerTacheRequest): Promise<TacheProto> {
    const tache = await this.tacheService.marquerAnnulee(data.id);
    return this.toProto(tache);
  }

  @GrpcMethod('TacheService', 'Delete')
  async delete(data: DeleteTacheRequest): Promise<DeleteResponse> {
    const success = await this.tacheService.delete(data.id);
    return { success };
  }

  private toProto(entity: TacheEntity): TacheProto {
    return {
      id: entity.id,
      organisation_id: entity.organisationId ?? '',
      titre: entity.titre ?? '',
      description: entity.description ?? '',
      type: entity.type ?? '',
      priorite: entity.priorite ?? '',
      statut: entity.statut ?? '',
      date_echeance: entity.dateEcheance?.toISOString() ?? '',
      date_completion: entity.dateCompletion?.toISOString() ?? '',
      assigne_a: entity.assigneA ?? '',
      cree_par: entity.creePar ?? '',
      client_id: entity.clientId ?? '',
      contrat_id: entity.contratId ?? '',
      facture_id: entity.factureId ?? '',
      regle_relance_id: entity.regleRelanceId ?? '',
      metadata: entity.metadata ? JSON.stringify(entity.metadata) : '',
      en_retard: entity.enRetard ?? false,
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }
}

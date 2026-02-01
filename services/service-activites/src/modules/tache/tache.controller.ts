import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TacheService } from './tache.service';
import { Tache as TacheEntity, TacheStatut, TacheType, TachePriorite } from './entities/tache.entity';
import type {
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
  DeleteResponse,
} from '@crm/proto/activites';

@Controller()
export class TacheController {
  constructor(private readonly tacheService: TacheService) {}

  @GrpcMethod('TacheService', 'Create')
  async create(data: CreateTacheRequest): Promise<Tache> {
    const { dateEcheance, metadata, ...rest } = data;
    const tache = await this.tacheService.create({
      ...rest,
      type: data.type as TacheType,
      priorite: data.priorite as TachePriorite,
      dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
    });
    return this.mapToProto(tache);
  }

  @GrpcMethod('TacheService', 'Update')
  async update(data: UpdateTacheRequest): Promise<Tache> {
    const { id, dateEcheance, metadata, ...rest } = data;
    const tache = await this.tacheService.update(id, {
      ...rest,
      type: data.type as TacheType,
      priorite: data.priorite as TachePriorite,
      statut: data.statut as TacheStatut,
      dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
      metadata: metadata ? JSON.parse(metadata) : undefined,
    });
    return this.mapToProto(tache);
  }

  @GrpcMethod('TacheService', 'Get')
  async get(data: GetTacheRequest): Promise<Tache> {
    const tache = await this.tacheService.findById(data.id);
    return this.mapToProto(tache);
  }

  @GrpcMethod('TacheService', 'List')
  async list(data: ListTacheRequest): Promise<ListTacheResponse> {
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
      taches: result.data.map((t) => this.mapToProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByAssigne')
  async listByAssigne(data: ListTacheByAssigneRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByAssigne(data.assigneA, data.periode, data.pagination);
    return {
      taches: result.data.map((t) => this.mapToProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByClient')
  async listByClient(data: ListTacheByClientRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByClient(data.clientId, data.pagination);
    return {
      taches: result.data.map((t) => this.mapToProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByContrat')
  async listByContrat(data: ListTacheByContratRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByContrat(data.contratId, data.pagination);
    return {
      taches: result.data.map((t) => this.mapToProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListByFacture')
  async listByFacture(data: ListTacheByFactureRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findByFacture(data.factureId, data.pagination);
    return {
      taches: result.data.map((t) => this.mapToProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'ListEnRetard')
  async listEnRetard(data: ListTacheEnRetardRequest): Promise<ListTacheResponse> {
    const result = await this.tacheService.findEnRetard(data.organisationId, data.pagination);
    return {
      taches: result.data.map((t) => this.mapToProto(t)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('TacheService', 'GetStats')
  async getStats(data: GetTacheStatsRequest): Promise<TacheStats> {
    return this.tacheService.getStats(data.organisationId);
  }

  @GrpcMethod('TacheService', 'GetAlertes')
  async getAlertes(data: GetTacheAlertesRequest): Promise<TacheAlertes> {
    const result = await this.tacheService.getAlertes(data.organisationId);
    return {
      enRetard: result.enRetard.map((t) => this.mapToProto(t)),
      echeanceDemain: result.echeanceDemain.map((t) => this.mapToProto(t)),
    };
  }

  @GrpcMethod('TacheService', 'MarquerEnCours')
  async marquerEnCours(data: MarquerTacheRequest): Promise<Tache> {
    const tache = await this.tacheService.marquerEnCours(data.id);
    return this.mapToProto(tache);
  }

  @GrpcMethod('TacheService', 'MarquerTerminee')
  async marquerTerminee(data: MarquerTacheRequest): Promise<Tache> {
    const tache = await this.tacheService.marquerTerminee(data.id);
    return this.mapToProto(tache);
  }

  @GrpcMethod('TacheService', 'MarquerAnnulee')
  async marquerAnnulee(data: MarquerTacheRequest): Promise<Tache> {
    const tache = await this.tacheService.marquerAnnulee(data.id);
    return this.mapToProto(tache);
  }

  @GrpcMethod('TacheService', 'Delete')
  async delete(data: DeleteTacheRequest): Promise<DeleteResponse> {
    const success = await this.tacheService.delete(data.id);
    return { success };
  }

  private mapToProto(entity: TacheEntity): Tache {
    return {
      id: entity.id,
      organisationId: entity.organisationId ?? '',
      titre: entity.titre ?? '',
      description: entity.description ?? '',
      type: entity.type ?? '',
      priorite: entity.priorite ?? '',
      statut: entity.statut ?? '',
      dateEcheance: entity.dateEcheance?.toISOString() ?? '',
      dateCompletion: entity.dateCompletion?.toISOString() ?? '',
      assigneA: entity.assigneA ?? '',
      creePar: entity.creePar ?? '',
      clientId: entity.clientId ?? '',
      contratId: entity.contratId ?? '',
      factureId: entity.factureId ?? '',
      regleRelanceId: entity.regleRelanceId ?? '',
      metadata: entity.metadata ? JSON.stringify(entity.metadata) : '',
      enRetard: entity.enRetard ?? false,
      createdAt: entity.createdAt?.toISOString() ?? '',
      updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
  }
}

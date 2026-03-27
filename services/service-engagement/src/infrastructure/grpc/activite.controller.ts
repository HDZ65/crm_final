import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ActiviteService } from '../persistence/typeorm/repositories/engagement';
import { ActiviteEntity } from '../../domain/engagement/entities';
import type {
  Activite as ActiviteProto,
  CreateActiviteRequest,
  UpdateActiviteRequest,
  GetActiviteRequest,
  ListActiviteByClientRequest,
  ListActiviteByContratRequest,
  ListActiviteRequest,
  ListActiviteResponse,
  DeleteActiviteRequest,
  DeleteResponse,
} from '@proto/activites';

@Controller()
export class ActiviteController {
  constructor(private readonly activiteService: ActiviteService) {}

  @GrpcMethod('ActiviteService', 'Create')
  async create(data: CreateActiviteRequest): Promise<ActiviteProto> {
    const activite = await this.activiteService.create({
      typeId: data.type_id,
      dateActivite: new Date(data.date_activite),
      sujet: data.sujet,
      commentaire: data.commentaire || undefined,
      echeance: data.echeance ? new Date(data.echeance) : undefined,
      clientBaseId: data.client_base_id || undefined,
      contratId: data.contrat_id || undefined,
      clientPartenaireId: data.client_partenaire_id || undefined,
    });
    return this.toProto(activite);
  }

  @GrpcMethod('ActiviteService', 'Update')
  async update(data: UpdateActiviteRequest): Promise<ActiviteProto> {
    const activite = await this.activiteService.update(data.id, {
      typeId: data.type_id || undefined,
      dateActivite: data.date_activite ? new Date(data.date_activite) : undefined,
      sujet: data.sujet || undefined,
      commentaire: data.commentaire || undefined,
      echeance: data.echeance ? new Date(data.echeance) : undefined,
    });
    return this.toProto(activite);
  }

  @GrpcMethod('ActiviteService', 'Get')
  async get(data: GetActiviteRequest): Promise<ActiviteProto> {
    const activite = await this.activiteService.findById(data.id);
    return this.toProto(activite);
  }

  @GrpcMethod('ActiviteService', 'ListByClient')
  async listByClient(data: ListActiviteByClientRequest): Promise<ListActiviteResponse> {
    const result = await this.activiteService.findByClient(data.client_base_id, data.pagination);
    return {
      activites: result.data.map((a) => this.toProto(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ActiviteService', 'ListByContrat')
  async listByContrat(data: ListActiviteByContratRequest): Promise<ListActiviteResponse> {
    const result = await this.activiteService.findByContrat(data.contrat_id, data.pagination);
    return {
      activites: result.data.map((a) => this.toProto(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ActiviteService', 'List')
  async list(data: ListActiviteRequest): Promise<ListActiviteResponse> {
    const result = await this.activiteService.findAll(
      { search: data.search, typeId: data.type_id },
      data.pagination,
    );
    return {
      activites: result.data.map((a) => this.toProto(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ActiviteService', 'Delete')
  async delete(data: DeleteActiviteRequest): Promise<DeleteResponse> {
    const success = await this.activiteService.delete(data.id);
    return { success };
  }

  private toProto(entity: ActiviteEntity): ActiviteProto {
    return {
      id: entity.id,
      type_id: entity.typeId,
      date_activite: entity.dateActivite?.toISOString() ?? '',
      sujet: entity.sujet ?? '',
      commentaire: entity.commentaire ?? '',
      echeance: entity.echeance?.toISOString() ?? '',
      client_base_id: entity.clientBaseId ?? '',
      contrat_id: entity.contratId ?? '',
      client_partenaire_id: entity.clientPartenaireId ?? '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }
}

import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ActiviteService } from '../../../../infrastructure/persistence/typeorm/repositories/engagement';
import { ActiviteEntity } from '../../../../domain/engagement/entities';
import type {
  Activite,
  CreateActiviteRequest,
  UpdateActiviteRequest,
  GetActiviteRequest,
  ListActiviteByClientRequest,
  ListActiviteByContratRequest,
  ListActiviteRequest,
  ListActiviteResponse,
  DeleteActiviteRequest,
  DeleteResponse,
} from '@crm/proto/activites';

@Controller()
export class ActiviteController {
  constructor(private readonly activiteService: ActiviteService) {}

  @GrpcMethod('ActiviteService', 'Create')
  async create(data: CreateActiviteRequest): Promise<Activite> {
    const activite = await this.activiteService.create({
      ...data,
      dateActivite: new Date(data.date_activite),
      echeance: data.echeance ? new Date(data.echeance) : undefined,
    });
    return this.mapToProto(activite);
  }

  @GrpcMethod('ActiviteService', 'Update')
  async update(data: UpdateActiviteRequest): Promise<Activite> {
    const { id, date_activite, echeance, ...rest } = data;
    const activite = await this.activiteService.update(id, {
      ...rest,
      dateActivite: date_activite ? new Date(date_activite) : undefined,
      echeance: echeance ? new Date(echeance) : undefined,
    });
    return this.mapToProto(activite);
  }

  @GrpcMethod('ActiviteService', 'Get')
  async get(data: GetActiviteRequest): Promise<Activite> {
    const activite = await this.activiteService.findById(data.id);
    return this.mapToProto(activite);
  }

  @GrpcMethod('ActiviteService', 'ListByClient')
  async listByClient(data: ListActiviteByClientRequest): Promise<ListActiviteResponse> {
    const result = await this.activiteService.findByClient(data.client_base_id, data.pagination);
    return {
      activites: result.data.map((a) => this.mapToProto(a)),
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
      activites: result.data.map((a) => this.mapToProto(a)),
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
      activites: result.data.map((a) => this.mapToProto(a)),
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

  private mapToProto(entity: ActiviteEntity): Activite {
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

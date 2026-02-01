import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ActiviteService } from './activite.service';
import { Activite as ActiviteEntity } from './entities/activite.entity';
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
      dateActivite: new Date(data.dateActivite),
      echeance: data.echeance ? new Date(data.echeance) : undefined,
    });
    return this.mapToProto(activite);
  }

  @GrpcMethod('ActiviteService', 'Update')
  async update(data: UpdateActiviteRequest): Promise<Activite> {
    const { id, dateActivite, echeance, ...rest } = data;
    const activite = await this.activiteService.update(id, {
      ...rest,
      dateActivite: dateActivite ? new Date(dateActivite) : undefined,
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
    const result = await this.activiteService.findByClient(data.clientBaseId, data.pagination);
    return {
      activites: result.data.map((a) => this.mapToProto(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ActiviteService', 'ListByContrat')
  async listByContrat(data: ListActiviteByContratRequest): Promise<ListActiviteResponse> {
    const result = await this.activiteService.findByContrat(data.contratId, data.pagination);
    return {
      activites: result.data.map((a) => this.mapToProto(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ActiviteService', 'List')
  async list(data: ListActiviteRequest): Promise<ListActiviteResponse> {
    const result = await this.activiteService.findAll(
      { search: data.search, typeId: data.typeId },
      data.pagination,
    );
    return {
      activites: result.data.map((a) => this.mapToProto(a)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
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
      typeId: entity.typeId,
      dateActivite: entity.dateActivite?.toISOString() ?? '',
      sujet: entity.sujet ?? '',
      commentaire: entity.commentaire ?? '',
      echeance: entity.echeance?.toISOString() ?? '',
      clientBaseId: entity.clientBaseId ?? '',
      contratId: entity.contratId ?? '',
      clientPartenaireId: entity.clientPartenaireId ?? '',
      createdAt: entity.createdAt?.toISOString() ?? '',
      updatedAt: entity.updatedAt?.toISOString() ?? '',
    };
  }
}

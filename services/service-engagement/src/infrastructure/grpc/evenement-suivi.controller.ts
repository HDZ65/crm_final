import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EvenementSuiviService } from '../persistence/typeorm/repositories/engagement';
import { EvenementSuiviEntity } from '../../domain/engagement/entities';
import type {
  EvenementSuivi as EvenementSuiviProto,
  CreateEvenementSuiviRequest,
  UpdateEvenementSuiviRequest,
  GetEvenementSuiviRequest,
  ListEvenementByExpeditionRequest,
  ListEvenementSuiviRequest,
  ListEvenementSuiviResponse,
  DeleteEvenementSuiviRequest,
  DeleteResponse,
} from '@proto/activites';

@Controller()
export class EvenementSuiviController {
  constructor(private readonly evenementSuiviService: EvenementSuiviService) {}

  @GrpcMethod('EvenementSuiviService', 'Create')
  async create(data: CreateEvenementSuiviRequest): Promise<EvenementSuiviProto> {
    const evenement = await this.evenementSuiviService.create({
      expeditionId: data.expedition_id,
      code: data.code,
      label: data.label,
      dateEvenement: new Date(data.date_evenement),
      lieu: data.lieu || undefined,
      raw: data.raw ? JSON.parse(data.raw) : undefined,
    });
    return this.toProto(evenement);
  }

  @GrpcMethod('EvenementSuiviService', 'Update')
  async update(data: UpdateEvenementSuiviRequest): Promise<EvenementSuiviProto> {
    const evenement = await this.evenementSuiviService.update(data.id, {
      code: data.code || undefined,
      label: data.label || undefined,
      dateEvenement: data.date_evenement ? new Date(data.date_evenement) : undefined,
      lieu: data.lieu || undefined,
      raw: data.raw ? JSON.parse(data.raw) : undefined,
    });
    return this.toProto(evenement);
  }

  @GrpcMethod('EvenementSuiviService', 'Get')
  async get(data: GetEvenementSuiviRequest): Promise<EvenementSuiviProto> {
    const evenement = await this.evenementSuiviService.findById(data.id);
    return this.toProto(evenement);
  }

  @GrpcMethod('EvenementSuiviService', 'ListByExpedition')
  async listByExpedition(data: ListEvenementByExpeditionRequest): Promise<ListEvenementSuiviResponse> {
    const result = await this.evenementSuiviService.findByExpedition(data.expedition_id, data.pagination);
    return {
      evenements: result.data.map((e) => this.toProto(e)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('EvenementSuiviService', 'List')
  async list(data: ListEvenementSuiviRequest): Promise<ListEvenementSuiviResponse> {
    const result = await this.evenementSuiviService.findAll({ search: data.search }, data.pagination);
    return {
      evenements: result.data.map((e) => this.toProto(e)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: result.totalPages,
      },
    };
  }

  @GrpcMethod('EvenementSuiviService', 'Delete')
  async delete(data: DeleteEvenementSuiviRequest): Promise<DeleteResponse> {
    const success = await this.evenementSuiviService.delete(data.id);
    return { success };
  }

  private toProto(entity: EvenementSuiviEntity): EvenementSuiviProto {
    return {
      id: entity.id,
      expedition_id: entity.expeditionId ?? '',
      code: entity.code ?? '',
      label: entity.label ?? '',
      date_evenement: entity.dateEvenement?.toISOString() ?? '',
      lieu: entity.lieu ?? '',
      raw: entity.raw ? JSON.stringify(entity.raw) : '',
      created_at: entity.createdAt?.toISOString() ?? '',
      updated_at: entity.updatedAt?.toISOString() ?? '',
    };
  }
}

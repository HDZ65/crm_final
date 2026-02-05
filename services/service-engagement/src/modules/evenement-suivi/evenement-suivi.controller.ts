import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EvenementSuiviService } from './evenement-suivi.service';
import { EvenementSuivi as EvenementSuiviEntity } from './entities/evenement-suivi.entity';
import type {
  EvenementSuivi,
  CreateEvenementSuiviRequest,
  UpdateEvenementSuiviRequest,
  GetEvenementSuiviRequest,
  ListEvenementByExpeditionRequest,
  ListEvenementSuiviRequest,
  ListEvenementSuiviResponse,
  DeleteEvenementSuiviRequest,
  DeleteResponse,
} from '@crm/proto/activites';

@Controller()
export class EvenementSuiviController {
  constructor(private readonly evenementSuiviService: EvenementSuiviService) {}

  @GrpcMethod('EvenementSuiviService', 'Create')
  async create(data: CreateEvenementSuiviRequest): Promise<EvenementSuivi> {
    const { date_evenement, raw, ...rest } = data;
    const evenement = await this.evenementSuiviService.create({
      ...rest,
      dateEvenement: new Date(date_evenement),
      raw: raw ? JSON.parse(raw) : undefined,
    });
    return this.mapToProto(evenement);
  }

  @GrpcMethod('EvenementSuiviService', 'Update')
  async update(data: UpdateEvenementSuiviRequest): Promise<EvenementSuivi> {
    const { id, date_evenement, raw, ...rest } = data;
    const evenement = await this.evenementSuiviService.update(id, {
      ...rest,
      dateEvenement: date_evenement ? new Date(date_evenement) : undefined,
      raw: raw ? JSON.parse(raw) : undefined,
    });
    return this.mapToProto(evenement);
  }

  @GrpcMethod('EvenementSuiviService', 'Get')
  async get(data: GetEvenementSuiviRequest): Promise<EvenementSuivi> {
    const evenement = await this.evenementSuiviService.findById(data.id);
    return this.mapToProto(evenement);
  }

  @GrpcMethod('EvenementSuiviService', 'ListByExpedition')
  async listByExpedition(data: ListEvenementByExpeditionRequest): Promise<ListEvenementSuiviResponse> {
    const result = await this.evenementSuiviService.findByExpedition(data.expedition_id, data.pagination);
    return {
      evenements: result.data.map((e) => this.mapToProto(e)),
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
      evenements: result.data.map((e) => this.mapToProto(e)),
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

  private mapToProto(entity: EvenementSuiviEntity): EvenementSuivi {
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

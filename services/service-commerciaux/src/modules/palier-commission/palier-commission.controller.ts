import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PalierCommissionService } from './palier-commission.service';
import type {
  CreatePalierCommissionRequest,
  UpdatePalierCommissionRequest,
  GetPalierCommissionRequest,
  ListPalierByBaremeRequest,
  ActivatePalierRequest,
  DeletePalierCommissionRequest,
} from '@crm/proto/commerciaux';

@Controller()
export class PalierCommissionController {
  constructor(private readonly palierCommissionService: PalierCommissionService) {}

  @GrpcMethod('PalierCommissionService', 'Create')
  async create(data: CreatePalierCommissionRequest) {
    return this.palierCommissionService.create(data);
  }

  @GrpcMethod('PalierCommissionService', 'Update')
  async update(data: UpdatePalierCommissionRequest) {
    const { id, ...updateData } = data;
    return this.palierCommissionService.update(id, updateData);
  }

  @GrpcMethod('PalierCommissionService', 'Get')
  async get(data: GetPalierCommissionRequest) {
    return this.palierCommissionService.findById(data.id);
  }

  @GrpcMethod('PalierCommissionService', 'ListByBareme')
  async listByBareme(data: ListPalierByBaremeRequest) {
    const result = await this.palierCommissionService.findByBareme(data.baremeId, data.pagination);
    return {
      paliers: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('PalierCommissionService', 'Activer')
  async activer(data: ActivatePalierRequest) {
    return this.palierCommissionService.activer(data.id);
  }

  @GrpcMethod('PalierCommissionService', 'Desactiver')
  async desactiver(data: ActivatePalierRequest) {
    return this.palierCommissionService.desactiver(data.id);
  }

  @GrpcMethod('PalierCommissionService', 'Delete')
  async delete(data: DeletePalierCommissionRequest) {
    const success = await this.palierCommissionService.delete(data.id);
    return { success };
  }
}

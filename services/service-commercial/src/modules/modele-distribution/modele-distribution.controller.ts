import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ModeleDistributionService } from './modele-distribution.service';
import type {
  CreateModeleDistributionRequest,
  UpdateModeleDistributionRequest,
  GetModeleDistributionRequest,
  GetModeleDistributionByCodeRequest,
  ListModeleDistributionRequest,
  DeleteModeleDistributionRequest,
} from '@crm/proto/commerciaux';

@Controller()
export class ModeleDistributionController {
  constructor(private readonly modeleDistributionService: ModeleDistributionService) {}

  @GrpcMethod('ModeleDistributionService', 'Create')
  async create(data: CreateModeleDistributionRequest) {
    return this.modeleDistributionService.create(data);
  }

  @GrpcMethod('ModeleDistributionService', 'Update')
  async update(data: UpdateModeleDistributionRequest) {
    const { id, ...updateData } = data;
    return this.modeleDistributionService.update(id, updateData);
  }

  @GrpcMethod('ModeleDistributionService', 'Get')
  async get(data: GetModeleDistributionRequest) {
    return this.modeleDistributionService.findById(data.id);
  }

  @GrpcMethod('ModeleDistributionService', 'GetByCode')
  async getByCode(data: GetModeleDistributionByCodeRequest) {
    return this.modeleDistributionService.findByCode(data.code);
  }

  @GrpcMethod('ModeleDistributionService', 'List')
  async list(data: ListModeleDistributionRequest) {
    const result = await this.modeleDistributionService.findAll({ search: data.search }, data.pagination);
    return {
      modeles: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ModeleDistributionService', 'Delete')
  async delete(data: DeleteModeleDistributionRequest) {
    const success = await this.modeleDistributionService.delete(data.id);
    return { success };
  }
}

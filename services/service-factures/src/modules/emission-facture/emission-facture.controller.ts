import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EmissionFactureService } from './emission-facture.service';

import type {
  CreateEmissionFactureRequest,
  UpdateEmissionFactureRequest,
  GetEmissionFactureRequest,
  ListEmissionsFactureRequest,
  DeleteEmissionFactureRequest,
} from '@crm/proto/factures';

@Controller()
export class EmissionFactureController {
  constructor(private readonly emissionService: EmissionFactureService) {}

  @GrpcMethod('EmissionFactureService', 'Create')
  async createEmission(data: CreateEmissionFactureRequest) {
    return this.emissionService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
    });
  }

  @GrpcMethod('EmissionFactureService', 'Update')
  async updateEmission(data: UpdateEmissionFactureRequest) {
    return this.emissionService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
    });
  }

  @GrpcMethod('EmissionFactureService', 'Get')
  async getEmission(data: GetEmissionFactureRequest) {
    return this.emissionService.findById(data.id);
  }

  @GrpcMethod('EmissionFactureService', 'List')
  async listEmissions(data: ListEmissionsFactureRequest) {
    return this.emissionService.findAll({
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
  }

  @GrpcMethod('EmissionFactureService', 'Delete')
  async deleteEmission(data: DeleteEmissionFactureRequest) {
    const success = await this.emissionService.delete(data.id);
    return { success };
  }
}

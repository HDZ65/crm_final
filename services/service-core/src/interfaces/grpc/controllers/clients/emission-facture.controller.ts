import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { EmissionFactureService } from '../../../../infrastructure/persistence/typeorm/repositories/clients/emission-facture.service';
import type {
  CreateEmissionFactureRequest,
  UpdateEmissionFactureRequest,
  GetEmissionFactureRequest,
  GetEmissionFactureByCodeRequest,
  ListEmissionFactureRequest,
  DeleteEmissionFactureRequest,
} from '@crm/proto/referentiel';

@Controller()
export class EmissionFactureController {
  constructor(private readonly emissionFactureService: EmissionFactureService) {}

  @GrpcMethod('EmissionFactureService', 'Create')
  create(data: CreateEmissionFactureRequest) {
    return this.emissionFactureService.create(data);
  }

  @GrpcMethod('EmissionFactureService', 'Update')
  update(data: UpdateEmissionFactureRequest) {
    const { id, ...updateData } = data;
    return this.emissionFactureService.update(id, updateData);
  }

  @GrpcMethod('EmissionFactureService', 'Get')
  get(data: GetEmissionFactureRequest) {
    return this.emissionFactureService.findById(data.id);
  }

  @GrpcMethod('EmissionFactureService', 'GetByCode')
  getByCode(data: GetEmissionFactureByCodeRequest) {
    return this.emissionFactureService.findByCode(data.code);
  }

  @GrpcMethod('EmissionFactureService', 'List')
  list(data: ListEmissionFactureRequest) {
    return this.emissionFactureService.findAll({ search: data.search }, data.pagination);
  }

  @GrpcMethod('EmissionFactureService', 'Delete')
  delete(data: DeleteEmissionFactureRequest) {
    return this.emissionFactureService.delete(data.id);
  }
}

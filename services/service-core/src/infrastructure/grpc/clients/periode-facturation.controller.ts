import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PeriodeFacturationService } from '../../persistence/typeorm/repositories/clients/periode-facturation.service';
import type {
  CreatePeriodeFacturationRequest,
  UpdatePeriodeFacturationRequest,
  GetPeriodeFacturationRequest,
  GetPeriodeFacturationByCodeRequest,
  ListPeriodeFacturationRequest,
  ListPeriodeFacturationResponse,
  DeletePeriodeFacturationRequest,
  PeriodeFacturation,
  DeleteResponse,
} from '@proto/referentiel';

@Controller()
export class PeriodeFacturationController {
  constructor(private readonly periodeFacturationService: PeriodeFacturationService) {}

  @GrpcMethod('PeriodeFacturationService', 'Create')
  create(data: CreatePeriodeFacturationRequest) {
    return this.periodeFacturationService.create(data);
  }

  @GrpcMethod('PeriodeFacturationService', 'Update')
  update(data: UpdatePeriodeFacturationRequest) {
    const { id, ...updateData } = data;
    return this.periodeFacturationService.update(id, updateData);
  }

  @GrpcMethod('PeriodeFacturationService', 'Get')
  get(data: GetPeriodeFacturationRequest) {
    return this.periodeFacturationService.findById(data.id);
  }

  @GrpcMethod('PeriodeFacturationService', 'GetByCode')
  getByCode(data: GetPeriodeFacturationByCodeRequest) {
    return this.periodeFacturationService.findByCode(data.code);
  }

  @GrpcMethod('PeriodeFacturationService', 'List')
  list(data: ListPeriodeFacturationRequest) {
    return this.periodeFacturationService.findAll({ search: data.search }, data.pagination);
  }

  @GrpcMethod('PeriodeFacturationService', 'Delete')
  delete(data: DeletePeriodeFacturationRequest) {
    return this.periodeFacturationService.delete(data.id);
  }
}

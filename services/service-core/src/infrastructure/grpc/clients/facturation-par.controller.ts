import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FacturationParService } from '../../persistence/typeorm/repositories/clients/facturation-par.service';
import type {
  CreateFacturationParRequest,
  UpdateFacturationParRequest,
  GetFacturationParRequest,
  GetFacturationParByCodeRequest,
  ListFacturationParRequest,
  ListFacturationParResponse,
  DeleteFacturationParRequest,
  FacturationPar,
  DeleteResponse,
} from '@proto/referentiel';

@Controller()
export class FacturationParController {
  constructor(private readonly facturationParService: FacturationParService) {}

  @GrpcMethod('FacturationParService', 'Create')
  create(data: CreateFacturationParRequest) {
    return this.facturationParService.create(data);
  }

  @GrpcMethod('FacturationParService', 'Update')
  update(data: UpdateFacturationParRequest) {
    const { id, ...updateData } = data;
    return this.facturationParService.update(id, updateData);
  }

  @GrpcMethod('FacturationParService', 'Get')
  get(data: GetFacturationParRequest) {
    return this.facturationParService.findById(data.id);
  }

  @GrpcMethod('FacturationParService', 'GetByCode')
  getByCode(data: GetFacturationParByCodeRequest) {
    return this.facturationParService.findByCode(data.code);
  }

  @GrpcMethod('FacturationParService', 'List')
  list(data: ListFacturationParRequest) {
    return this.facturationParService.findAll({ search: data.search }, data.pagination);
  }

  @GrpcMethod('FacturationParService', 'Delete')
  delete(data: DeleteFacturationParRequest) {
    return this.facturationParService.delete(data.id);
  }
}

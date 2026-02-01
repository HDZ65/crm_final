import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ConditionPaiementService } from './condition-paiement.service';
import type {
  CreateConditionPaiementRequest,
  UpdateConditionPaiementRequest,
  GetConditionPaiementRequest,
  GetConditionPaiementByCodeRequest,
  ListConditionPaiementRequest,
  DeleteConditionPaiementRequest,
} from '@crm/proto/referentiel';

@Controller()
export class ConditionPaiementController {
  constructor(private readonly conditionPaiementService: ConditionPaiementService) {}

  @GrpcMethod('ConditionPaiementService', 'Create')
  create(data: CreateConditionPaiementRequest) {
    return this.conditionPaiementService.create(data);
  }

  @GrpcMethod('ConditionPaiementService', 'Update')
  update(data: UpdateConditionPaiementRequest) {
    const { id, ...updateData } = data;
    return this.conditionPaiementService.update(id, updateData);
  }

  @GrpcMethod('ConditionPaiementService', 'Get')
  get(data: GetConditionPaiementRequest) {
    return this.conditionPaiementService.findById(data.id);
  }

  @GrpcMethod('ConditionPaiementService', 'GetByCode')
  getByCode(data: GetConditionPaiementByCodeRequest) {
    return this.conditionPaiementService.findByCode(data.code);
  }

  @GrpcMethod('ConditionPaiementService', 'List')
  list(data: ListConditionPaiementRequest) {
    return this.conditionPaiementService.findAll({ search: data.search }, data.pagination);
  }

  @GrpcMethod('ConditionPaiementService', 'Delete')
  delete(data: DeleteConditionPaiementRequest) {
    return this.conditionPaiementService.delete(data.id);
  }
}

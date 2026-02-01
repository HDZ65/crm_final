import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StatutClientService } from './statut-client.service';
import type {
  CreateStatutClientRequest,
  UpdateStatutClientRequest,
  GetStatutClientRequest,
  GetStatutClientByCodeRequest,
  ListStatutClientRequest,
  DeleteStatutClientRequest,
} from '@crm/proto/referentiel';

@Controller()
export class StatutClientController {
  constructor(private readonly statutClientService: StatutClientService) {}

  @GrpcMethod('StatutClientService', 'Create')
  create(data: CreateStatutClientRequest) {
    return this.statutClientService.create(data);
  }

  @GrpcMethod('StatutClientService', 'Update')
  update(data: UpdateStatutClientRequest) {
    const { id, ...updateData } = data;
    return this.statutClientService.update(id, updateData);
  }

  @GrpcMethod('StatutClientService', 'Get')
  get(data: GetStatutClientRequest) {
    return this.statutClientService.findById(data.id);
  }

  @GrpcMethod('StatutClientService', 'GetByCode')
  getByCode(data: GetStatutClientByCodeRequest) {
    return this.statutClientService.findByCode(data.code);
  }

  @GrpcMethod('StatutClientService', 'List')
  list(data: ListStatutClientRequest) {
    return this.statutClientService.findAll({ search: data.search }, data.pagination);
  }

  @GrpcMethod('StatutClientService', 'Delete')
  delete(data: DeleteStatutClientRequest) {
    return this.statutClientService.delete(data.id);
  }
}

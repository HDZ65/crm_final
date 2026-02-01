import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StatutPartenaireService } from './statut-partenaire.service';

import type {
  CreateStatutPartenaireRequest,
  UpdateStatutPartenaireRequest,
  GetStatutPartenaireRequest,
  GetStatutPartenaireByCodeRequest,
  ListStatutPartenaireRequest,
  DeleteStatutPartenaireRequest,
} from '@crm/proto/organisations';

@Controller()
export class StatutPartenaireController {
  constructor(private readonly statutPartenaireService: StatutPartenaireService) {}

  @GrpcMethod('StatutPartenaireService', 'Create')
  async create(data: CreateStatutPartenaireRequest) {
    return this.statutPartenaireService.create(data);
  }

  @GrpcMethod('StatutPartenaireService', 'Update')
  async update(data: UpdateStatutPartenaireRequest) {
    return this.statutPartenaireService.update(data);
  }

  @GrpcMethod('StatutPartenaireService', 'Get')
  async get(data: GetStatutPartenaireRequest) {
    return this.statutPartenaireService.findById(data.id);
  }

  @GrpcMethod('StatutPartenaireService', 'GetByCode')
  async getByCode(data: GetStatutPartenaireByCodeRequest) {
    return this.statutPartenaireService.findByCode(data.code);
  }

  @GrpcMethod('StatutPartenaireService', 'List')
  async list(data: ListStatutPartenaireRequest) {
    return this.statutPartenaireService.findAll(data.pagination);
  }

  @GrpcMethod('StatutPartenaireService', 'Delete')
  async delete(data: DeleteStatutPartenaireRequest) {
    const success = await this.statutPartenaireService.delete(data.id);
    return { success };
  }
}

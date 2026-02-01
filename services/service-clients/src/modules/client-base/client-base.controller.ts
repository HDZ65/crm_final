import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ClientBaseService } from './client-base.service';

import type {
  CreateClientBaseRequest,
  UpdateClientBaseRequest,
  GetClientBaseRequest,
  ListClientsBaseRequest,
  DeleteClientBaseRequest,
  SearchClientRequest,
} from '@crm/proto/clients';

@Controller()
export class ClientBaseController {
  constructor(private readonly clientBaseService: ClientBaseService) {}

  @GrpcMethod('ClientBaseService', 'Create')
  async createClientBase(data: CreateClientBaseRequest) {
    return this.clientBaseService.create(data);
  }

  @GrpcMethod('ClientBaseService', 'Update')
  async updateClientBase(data: UpdateClientBaseRequest) {
    return this.clientBaseService.update(data);
  }

  @GrpcMethod('ClientBaseService', 'Get')
  async getClientBase(data: GetClientBaseRequest) {
    return this.clientBaseService.findById(data.id);
  }

  @GrpcMethod('ClientBaseService', 'List')
  async listClientsBase(data: ListClientsBaseRequest) {
    return this.clientBaseService.findAll(data);
  }

  @GrpcMethod('ClientBaseService', 'Delete')
  async deleteClientBase(data: DeleteClientBaseRequest) {
    const success = await this.clientBaseService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ClientBaseService', 'Search')
  async searchClient(data: SearchClientRequest) {
    return this.clientBaseService.search(data.organisationId, data.telephone, data.nom);
  }
}

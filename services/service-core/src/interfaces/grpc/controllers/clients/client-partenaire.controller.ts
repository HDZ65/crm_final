import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ClientPartenaireService } from '../../../../infrastructure/persistence/typeorm/repositories/clients/client-partenaire.service';

import type {
  CreateClientPartenaireRequest,
  UpdateClientPartenaireRequest,
  GetClientPartenaireRequest,
  ListClientsPartenaireRequest,
  DeleteClientPartenaireRequest,
} from '@crm/proto/clients';

@Controller()
export class ClientPartenaireController {
  constructor(private readonly clientPartenaireService: ClientPartenaireService) {}

  @GrpcMethod('ClientPartenaireService', 'Create')
  async createClientPartenaire(data: CreateClientPartenaireRequest) {
    return this.clientPartenaireService.create({
      clientBaseId: data.clientBaseId,
      partenaireId: data.partenaireId,
      rolePartenaireId: data.rolePartenaireId,
      validFrom: data.validFrom,
      validTo: data.validTo,
    });
  }

  @GrpcMethod('ClientPartenaireService', 'Update')
  async updateClientPartenaire(data: UpdateClientPartenaireRequest) {
    return this.clientPartenaireService.update({
      id: data.id,
      partenaireId: data.partenaireId,
      rolePartenaireId: data.rolePartenaireId,
      validFrom: data.validFrom,
      validTo: data.validTo,
    });
  }

  @GrpcMethod('ClientPartenaireService', 'Get')
  async getClientPartenaire(data: GetClientPartenaireRequest) {
    return this.clientPartenaireService.findById(data.id);
  }

  @GrpcMethod('ClientPartenaireService', 'List')
  async listClientsPartenaire(data: ListClientsPartenaireRequest) {
    return this.clientPartenaireService.findAll(
      { clientBaseId: data.clientBaseId, partenaireId: data.partenaireId },
      data.pagination,
    );
  }

  @GrpcMethod('ClientPartenaireService', 'Delete')
  async deleteClientPartenaire(data: DeleteClientPartenaireRequest) {
    const success = await this.clientPartenaireService.delete(data.id);
    return { success };
  }
}

import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ClientPartenaireService } from '../../persistence/typeorm/repositories/clients/client-partenaire.service';
import type {
  CreateClientPartenaireRequest,
  UpdateClientPartenaireRequest,
  GetClientPartenaireRequest,
  ListClientsPartenaireRequest,
  ListClientsPartenaireResponse,
  DeleteClientPartenaireRequest,
  ClientPartenaire,
  DeleteResponse,
} from '@proto/clients';

@Controller()
export class ClientPartenaireController {
  constructor(private readonly clientPartenaireService: ClientPartenaireService) {}

  @GrpcMethod('ClientPartenaireService', 'Create')
  async createClientPartenaire(data: CreateClientPartenaireRequest) {
    return this.clientPartenaireService.create({
      clientBaseId: data.client_base_id,
      partenaireId: data.partenaire_id,
      rolePartenaireId: data.role_partenaire_id,
      validFrom: data.valid_from,
      validTo: data.valid_to,
    });
  }

  @GrpcMethod('ClientPartenaireService', 'Update')
  async updateClientPartenaire(data: UpdateClientPartenaireRequest) {
    return this.clientPartenaireService.update({
      id: data.id,
      partenaireId: data.partenaire_id,
      rolePartenaireId: data.role_partenaire_id,
      validFrom: data.valid_from,
      validTo: data.valid_to,
    });
  }

  @GrpcMethod('ClientPartenaireService', 'Get')
  async getClientPartenaire(data: GetClientPartenaireRequest) {
    return this.clientPartenaireService.findById(data.id);
  }

  @GrpcMethod('ClientPartenaireService', 'List')
  async listClientsPartenaire(data: ListClientsPartenaireRequest) {
    return this.clientPartenaireService.findAll(
      { clientBaseId: data.client_base_id, partenaireId: data.partenaire_id },
      data.pagination,
    );
  }

  @GrpcMethod('ClientPartenaireService', 'Delete')
  async deleteClientPartenaire(data: DeleteClientPartenaireRequest) {
    const success = await this.clientPartenaireService.delete(data.id);
    return { success };
  }
}

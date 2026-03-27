import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CreateClientPartenaireRequest,
  DeleteClientPartenaireRequest,
  GetClientPartenaireRequest,
  ListClientsPartenaireRequest,
  UpdateClientPartenaireRequest,
} from '@proto/clients';
import { ClientPartenaireService } from '../../persistence/typeorm/repositories/clients/client-partenaire.service';

@Controller()
export class ClientPartenaireController {
  constructor(private readonly clientPartenaireService: ClientPartenaireService) {}

  @GrpcMethod('ClientPartenaireService', 'Create')
  async createClientPartenaire(data: CreateClientPartenaireRequest) {
    return this.clientPartenaireService.create({
      clientBaseId: data.clientBaseId,
      partenaireId: data.partenaireId,
      rolePartenaireId: data.rolePartenaireId,
      validFrom: data.validFrom as unknown as string,
      validTo: data.validTo as unknown as string,
    });
  }

  @GrpcMethod('ClientPartenaireService', 'Update')
  async updateClientPartenaire(data: UpdateClientPartenaireRequest) {
    return this.clientPartenaireService.update({
      id: data.id,
      partenaireId: data.partenaireId,
      rolePartenaireId: data.rolePartenaireId,
      validFrom: data.validFrom as unknown as string,
      validTo: data.validTo as unknown as string,
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

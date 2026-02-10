import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ClientEntrepriseService } from '../../persistence/typeorm/repositories/clients/client-entreprise.service';
import type {
  CreateClientEntrepriseRequest,
  UpdateClientEntrepriseRequest,
  GetClientEntrepriseRequest,
  ListClientsEntrepriseRequest,
  ListClientsEntrepriseResponse,
  DeleteClientEntrepriseRequest,
  ClientEntreprise,
  DeleteResponse,
} from '@proto/clients';

@Controller()
export class ClientEntrepriseController {
  constructor(private readonly clientEntrepriseService: ClientEntrepriseService) {}

  @GrpcMethod('ClientEntrepriseService', 'Create')
  async create(data: CreateClientEntrepriseRequest) {
    return this.clientEntrepriseService.create({
      raisonSociale: data.raison_sociale,
      numeroTva: data.numero_tva,
      siren: data.siren,
    });
  }

  @GrpcMethod('ClientEntrepriseService', 'Update')
  async update(data: UpdateClientEntrepriseRequest) {
    return this.clientEntrepriseService.update({
      id: data.id,
      raisonSociale: data.raison_sociale,
      numeroTva: data.numero_tva,
      siren: data.siren,
    });
  }

  @GrpcMethod('ClientEntrepriseService', 'Get')
  async get(data: GetClientEntrepriseRequest) {
    return this.clientEntrepriseService.findById(data.id);
  }

  @GrpcMethod('ClientEntrepriseService', 'List')
  async list(data: ListClientsEntrepriseRequest) {
    return this.clientEntrepriseService.findAll(data.pagination);
  }

  @GrpcMethod('ClientEntrepriseService', 'Delete')
  async delete(data: DeleteClientEntrepriseRequest) {
    const success = await this.clientEntrepriseService.delete(data.id);
    return { success };
  }
}

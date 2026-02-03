import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MembreCompteService } from './membre-compte.service';

import type {
  CreateMembreCompteRequest,
  UpdateMembreCompteRequest,
  GetMembreCompteRequest,
  ListByOrganisationRequest,
  ListByUtilisateurRequest,
  DeleteMembreCompteRequest,
} from '@crm/proto/users';

@Controller()
export class MembreCompteController {
  constructor(private readonly membreCompteService: MembreCompteService) {}

  @GrpcMethod('MembreCompteService', 'Create')
  async create(data: CreateMembreCompteRequest) {
    return this.membreCompteService.create({
      organisationId: data.organisation_id,
      utilisateurId: data.utilisateur_id,
      roleId: data.role_id,
      etat: data.etat,
    });
  }

  @GrpcMethod('MembreCompteService', 'Update')
  async update(data: UpdateMembreCompteRequest) {
    return this.membreCompteService.update({
      id: data.id,
      roleId: data.role_id,
      etat: data.etat,
    });
  }

  @GrpcMethod('MembreCompteService', 'Get')
  async get(data: GetMembreCompteRequest) {
    return this.membreCompteService.findById(data.id);
  }

  @GrpcMethod('MembreCompteService', 'ListByOrganisation')
  async listByOrganisation(data: ListByOrganisationRequest) {
    return this.membreCompteService.findByOrganisation(data.organisation_id, data.pagination);
  }

  @GrpcMethod('MembreCompteService', 'ListByUtilisateur')
  async listByUtilisateur(data: ListByUtilisateurRequest) {
    return this.membreCompteService.findByUtilisateur(data.utilisateur_id, data.pagination);
  }

  @GrpcMethod('MembreCompteService', 'Delete')
  async delete(data: DeleteMembreCompteRequest) {
    const success = await this.membreCompteService.delete(data.id);
    return { success };
  }
}

import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SocieteService } from './societe.service';

import type {
  CreateSocieteRequest,
  UpdateSocieteRequest,
  GetSocieteRequest,
  ListSocieteByOrganisationRequest,
  ListSocieteRequest,
  DeleteSocieteRequest,
} from '@crm/proto/organisations';

@Controller()
export class SocieteController {
  constructor(private readonly societeService: SocieteService) {}

  @GrpcMethod('SocieteService', 'Create')
  async create(data: CreateSocieteRequest) {
    return this.societeService.create({
      organisationId: data.organisation_id,
      raisonSociale: data.raison_sociale,
      siren: data.siren,
      numeroTva: data.numero_tva,
    });
  }

  @GrpcMethod('SocieteService', 'Update')
  async update(data: UpdateSocieteRequest) {
    return this.societeService.update({
      id: data.id,
      raisonSociale: data.raison_sociale,
      siren: data.siren,
      numeroTva: data.numero_tva,
    });
  }

  @GrpcMethod('SocieteService', 'Get')
  async get(data: GetSocieteRequest) {
    return this.societeService.findById(data.id);
  }

  @GrpcMethod('SocieteService', 'ListByOrganisation')
  async listByOrganisation(data: ListSocieteByOrganisationRequest) {
    return this.societeService.findByOrganisation(data.organisation_id, data.pagination);
  }

  @GrpcMethod('SocieteService', 'List')
  async list(data: ListSocieteRequest) {
    return this.societeService.findAll({ search: data.search }, data.pagination);
  }

  @GrpcMethod('SocieteService', 'Delete')
  async delete(data: DeleteSocieteRequest) {
    const success = await this.societeService.delete(data.id);
    return { success };
  }
}

import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ApporteurService } from '../../../../infrastructure/persistence/typeorm/repositories/commercial/apporteur.service';
import type {
  CreateApporteurRequest,
  UpdateApporteurRequest,
  GetApporteurRequest,
  GetApporteurByUtilisateurRequest,
  ListApporteurRequest,
  ListApporteurByOrganisationRequest,
  ActivateApporteurRequest,
  DeleteApporteurRequest,
} from '@crm/proto/commerciaux';

@Controller()
export class ApporteurController {
  constructor(private readonly apporteurService: ApporteurService) {}

  @GrpcMethod('ApporteurService', 'Create')
  async create(data: CreateApporteurRequest) {
    return this.apporteurService.create({
      ...data,
      societeId: data.societe_id || null,
    });
  }

  @GrpcMethod('ApporteurService', 'Update')
  async update(data: UpdateApporteurRequest) {
    const { id, ...updateData } = data;
    return this.apporteurService.update(id, {
      ...updateData,
      societeId: updateData.societe_id === '' ? null : updateData.societe_id,
    });
  }

  @GrpcMethod('ApporteurService', 'Get')
  async get(data: GetApporteurRequest) {
    return this.apporteurService.findById(data.id);
  }

  @GrpcMethod('ApporteurService', 'GetByUtilisateur')
  async getByUtilisateur(data: GetApporteurByUtilisateurRequest) {
    return this.apporteurService.findByUtilisateur(data.utilisateur_id);
  }

  @GrpcMethod('ApporteurService', 'List')
  async list(data: ListApporteurRequest) {
    const result = await this.apporteurService.findAll(
      { search: data.search, typeApporteur: data.type_apporteur, actif: data.actif },
      data.pagination,
    );
    return {
      apporteurs: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ApporteurService', 'ListByOrganisation')
  async listByOrganisation(data: ListApporteurByOrganisationRequest) {
    const result = await this.apporteurService.findByOrganisation(
      data.organisation_id,
      data.actif,
      data.pagination,
    );
    return {
      apporteurs: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @GrpcMethod('ApporteurService', 'Activer')
  async activer(data: ActivateApporteurRequest) {
    return this.apporteurService.activer(data.id);
  }

  @GrpcMethod('ApporteurService', 'Desactiver')
  async desactiver(data: ActivateApporteurRequest) {
    return this.apporteurService.desactiver(data.id);
  }

  @GrpcMethod('ApporteurService', 'Delete')
  async delete(data: DeleteApporteurRequest) {
    const success = await this.apporteurService.delete(data.id);
    return { success };
  }
}

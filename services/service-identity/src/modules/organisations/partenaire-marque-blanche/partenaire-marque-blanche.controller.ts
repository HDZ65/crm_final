import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PartenaireMarqueBlancheService } from './partenaire-marque-blanche.service';

import type {
  CreatePartenaireRequest,
  UpdatePartenaireRequest,
  GetPartenaireRequest,
  ListPartenaireRequest,
  DeletePartenaireRequest,
} from '@crm/proto/organisations';

@Controller()
export class PartenaireMarqueBlancheController {
  constructor(private readonly partenaireService: PartenaireMarqueBlancheService) {}

  @GrpcMethod('PartenaireMarqueBlancheService', 'Create')
  async create(data: CreatePartenaireRequest) {
    return this.partenaireService.create({
      denomination: data.denomination,
      siren: data.siren,
      numeroTva: data.numero_tva,
      contactSupportEmail: data.contact_support_email,
      telephone: data.telephone,
      statutId: data.statut_id,
    });
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Update')
  async update(data: UpdatePartenaireRequest) {
    return this.partenaireService.update({
      id: data.id,
      denomination: data.denomination,
      siren: data.siren,
      numeroTva: data.numero_tva,
      contactSupportEmail: data.contact_support_email,
      telephone: data.telephone,
      statutId: data.statut_id,
    });
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Get')
  async get(data: GetPartenaireRequest) {
    return this.partenaireService.findById(data.id);
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'List')
  async list(data: ListPartenaireRequest) {
    return this.partenaireService.findAll({ search: data.search, statutId: data.statut_id }, data.pagination);
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Delete')
  async delete(data: DeletePartenaireRequest) {
    const success = await this.partenaireService.delete(data.id);
    return { success };
  }
}

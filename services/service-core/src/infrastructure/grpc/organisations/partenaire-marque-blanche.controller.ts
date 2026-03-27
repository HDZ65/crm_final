import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CreatePartenaireRequest,
  DeletePartenaireRequest,
  GetPartenaireRequest,
  ListPartenaireRequest,
  UpdatePartenaireRequest,
} from '@proto/organisations';
import { PartenaireMarqueBlancheService } from '../../persistence/typeorm/repositories/organisations/partenaire-marque-blanche.service';

@Controller()
export class PartenaireMarqueBlancheController {
  constructor(private readonly partenaireService: PartenaireMarqueBlancheService) {}

  @GrpcMethod('PartenaireMarqueBlancheService', 'Create')
  async create(data: CreatePartenaireRequest) {
    return this.partenaireService.create({
      denomination: data.denomination,
      siren: data.siren,
      numeroTva: data.numeroTva,
      contactSupportEmail: data.contactSupportEmail,
      telephone: data.telephone,
      statutId: data.statutId,
    });
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Update')
  async update(data: UpdatePartenaireRequest) {
    return this.partenaireService.update({
      id: data.id,
      denomination: data.denomination,
      siren: data.siren,
      numeroTva: data.numeroTva,
      contactSupportEmail: data.contactSupportEmail,
      telephone: data.telephone,
      statutId: data.statutId,
    });
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Get')
  async get(data: GetPartenaireRequest) {
    return this.partenaireService.findById(data.id);
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'List')
  async list(data: ListPartenaireRequest) {
    return this.partenaireService.findAll({ search: data.search, statutId: data.statutId }, data.pagination);
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Delete')
  async delete(data: DeletePartenaireRequest) {
    const success = await this.partenaireService.delete(data.id);
    return { success };
  }
}

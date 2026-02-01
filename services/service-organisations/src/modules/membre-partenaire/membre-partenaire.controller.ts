import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MembrePartenaireService } from './membre-partenaire.service';

import type {
  CreateMembrePartenaireRequest,
  UpdateMembrePartenaireRequest,
  GetMembrePartenaireRequest,
  ListMembreByPartenaireRequest,
  ListMembreByUtilisateurRequest,
  DeleteMembrePartenaireRequest,
} from '@crm/proto/organisations';

@Controller()
export class MembrePartenaireController {
  constructor(private readonly membrePartenaireService: MembrePartenaireService) {}

  @GrpcMethod('MembrePartenaireService', 'Create')
  async create(data: CreateMembrePartenaireRequest) {
    return this.membrePartenaireService.create({
      utilisateurId: data.utilisateurId,
      partenaireId: data.partenaireId,
      roleId: data.roleId,
    });
  }

  @GrpcMethod('MembrePartenaireService', 'Update')
  async update(data: UpdateMembrePartenaireRequest) {
    return this.membrePartenaireService.update({ id: data.id, roleId: data.roleId });
  }

  @GrpcMethod('MembrePartenaireService', 'Get')
  async get(data: GetMembrePartenaireRequest) {
    return this.membrePartenaireService.findById(data.id);
  }

  @GrpcMethod('MembrePartenaireService', 'ListByPartenaire')
  async listByPartenaire(data: ListMembreByPartenaireRequest) {
    return this.membrePartenaireService.findByPartenaire(data.partenaireId, data.pagination);
  }

  @GrpcMethod('MembrePartenaireService', 'ListByUtilisateur')
  async listByUtilisateur(data: ListMembreByUtilisateurRequest) {
    return this.membrePartenaireService.findByUtilisateur(data.utilisateurId, data.pagination);
  }

  @GrpcMethod('MembrePartenaireService', 'Delete')
  async delete(data: DeleteMembrePartenaireRequest) {
    const success = await this.membrePartenaireService.delete(data.id);
    return { success };
  }
}

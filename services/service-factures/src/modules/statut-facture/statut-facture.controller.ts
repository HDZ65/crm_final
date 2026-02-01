import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StatutFactureService } from './statut-facture.service';

import type {
  CreateStatutFactureRequest,
  UpdateStatutFactureRequest,
  GetStatutFactureRequest,
  GetStatutFactureByCodeRequest,
  ListStatutsFactureRequest,
  DeleteStatutFactureRequest,
} from '@crm/proto/factures';

@Controller()
export class StatutFactureController {
  constructor(private readonly statutService: StatutFactureService) {}

  @GrpcMethod('StatutFactureService', 'Create')
  async createStatut(data: CreateStatutFactureRequest) {
    return this.statutService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
  }

  @GrpcMethod('StatutFactureService', 'Update')
  async updateStatut(data: UpdateStatutFactureRequest) {
    return this.statutService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordreAffichage,
    });
  }

  @GrpcMethod('StatutFactureService', 'Get')
  async getStatut(data: GetStatutFactureRequest) {
    return this.statutService.findById(data.id);
  }

  @GrpcMethod('StatutFactureService', 'GetByCode')
  async getStatutByCode(data: GetStatutFactureByCodeRequest) {
    return this.statutService.findByCode(data.code);
  }

  @GrpcMethod('StatutFactureService', 'List')
  async listStatuts(data: ListStatutsFactureRequest) {
    return this.statutService.findAll({
      page: data.pagination?.page,
      limit: data.pagination?.limit,
    });
  }

  @GrpcMethod('StatutFactureService', 'Delete')
  async deleteStatut(data: DeleteStatutFactureRequest) {
    const success = await this.statutService.delete(data.id);
    return { success };
  }
}

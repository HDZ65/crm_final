import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StatutContratService } from './statut-contrat.service';

import type {
  CreateStatutContratRequest,
  UpdateStatutContratRequest,
  GetStatutContratRequest,
  GetStatutContratByCodeRequest,
  ListStatutContratRequest,
  DeleteStatutContratRequest,
} from '@crm/proto/contrats';

@Controller()
export class StatutContratController {
  constructor(private readonly statutContratService: StatutContratService) {}

  @GrpcMethod('StatutContratService', 'Create')
  async createStatutContrat(data: CreateStatutContratRequest) {
    return this.statutContratService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordre_affichage,
    });
  }

  @GrpcMethod('StatutContratService', 'Update')
  async updateStatutContrat(data: UpdateStatutContratRequest) {
    return this.statutContratService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordre_affichage,
    });
  }

  @GrpcMethod('StatutContratService', 'Get')
  async getStatutContrat(data: GetStatutContratRequest) {
    return this.statutContratService.findById(data.id);
  }

  @GrpcMethod('StatutContratService', 'GetByCode')
  async getStatutContratByCode(data: GetStatutContratByCodeRequest) {
    return this.statutContratService.findByCode(data.code);
  }

  @GrpcMethod('StatutContratService', 'List')
  async listStatutsContrat(data: ListStatutContratRequest) {
    return this.statutContratService.findAll(data.pagination);
  }

  @GrpcMethod('StatutContratService', 'Delete')
  async deleteStatutContrat(data: DeleteStatutContratRequest) {
    const success = await this.statutContratService.delete(data.id);
    return { success };
  }
}

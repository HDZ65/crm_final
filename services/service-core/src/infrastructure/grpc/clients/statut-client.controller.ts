import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StatutClientService } from '../../persistence/typeorm/repositories/clients/statut-client.service';
import type {
  CreateStatutClientRequest,
  UpdateStatutClientRequest,
  GetStatutClientRequest,
  GetStatutClientByCodeRequest,
  ListStatutsClientRequest,
  ListStatutsClientResponse,
  DeleteStatutClientRequest,
  StatutClient,
  DeleteResponse,
} from '@proto/clients';

@Controller()
export class StatutClientController {
  constructor(private readonly statutService: StatutClientService) {}

  @GrpcMethod('StatutClientService', 'Create')
  async createStatut(data: CreateStatutClientRequest) {
    return this.statutService.create({
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordre_affichage,
    });
  }

  @GrpcMethod('StatutClientService', 'Update')
  async updateStatut(data: UpdateStatutClientRequest) {
    return this.statutService.update({
      id: data.id,
      code: data.code,
      nom: data.nom,
      description: data.description,
      ordreAffichage: data.ordre_affichage,
    });
  }

  @GrpcMethod('StatutClientService', 'Get')
  async getStatut(data: GetStatutClientRequest) {
    return this.statutService.findById(data.id);
  }

  @GrpcMethod('StatutClientService', 'GetByCode')
  async getStatutByCode(data: GetStatutClientByCodeRequest) {
    return this.statutService.findByCode(data.code);
  }

  @GrpcMethod('StatutClientService', 'List')
  async listStatuts(data: ListStatutsClientRequest) {
    return this.statutService.findAll(data.pagination);
  }

  @GrpcMethod('StatutClientService', 'Delete')
  async deleteStatut(data: DeleteStatutClientRequest) {
    const success = await this.statutService.delete(data.id);
    return { success };
  }
}

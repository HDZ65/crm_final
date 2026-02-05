import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UtilisateurService } from '../../../../infrastructure/persistence/typeorm/repositories/users/utilisateur.service';
import { AuthSyncService } from '../../../../infrastructure/persistence/typeorm/repositories/users/auth-sync.service';

import type {
  CreateUtilisateurRequest,
  UpdateUtilisateurRequest,
  GetUtilisateurRequest,
  GetByKeycloakIdRequest,
  GetByEmailRequest,
  GetProfileRequest,
  ListUtilisateurRequest,
  DeleteUtilisateurRequest,
} from '@crm/proto/users';

@Controller()
export class UtilisateurController {
  constructor(
    private readonly utilisateurService: UtilisateurService,
    private readonly authSyncService: AuthSyncService,
  ) {}

  @GrpcMethod('UtilisateurService', 'Create')
  async create(data: CreateUtilisateurRequest) {
    return this.utilisateurService.create({
      keycloakId: data.keycloak_id,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      actif: data.actif,
    });
  }

  @GrpcMethod('UtilisateurService', 'Update')
  async update(data: UpdateUtilisateurRequest) {
    return this.utilisateurService.update(data);
  }

  @GrpcMethod('UtilisateurService', 'Get')
  async get(data: GetUtilisateurRequest) {
    return this.utilisateurService.findById(data.id);
  }

  @GrpcMethod('UtilisateurService', 'GetByKeycloakId')
  async getByKeycloakId(data: GetByKeycloakIdRequest) {
    return this.utilisateurService.findByKeycloakId(data.keycloak_id);
  }

  @GrpcMethod('UtilisateurService', 'GetByEmail')
  async getByEmail(data: GetByEmailRequest) {
    return this.utilisateurService.findByEmail(data.email);
  }

  @GrpcMethod('UtilisateurService', 'GetProfile')
  async getProfile(data: GetProfileRequest) {
    return this.authSyncService.getUserProfile(data.keycloak_id);
  }

  @GrpcMethod('UtilisateurService', 'List')
  async list(data: ListUtilisateurRequest) {
    return this.utilisateurService.findAll(
      { search: data.search, actif: data.actif },
      data.pagination,
    );
  }

  @GrpcMethod('UtilisateurService', 'Delete')
  async delete(data: DeleteUtilisateurRequest) {
    const success = await this.utilisateurService.delete(data.id);
    return { success };
  }
}

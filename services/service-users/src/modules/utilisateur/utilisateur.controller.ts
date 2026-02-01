import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UtilisateurService } from './utilisateur.service';
import { AuthSyncService } from '../auth-sync/auth-sync.service';

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
    return this.utilisateurService.create(data);
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
    return this.utilisateurService.findByKeycloakId(data.keycloakId);
  }

  @GrpcMethod('UtilisateurService', 'GetByEmail')
  async getByEmail(data: GetByEmailRequest) {
    return this.utilisateurService.findByEmail(data.email);
  }

  @GrpcMethod('UtilisateurService', 'GetProfile')
  async getProfile(data: GetProfileRequest) {
    return this.authSyncService.getUserProfile(data.keycloakId);
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

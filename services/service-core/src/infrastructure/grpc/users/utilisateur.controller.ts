import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UtilisateurService } from '../../persistence/typeorm/repositories/users/utilisateur.service';
import { AuthSyncService } from '../../persistence/typeorm/repositories/users/auth-sync.service';
import { UtilisateurEntity } from '../../../domain/users/entities';
import type {
  CreateUtilisateurRequest,
  UpdateUtilisateurRequest,
  GetUtilisateurRequest,
  GetByKeycloakIdRequest,
  GetByEmailRequest,
  GetProfileRequest,
  ListUtilisateurRequest,
  ListUtilisateurResponse,
  DeleteUtilisateurRequest,
  Utilisateur,
  UserProfile,
  DeleteResponse,
} from '@proto/users';

/**
 * Map UtilisateurEntity (camelCase) to proto Utilisateur (snake_case).
 * Required because proto-loader uses keepCase: true.
 */
function utilisateurToProto(entity: UtilisateurEntity) {
  return {
    id: entity.id,
    keycloak_id: entity.keycloakId,
    nom: entity.nom,
    prenom: entity.prenom,
    email: entity.email,
    telephone: entity.telephone ?? '',
    actif: entity.actif,
    created_at: entity.createdAt?.toISOString() ?? '',
    updated_at: entity.updatedAt?.toISOString() ?? '',
  };
}

@Controller()
export class UtilisateurController {
  constructor(
    private readonly utilisateurService: UtilisateurService,
    private readonly authSyncService: AuthSyncService,
  ) {}

  @GrpcMethod('UtilisateurService', 'Create')
  async create(data: CreateUtilisateurRequest) {
    const entity = await this.utilisateurService.create({
      keycloakId: data.keycloak_id,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      actif: data.actif,
    });
    return utilisateurToProto(entity);
  }

  @GrpcMethod('UtilisateurService', 'Update')
  async update(data: UpdateUtilisateurRequest) {
    const entity = await this.utilisateurService.update(data);
    return utilisateurToProto(entity);
  }

  @GrpcMethod('UtilisateurService', 'Get')
  async get(data: GetUtilisateurRequest) {
    const entity = await this.utilisateurService.findById(data.id);
    return utilisateurToProto(entity);
  }

  @GrpcMethod('UtilisateurService', 'GetByKeycloakId')
  async getByKeycloakId(data: GetByKeycloakIdRequest) {
    const entity = await this.utilisateurService.findByKeycloakId(data.keycloak_id);
    return utilisateurToProto(entity);
  }

  @GrpcMethod('UtilisateurService', 'GetByEmail')
  async getByEmail(data: GetByEmailRequest) {
    const entity = await this.utilisateurService.findByEmail(data.email);
    return utilisateurToProto(entity);
  }

  @GrpcMethod('UtilisateurService', 'GetProfile')
  async getProfile(data: GetProfileRequest) {
    const profile = await this.authSyncService.getUserProfile(data.keycloak_id);
    if (!profile) return null;
    return {
      utilisateur: utilisateurToProto(profile.utilisateur),
      organisations: profile.organisations.map(org => ({
        organisation_id: org.organisationId,
        organisation_nom: org.organisationNom,
        role: org.role,
        etat: org.etat,
      })),
      has_organisation: profile.hasOrganisation,
    };
  }

  @GrpcMethod('UtilisateurService', 'List')
  async list(data: ListUtilisateurRequest) {
    const result = await this.utilisateurService.findAll(
      { search: data.search, actif: data.actif },
      data.pagination,
    );
    return {
      utilisateurs: result.utilisateurs.map(utilisateurToProto),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('UtilisateurService', 'Delete')
  async delete(data: DeleteUtilisateurRequest) {
    const success = await this.utilisateurService.delete(data.id);
    return { success };
  }
}

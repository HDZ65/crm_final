import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthSyncService } from '../../persistence/typeorm/repositories/users/auth-sync.service';
import { UtilisateurEntity } from '../../../domain/users/entities';
import type {
  SyncKeycloakUserRequest,
  GetByKeycloakIdRequest,
  Utilisateur,
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
export class AuthSyncController {
  constructor(private readonly authSyncService: AuthSyncService) {}

  @GrpcMethod('AuthSyncService', 'SyncKeycloakUser')
  async syncKeycloakUser(data: SyncKeycloakUserRequest) {
    const entity = await this.authSyncService.syncKeycloakUser(data);
    return utilisateurToProto(entity);
  }

  @GrpcMethod('AuthSyncService', 'FindByKeycloakId')
  async findByKeycloakId(data: GetByKeycloakIdRequest) {
    const entity = await this.authSyncService.findByKeycloakId(data.keycloak_id);
    return entity ? utilisateurToProto(entity) : null;
  }
}

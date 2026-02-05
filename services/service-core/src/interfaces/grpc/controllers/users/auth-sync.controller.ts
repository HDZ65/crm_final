import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthSyncService } from '../../../../infrastructure/persistence/typeorm/repositories/users/auth-sync.service';

import type {
  SyncKeycloakUserRequest,
  GetByKeycloakIdRequest,
} from '@crm/proto/users';

@Controller()
export class AuthSyncController {
  constructor(private readonly authSyncService: AuthSyncService) {}

  @GrpcMethod('AuthSyncService', 'SyncKeycloakUser')
  async syncKeycloakUser(data: SyncKeycloakUserRequest) {
    return this.authSyncService.syncKeycloakUser(data);
  }

  @GrpcMethod('AuthSyncService', 'FindByKeycloakId')
  async findByKeycloakId(data: GetByKeycloakIdRequest) {
    return this.authSyncService.findByKeycloakId(data.keycloak_id);
  }
}

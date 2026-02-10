import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  UtilisateurEntity,
  RoleEntity,
  PermissionEntity,
  RolePermissionEntity,
  CompteEntity,
  MembreCompteEntity,
  InvitationCompteEntity,
} from './domain/users/entities';

// Infrastructure services
import {
  UtilisateurService,
  RoleService,
  PermissionService,
  RolePermissionService,
  CompteService,
  MembreCompteService,
  InvitationCompteService,
  AuthSyncService,
} from './infrastructure/persistence/typeorm/repositories/users';

// Interface controllers
import {
  UtilisateurController,
  RoleController,
  PermissionController,
  RolePermissionController,
  CompteController,
  MembreCompteController,
  InvitationCompteController,
  AuthSyncController,
} from './infrastructure/grpc/users';

// Cross-context dependencies
import { OrganisationsModule } from './organisations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UtilisateurEntity,
      RoleEntity,
      PermissionEntity,
      RolePermissionEntity,
      CompteEntity,
      MembreCompteEntity,
      InvitationCompteEntity,
    ]),
    forwardRef(() => OrganisationsModule),
  ],
  controllers: [
    UtilisateurController,
    RoleController,
    PermissionController,
    RolePermissionController,
    CompteController,
    MembreCompteController,
    InvitationCompteController,
    AuthSyncController,
  ],
  providers: [
    UtilisateurService,
    RoleService,
    PermissionService,
    RolePermissionService,
    CompteService,
    MembreCompteService,
    InvitationCompteService,
    AuthSyncService,
  ],
  exports: [
    UtilisateurService,
    RoleService,
    PermissionService,
    RolePermissionService,
    CompteService,
    MembreCompteService,
    InvitationCompteService,
    AuthSyncService,
  ],
})
export class UsersModule {}

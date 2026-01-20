import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { UtilisateurController } from './controllers/utilisateur.controller';
import { RoleController } from './controllers/role.controller';
import { PermissionController } from './controllers/permission.controller';
import { RolePermissionController } from './controllers/role-permission.controller';
import { AuthController } from './controllers/auth.controller';

// Entities
import { UtilisateurEntity } from '../../../db/entities/utilisateur.entity';
import { RoleEntity } from '../../../db/entities/role.entity';
import { PermissionEntity } from '../../../db/entities/permission.entity';
import { RolePermissionEntity } from '../../../db/entities/role-permission.entity';
import { MembreOrganisationEntity } from '../../../db/entities/membre-compte.entity';

// Repositories
import { TypeOrmUtilisateurRepository } from '../../../repositories/typeorm-utilisateur.repository';
import { TypeOrmRoleRepository } from '../../../repositories/typeorm-role.repository';
import { TypeOrmPermissionRepository } from '../../../repositories/typeorm-permission.repository';
import { TypeOrmRolePermissionRepository } from '../../../repositories/typeorm-role-permission.repository';

// Modules for dependencies
import { KeycloakModule } from '../keycloak.module';
import { SecurityModule } from '../security.module';

// Use Cases - Utilisateur
import { CreateUtilisateurUseCase } from '../../../../applications/usecase/utilisateur/create-utilisateur.usecase';
import { GetUtilisateurUseCase } from '../../../../applications/usecase/utilisateur/get-utilisateur.usecase';
import { UpdateUtilisateurUseCase } from '../../../../applications/usecase/utilisateur/update-utilisateur.usecase';
import { DeleteUtilisateurUseCase } from '../../../../applications/usecase/utilisateur/delete-utilisateur.usecase';

// Use Cases - Role
import { CreateRoleUseCase } from '../../../../applications/usecase/role/create-role.usecase';
import { GetRoleUseCase } from '../../../../applications/usecase/role/get-role.usecase';
import { UpdateRoleUseCase } from '../../../../applications/usecase/role/update-role.usecase';
import { DeleteRoleUseCase } from '../../../../applications/usecase/role/delete-role.usecase';

// Use Cases - Permission
import { CreatePermissionUseCase } from '../../../../applications/usecase/permission/create-permission.usecase';
import { GetPermissionUseCase } from '../../../../applications/usecase/permission/get-permission.usecase';
import { UpdatePermissionUseCase } from '../../../../applications/usecase/permission/update-permission.usecase';
import { DeletePermissionUseCase } from '../../../../applications/usecase/permission/delete-permission.usecase';

// Use Cases - RolePermission
import { CreateRolePermissionUseCase } from '../../../../applications/usecase/role-permission/create-role-permission.usecase';
import { GetRolePermissionUseCase } from '../../../../applications/usecase/role-permission/get-role-permission.usecase';
import { UpdateRolePermissionUseCase } from '../../../../applications/usecase/role-permission/update-role-permission.usecase';
import { DeleteRolePermissionUseCase } from '../../../../applications/usecase/role-permission/delete-role-permission.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UtilisateurEntity,
      RoleEntity,
      PermissionEntity,
      RolePermissionEntity,
      MembreOrganisationEntity,
    ]),
    // Required for @Public() decorator and Keycloak guards
    KeycloakModule,
    // Provides AuthSyncService
    SecurityModule,
  ],
  controllers: [
    UtilisateurController,
    RoleController,
    PermissionController,
    RolePermissionController,
    AuthController,
  ],
  providers: [
    // Utilisateur
    {
      provide: 'UtilisateurRepositoryPort',
      useClass: TypeOrmUtilisateurRepository,
    },
    CreateUtilisateurUseCase,
    GetUtilisateurUseCase,
    UpdateUtilisateurUseCase,
    DeleteUtilisateurUseCase,

    // Role
    {
      provide: 'RoleRepositoryPort',
      useClass: TypeOrmRoleRepository,
    },
    CreateRoleUseCase,
    GetRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,

    // Permission
    {
      provide: 'PermissionRepositoryPort',
      useClass: TypeOrmPermissionRepository,
    },
    CreatePermissionUseCase,
    GetPermissionUseCase,
    UpdatePermissionUseCase,
    DeletePermissionUseCase,

    // RolePermission
    {
      provide: 'RolePermissionRepositoryPort',
      useClass: TypeOrmRolePermissionRepository,
    },
    CreateRolePermissionUseCase,
    GetRolePermissionUseCase,
    UpdateRolePermissionUseCase,
    DeleteRolePermissionUseCase,
  ],
  exports: [
    'UtilisateurRepositoryPort',
    'RoleRepositoryPort',
    'PermissionRepositoryPort',
    'RolePermissionRepositoryPort',
  ],
})
export class UtilisateurModule {}

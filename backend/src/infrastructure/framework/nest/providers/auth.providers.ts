/**
 * Auth Providers - Utilisateur & Role
 * Regroupement des providers liés à l'authentification et aux rôles
 */

import { CreateUtilisateurUseCase } from '../../../../applications/usecase/utilisateur/create-utilisateur.usecase';
import { GetUtilisateurUseCase } from '../../../../applications/usecase/utilisateur/get-utilisateur.usecase';
import { UpdateUtilisateurUseCase } from '../../../../applications/usecase/utilisateur/update-utilisateur.usecase';
import { DeleteUtilisateurUseCase } from '../../../../applications/usecase/utilisateur/delete-utilisateur.usecase';
import { TypeOrmUtilisateurRepository } from '../../../repositories/typeorm-utilisateur.repository';

import { CreateRoleUseCase } from '../../../../applications/usecase/role/create-role.usecase';
import { GetRoleUseCase } from '../../../../applications/usecase/role/get-role.usecase';
import { UpdateRoleUseCase } from '../../../../applications/usecase/role/update-role.usecase';
import { DeleteRoleUseCase } from '../../../../applications/usecase/role/delete-role.usecase';
import { TypeOrmRoleRepository } from '../../../repositories/typeorm-role.repository';

export const AUTH_PROVIDERS = [
  // Utilisateur Use Cases
  CreateUtilisateurUseCase,
  GetUtilisateurUseCase,
  UpdateUtilisateurUseCase,
  DeleteUtilisateurUseCase,

  // Utilisateur Repository
  {
    provide: 'UtilisateurRepositoryPort',
    useClass: TypeOrmUtilisateurRepository,
  },

  // Role Use Cases
  CreateRoleUseCase,
  GetRoleUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase,

  // Role Repository
  {
    provide: 'RoleRepositoryPort',
    useClass: TypeOrmRoleRepository,
  },
];

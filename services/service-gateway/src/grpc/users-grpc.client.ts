import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface UtilisateurServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByKeycloakId(data: Record<string, unknown>): Observable<unknown>;
  GetByEmail(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  GetProfile(data: Record<string, unknown>): Observable<unknown>;
}

export interface AuthSyncServiceClient {
  SyncKeycloakUser(data: Record<string, unknown>): Observable<unknown>;
  FindByKeycloakId(data: Record<string, unknown>): Observable<unknown>;
}

export interface RoleServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByCode(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface PermissionServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByCode(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface RolePermissionServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByRole(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface CompteServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  CreateWithOwner(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface MembreCompteServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByOrganisation(data: Record<string, unknown>): Observable<unknown>;
  ListByUtilisateur(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface InvitationCompteServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByToken(data: Record<string, unknown>): Observable<unknown>;
  ListByOrganisation(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  AcceptInvitation(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class UsersGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(UsersGrpcClient.name);

  private utilisateurService: UtilisateurServiceClient;
  private authSyncService: AuthSyncServiceClient;
  private roleService: RoleServiceClient;
  private permissionService: PermissionServiceClient;
  private rolePermissionService: RolePermissionServiceClient;
  private compteService: CompteServiceClient;
  private membreCompteService: MembreCompteServiceClient;
  private invitationCompteService: InvitationCompteServiceClient;

  constructor(@Inject('CORE_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.utilisateurService =
      this.client.getService<UtilisateurServiceClient>('UtilisateurService');
    this.authSyncService =
      this.client.getService<AuthSyncServiceClient>('AuthSyncService');
    this.roleService = this.client.getService<RoleServiceClient>('RoleService');
    this.permissionService =
      this.client.getService<PermissionServiceClient>('PermissionService');
    this.rolePermissionService =
      this.client.getService<RolePermissionServiceClient>('RolePermissionService');
    this.compteService = this.client.getService<CompteServiceClient>('CompteService');
    this.membreCompteService =
      this.client.getService<MembreCompteServiceClient>('MembreCompteService');
    this.invitationCompteService =
      this.client.getService<InvitationCompteServiceClient>('InvitationCompteService');
  }

  createUtilisateur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.utilisateurService.Create(data),
      this.logger,
      'UtilisateurService',
      'Create',
    );
  }

  updateUtilisateur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.utilisateurService.Update(data),
      this.logger,
      'UtilisateurService',
      'Update',
    );
  }

  getUtilisateur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.utilisateurService.Get(data),
      this.logger,
      'UtilisateurService',
      'Get',
    );
  }

  getUtilisateurByKeycloakId(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.utilisateurService.GetByKeycloakId(data),
      this.logger,
      'UtilisateurService',
      'GetByKeycloakId',
    );
  }

  getUtilisateurByEmail(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.utilisateurService.GetByEmail(data),
      this.logger,
      'UtilisateurService',
      'GetByEmail',
    );
  }

  listUtilisateurs(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.utilisateurService.List(data),
      this.logger,
      'UtilisateurService',
      'List',
    );
  }

  deleteUtilisateur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.utilisateurService.Delete(data),
      this.logger,
      'UtilisateurService',
      'Delete',
    );
  }

  getUtilisateurProfile(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.utilisateurService.GetProfile(data),
      this.logger,
      'UtilisateurService',
      'GetProfile',
    );
  }

  syncKeycloakUser(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.authSyncService.SyncKeycloakUser(data),
      this.logger,
      'AuthSyncService',
      'SyncKeycloakUser',
    );
  }

  findAuthSyncByKeycloakId(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.authSyncService.FindByKeycloakId(data),
      this.logger,
      'AuthSyncService',
      'FindByKeycloakId',
    );
  }

  createRole(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.roleService.Create(data), this.logger, 'RoleService', 'Create');
  }

  updateRole(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.roleService.Update(data), this.logger, 'RoleService', 'Update');
  }

  getRole(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.roleService.Get(data), this.logger, 'RoleService', 'Get');
  }

  getRoleByCode(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.roleService.GetByCode(data),
      this.logger,
      'RoleService',
      'GetByCode',
    );
  }

  listRoles(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.roleService.List(data), this.logger, 'RoleService', 'List');
  }

  deleteRole(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.roleService.Delete(data), this.logger, 'RoleService', 'Delete');
  }

  createPermission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.permissionService.Create(data),
      this.logger,
      'PermissionService',
      'Create',
    );
  }

  updatePermission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.permissionService.Update(data),
      this.logger,
      'PermissionService',
      'Update',
    );
  }

  getPermission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.permissionService.Get(data),
      this.logger,
      'PermissionService',
      'Get',
    );
  }

  getPermissionByCode(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.permissionService.GetByCode(data),
      this.logger,
      'PermissionService',
      'GetByCode',
    );
  }

  listPermissions(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.permissionService.List(data),
      this.logger,
      'PermissionService',
      'List',
    );
  }

  deletePermission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.permissionService.Delete(data),
      this.logger,
      'PermissionService',
      'Delete',
    );
  }

  createRolePermission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.rolePermissionService.Create(data),
      this.logger,
      'RolePermissionService',
      'Create',
    );
  }

  getRolePermission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.rolePermissionService.Get(data),
      this.logger,
      'RolePermissionService',
      'Get',
    );
  }

  listRolePermissionsByRole(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.rolePermissionService.ListByRole(data),
      this.logger,
      'RolePermissionService',
      'ListByRole',
    );
  }

  deleteRolePermission(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.rolePermissionService.Delete(data),
      this.logger,
      'RolePermissionService',
      'Delete',
    );
  }

  createCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.compteService.Create(data),
      this.logger,
      'CompteService',
      'Create',
    );
  }

  createCompteWithOwner(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.compteService.CreateWithOwner(data),
      this.logger,
      'CompteService',
      'CreateWithOwner',
    );
  }

  updateCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.compteService.Update(data),
      this.logger,
      'CompteService',
      'Update',
    );
  }

  getCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.compteService.Get(data), this.logger, 'CompteService', 'Get');
  }

  listComptes(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.compteService.List(data), this.logger, 'CompteService', 'List');
  }

  deleteCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.compteService.Delete(data),
      this.logger,
      'CompteService',
      'Delete',
    );
  }

  createMembreCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.membreCompteService.Create(data),
      this.logger,
      'MembreCompteService',
      'Create',
    );
  }

  updateMembreCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.membreCompteService.Update(data),
      this.logger,
      'MembreCompteService',
      'Update',
    );
  }

  getMembreCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.membreCompteService.Get(data),
      this.logger,
      'MembreCompteService',
      'Get',
    );
  }

  listMembresCompteByOrganisation(
    data: Record<string, unknown>,
  ): Observable<unknown> {
    return wrapGrpcCall(
      this.membreCompteService.ListByOrganisation(data),
      this.logger,
      'MembreCompteService',
      'ListByOrganisation',
    );
  }

  listMembresCompteByUtilisateur(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.membreCompteService.ListByUtilisateur(data),
      this.logger,
      'MembreCompteService',
      'ListByUtilisateur',
    );
  }

  deleteMembreCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.membreCompteService.Delete(data),
      this.logger,
      'MembreCompteService',
      'Delete',
    );
  }

  createInvitationCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.invitationCompteService.Create(data),
      this.logger,
      'InvitationCompteService',
      'Create',
    );
  }

  updateInvitationCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.invitationCompteService.Update(data),
      this.logger,
      'InvitationCompteService',
      'Update',
    );
  }

  getInvitationCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.invitationCompteService.Get(data),
      this.logger,
      'InvitationCompteService',
      'Get',
    );
  }

  getInvitationCompteByToken(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.invitationCompteService.GetByToken(data),
      this.logger,
      'InvitationCompteService',
      'GetByToken',
    );
  }

  listInvitationsCompteByOrganisation(
    data: Record<string, unknown>,
  ): Observable<unknown> {
    return wrapGrpcCall(
      this.invitationCompteService.ListByOrganisation(data),
      this.logger,
      'InvitationCompteService',
      'ListByOrganisation',
    );
  }

  deleteInvitationCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.invitationCompteService.Delete(data),
      this.logger,
      'InvitationCompteService',
      'Delete',
    );
  }

  acceptInvitationCompte(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.invitationCompteService.AcceptInvitation(data),
      this.logger,
      'InvitationCompteService',
      'AcceptInvitation',
    );
  }
}

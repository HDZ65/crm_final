import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import type {
  Utilisateur,
  UserProfile,
  UserOrganisation,
  CreateUtilisateurRequest,
  UpdateUtilisateurRequest,
  GetUtilisateurRequest,
  GetByKeycloakIdRequest,
  GetByEmailRequest,
  GetProfileRequest,
  ListUtilisateurRequest,
  ListUtilisateurResponse,
  DeleteUtilisateurRequest,
  SyncKeycloakUserRequest,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  GetRoleRequest,
  GetRoleByCodeRequest,
  ListRoleRequest,
  ListRoleResponse,
  DeleteRoleRequest,
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  GetPermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionRequest,
  ListPermissionResponse,
  DeletePermissionRequest,
  RolePermission,
  CreateRolePermissionRequest,
  GetRolePermissionRequest,
  ListByRoleRequest,
  ListRolePermissionResponse,
  DeleteRolePermissionRequest,
  Compte,
  CompteWithOwner,
  CreateCompteRequest,
  CreateCompteWithOwnerRequest,
  UpdateCompteRequest,
  GetCompteRequest,
  ListCompteRequest,
  ListCompteResponse,
  DeleteCompteRequest,
  MembreCompte,
  CreateMembreCompteRequest,
  UpdateMembreCompteRequest,
  GetMembreCompteRequest,
  ListByOrganisationRequest,
  ListByUtilisateurRequest,
  ListMembreCompteResponse,
  DeleteMembreCompteRequest,
  InvitationCompte,
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
  GetInvitationCompteRequest,
  GetByTokenRequest,
  ListInvitationByOrganisationRequest,
  ListInvitationCompteResponse,
  DeleteInvitationCompteRequest,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  DeleteResponse,
} from '@proto/organisations/users';

import { UtilisateurService } from './modules/utilisateur/utilisateur.service';
import { RoleService } from './modules/role/role.service';
import { PermissionService } from './modules/permission/permission.service';
import { RolePermissionService } from './modules/role-permission/role-permission.service';
import { CompteService } from './modules/compte/compte.service';
import { MembreCompteService } from './modules/membre-compte/membre-compte.service';
import { InvitationCompteService } from './modules/invitation-compte/invitation-compte.service';
import { AuthSyncService, KeycloakUser } from './modules/auth-sync/auth-sync.service';

function toProtoDate(date: Date | null | undefined): string {
  return date ? date.toISOString() : '';
}

@Controller()
export class UsersController {
  constructor(
    private readonly utilisateurService: UtilisateurService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly rolePermissionService: RolePermissionService,
    private readonly compteService: CompteService,
    private readonly membreCompteService: MembreCompteService,
    private readonly invitationCompteService: InvitationCompteService,
    private readonly authSyncService: AuthSyncService,
  ) {}

  // ===== UTILISATEUR =====

  @GrpcMethod('UtilisateurService', 'Create')
  async createUtilisateur(data: CreateUtilisateurRequest): Promise<Utilisateur> {
    const entity = await this.utilisateurService.create({
      keycloakId: data.keycloakId,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      actif: data.actif,
    });
    return this.mapUtilisateur(entity);
  }

  @GrpcMethod('UtilisateurService', 'Update')
  async updateUtilisateur(data: UpdateUtilisateurRequest): Promise<Utilisateur> {
    const entity = await this.utilisateurService.update(data);
    return this.mapUtilisateur(entity);
  }

  @GrpcMethod('UtilisateurService', 'Get')
  async getUtilisateur(data: GetUtilisateurRequest): Promise<Utilisateur> {
    const entity = await this.utilisateurService.findById(data.id);
    return this.mapUtilisateur(entity);
  }

  @GrpcMethod('UtilisateurService', 'GetByKeycloakId')
  async getByKeycloakId(data: GetByKeycloakIdRequest): Promise<Utilisateur> {
    const entity = await this.utilisateurService.findByKeycloakId(data.keycloakId);
    if (!entity) {
      return { id: '', keycloakId: '', nom: '', prenom: '', email: '', telephone: '', actif: false, createdAt: '', updatedAt: '' };
    }
    return this.mapUtilisateur(entity);
  }

  @GrpcMethod('UtilisateurService', 'GetByEmail')
  async getByEmail(data: GetByEmailRequest): Promise<Utilisateur> {
    const entity = await this.utilisateurService.findByEmail(data.email);
    if (!entity) {
      return { id: '', keycloakId: '', nom: '', prenom: '', email: '', telephone: '', actif: false, createdAt: '', updatedAt: '' };
    }
    return this.mapUtilisateur(entity);
  }

  @GrpcMethod('UtilisateurService', 'GetProfile')
  async getProfile(data: GetProfileRequest): Promise<UserProfile> {
    const profile = await this.authSyncService.getUserProfile(data.keycloakId);
    if (!profile) {
      return { utilisateur: undefined, organisations: [], hasOrganisation: false };
    }
    return {
      utilisateur: this.mapUtilisateur(profile.utilisateur),
      organisations: profile.organisations.map((org): UserOrganisation => ({
        organisationId: org.organisationId,
        organisationNom: org.organisationNom,
        role: { id: org.role.id, code: org.role.code, nom: org.role.nom },
        etat: org.etat,
      })),
      hasOrganisation: profile.hasOrganisation,
    };
  }

  @GrpcMethod('UtilisateurService', 'List')
  async listUtilisateurs(data: ListUtilisateurRequest): Promise<ListUtilisateurResponse> {
    const result = await this.utilisateurService.findAll(
      { search: data.search, actif: data.actif },
      data.pagination,
    );
    return {
      utilisateurs: result.utilisateurs.map((u) => this.mapUtilisateur(u)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('UtilisateurService', 'Delete')
  async deleteUtilisateur(data: DeleteUtilisateurRequest): Promise<DeleteResponse> {
    const success = await this.utilisateurService.delete(data.id);
    return { success };
  }

  private mapUtilisateur(entity: any): Utilisateur {
    return {
      id: entity.id,
      keycloakId: entity.keycloakId,
      nom: entity.nom,
      prenom: entity.prenom,
      email: entity.email,
      telephone: entity.telephone || '',
      actif: entity.actif,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== AUTH SYNC =====

  @GrpcMethod('AuthSyncService', 'SyncKeycloakUser')
  async syncKeycloakUser(data: SyncKeycloakUserRequest): Promise<Utilisateur> {
    const keycloakUser: KeycloakUser = {
      sub: data.sub,
      email: data.email,
      given_name: data.givenName,
      family_name: data.familyName,
      preferred_username: data.preferredUsername,
      name: data.name,
    };
    const entity = await this.authSyncService.syncKeycloakUser(keycloakUser);
    return this.mapUtilisateur(entity);
  }

  @GrpcMethod('AuthSyncService', 'FindByKeycloakId')
  async findByKeycloakId(data: GetByKeycloakIdRequest): Promise<Utilisateur> {
    const entity = await this.authSyncService.findByKeycloakId(data.keycloakId);
    if (!entity) {
      return { id: '', keycloakId: '', nom: '', prenom: '', email: '', telephone: '', actif: false, createdAt: '', updatedAt: '' };
    }
    return this.mapUtilisateur(entity);
  }

  // ===== ROLE =====

  @GrpcMethod('RoleService', 'Create')
  async createRole(data: CreateRoleRequest): Promise<Role> {
    const entity = await this.roleService.create(data);
    return this.mapRole(entity);
  }

  @GrpcMethod('RoleService', 'Update')
  async updateRole(data: UpdateRoleRequest): Promise<Role> {
    const entity = await this.roleService.update(data);
    return this.mapRole(entity);
  }

  @GrpcMethod('RoleService', 'Get')
  async getRole(data: GetRoleRequest): Promise<Role> {
    const entity = await this.roleService.findById(data.id);
    return this.mapRole(entity);
  }

  @GrpcMethod('RoleService', 'GetByCode')
  async getRoleByCode(data: GetRoleByCodeRequest): Promise<Role> {
    const entity = await this.roleService.findByCode(data.code);
    return this.mapRole(entity);
  }

  @GrpcMethod('RoleService', 'List')
  async listRoles(data: ListRoleRequest): Promise<ListRoleResponse> {
    const result = await this.roleService.findAll(data.pagination);
    return {
      roles: result.roles.map((r) => this.mapRole(r)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('RoleService', 'Delete')
  async deleteRole(data: DeleteRoleRequest): Promise<DeleteResponse> {
    const success = await this.roleService.delete(data.id);
    return { success };
  }

  private mapRole(entity: any): Role {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description || '',
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== PERMISSION =====

  @GrpcMethod('PermissionService', 'Create')
  async createPermission(data: CreatePermissionRequest): Promise<Permission> {
    const entity = await this.permissionService.create(data);
    return this.mapPermission(entity);
  }

  @GrpcMethod('PermissionService', 'Update')
  async updatePermission(data: UpdatePermissionRequest): Promise<Permission> {
    const entity = await this.permissionService.update(data);
    return this.mapPermission(entity);
  }

  @GrpcMethod('PermissionService', 'Get')
  async getPermission(data: GetPermissionRequest): Promise<Permission> {
    const entity = await this.permissionService.findById(data.id);
    return this.mapPermission(entity);
  }

  @GrpcMethod('PermissionService', 'GetByCode')
  async getPermissionByCode(data: GetPermissionByCodeRequest): Promise<Permission> {
    const entity = await this.permissionService.findByCode(data.code);
    return this.mapPermission(entity);
  }

  @GrpcMethod('PermissionService', 'List')
  async listPermissions(data: ListPermissionRequest): Promise<ListPermissionResponse> {
    const result = await this.permissionService.findAll(data.pagination);
    return {
      permissions: result.permissions.map((p) => this.mapPermission(p)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('PermissionService', 'Delete')
  async deletePermission(data: DeletePermissionRequest): Promise<DeleteResponse> {
    const success = await this.permissionService.delete(data.id);
    return { success };
  }

  private mapPermission(entity: any): Permission {
    return {
      id: entity.id,
      code: entity.code,
      description: entity.description || '',
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== ROLE PERMISSION =====

  @GrpcMethod('RolePermissionService', 'Create')
  async createRolePermission(data: CreateRolePermissionRequest): Promise<RolePermission> {
    const entity = await this.rolePermissionService.create({
      roleId: data.roleId,
      permissionId: data.permissionId,
    });
    return this.mapRolePermission(entity);
  }

  @GrpcMethod('RolePermissionService', 'Get')
  async getRolePermission(data: GetRolePermissionRequest): Promise<RolePermission> {
    const entity = await this.rolePermissionService.findById(data.id);
    return this.mapRolePermission(entity);
  }

  @GrpcMethod('RolePermissionService', 'ListByRole')
  async listRolePermissions(data: ListByRoleRequest): Promise<ListRolePermissionResponse> {
    const result = await this.rolePermissionService.findByRole(data.roleId, data.pagination);
    return {
      rolePermissions: result.rolePermissions.map((rp) => this.mapRolePermission(rp)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('RolePermissionService', 'Delete')
  async deleteRolePermission(data: DeleteRolePermissionRequest): Promise<DeleteResponse> {
    const success = await this.rolePermissionService.delete(data.id);
    return { success };
  }

  private mapRolePermission(entity: any): RolePermission {
    return {
      id: entity.id,
      roleId: entity.roleId,
      permissionId: entity.permissionId,
      createdAt: toProtoDate(entity.createdAt),
    };
  }

  // ===== COMPTE =====

  @GrpcMethod('CompteService', 'Create')
  async createCompte(data: CreateCompteRequest): Promise<Compte> {
    const entity = await this.compteService.create({
      nom: data.nom,
      etat: data.etat,
      createdByUserId: data.createdByUserId,
    });
    return this.mapCompte(entity);
  }

  @GrpcMethod('CompteService', 'CreateWithOwner')
  async createCompteWithOwner(data: CreateCompteWithOwnerRequest): Promise<CompteWithOwner> {
    const keycloakUser: KeycloakUser = {
      sub: data.keycloakUser?.sub || '',
      email: data.keycloakUser?.email || '',
      given_name: data.keycloakUser?.givenName,
      family_name: data.keycloakUser?.familyName,
      preferred_username: data.keycloakUser?.preferredUsername,
      name: data.keycloakUser?.name,
    };
    const owner = await this.authSyncService.syncKeycloakUser(keycloakUser);

    const compte = await this.compteService.create({
      nom: data.nom,
      etat: 'actif',
      createdByUserId: owner.id,
    });

    let ownerRole;
    try {
      ownerRole = await this.roleService.findByCode('owner');
    } catch {
      ownerRole = await this.roleService.create({
        code: 'owner',
        nom: 'Proprietaire',
        description: 'Proprietaire du compte',
      });
    }

    const membre = await this.membreCompteService.create({
      organisationId: compte.id,
      utilisateurId: owner.id,
      roleId: ownerRole.id,
      etat: 'actif',
    });

    return {
      compte: this.mapCompte(compte),
      owner: this.mapUtilisateur(owner),
      membre: this.mapMembreCompte(membre),
    };
  }

  @GrpcMethod('CompteService', 'Update')
  async updateCompte(data: UpdateCompteRequest): Promise<Compte> {
    const entity = await this.compteService.update(data);
    return this.mapCompte(entity);
  }

  @GrpcMethod('CompteService', 'Get')
  async getCompte(data: GetCompteRequest): Promise<Compte> {
    const entity = await this.compteService.findById(data.id);
    return this.mapCompte(entity);
  }

  @GrpcMethod('CompteService', 'List')
  async listComptes(data: ListCompteRequest): Promise<ListCompteResponse> {
    const result = await this.compteService.findAll(
      { search: data.search, etat: data.etat },
      data.pagination,
    );
    return {
      comptes: result.comptes.map((c) => this.mapCompte(c)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('CompteService', 'Delete')
  async deleteCompte(data: DeleteCompteRequest): Promise<DeleteResponse> {
    const success = await this.compteService.delete(data.id);
    return { success };
  }

  private mapCompte(entity: any): Compte {
    return {
      id: entity.id,
      nom: entity.nom,
      etat: entity.etat,
      dateCreation: toProtoDate(entity.dateCreation),
      createdByUserId: entity.createdByUserId || '',
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== MEMBRE COMPTE =====

  @GrpcMethod('MembreCompteService', 'Create')
  async createMembreCompte(data: CreateMembreCompteRequest): Promise<MembreCompte> {
    const entity = await this.membreCompteService.create({
      organisationId: data.organisationId,
      utilisateurId: data.utilisateurId,
      roleId: data.roleId,
      etat: data.etat,
    });
    return this.mapMembreCompte(entity);
  }

  @GrpcMethod('MembreCompteService', 'Update')
  async updateMembreCompte(data: UpdateMembreCompteRequest): Promise<MembreCompte> {
    const entity = await this.membreCompteService.update({
      id: data.id,
      roleId: data.roleId,
      etat: data.etat,
    });
    return this.mapMembreCompte(entity);
  }

  @GrpcMethod('MembreCompteService', 'Get')
  async getMembreCompte(data: GetMembreCompteRequest): Promise<MembreCompte> {
    const entity = await this.membreCompteService.findById(data.id);
    return this.mapMembreCompte(entity);
  }

  @GrpcMethod('MembreCompteService', 'ListByOrganisation')
  async listMembresByOrganisation(data: ListByOrganisationRequest): Promise<ListMembreCompteResponse> {
    const result = await this.membreCompteService.findByOrganisation(data.organisationId, data.pagination);
    return {
      membres: result.membres.map((m) => this.mapMembreCompte(m)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('MembreCompteService', 'ListByUtilisateur')
  async listMembresByUtilisateur(data: ListByUtilisateurRequest): Promise<ListMembreCompteResponse> {
    const result = await this.membreCompteService.findByUtilisateur(data.utilisateurId, data.pagination);
    return {
      membres: result.membres.map((m) => this.mapMembreCompte(m)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('MembreCompteService', 'Delete')
  async deleteMembreCompte(data: DeleteMembreCompteRequest): Promise<DeleteResponse> {
    const success = await this.membreCompteService.delete(data.id);
    return { success };
  }

  private mapMembreCompte(entity: any): MembreCompte {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      utilisateurId: entity.utilisateurId,
      roleId: entity.roleId,
      etat: entity.etat,
      dateInvitation: toProtoDate(entity.dateInvitation),
      dateActivation: toProtoDate(entity.dateActivation),
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== INVITATION COMPTE =====

  @GrpcMethod('InvitationCompteService', 'Create')
  async createInvitationCompte(data: CreateInvitationCompteRequest): Promise<InvitationCompte> {
    const entity = await this.invitationCompteService.create({
      organisationId: data.organisationId,
      emailInvite: data.emailInvite,
      roleId: data.roleId,
      expireDays: data.expireDays,
    });
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'Update')
  async updateInvitationCompte(data: UpdateInvitationCompteRequest): Promise<InvitationCompte> {
    const entity = await this.invitationCompteService.update({
      id: data.id,
      roleId: data.roleId,
      etat: data.etat,
    });
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'Get')
  async getInvitationCompte(data: GetInvitationCompteRequest): Promise<InvitationCompte> {
    const entity = await this.invitationCompteService.findById(data.id);
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'GetByToken')
  async getInvitationByToken(data: GetByTokenRequest): Promise<InvitationCompte> {
    const entity = await this.invitationCompteService.findByToken(data.token);
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'ListByOrganisation')
  async listInvitationsByOrganisation(data: ListInvitationByOrganisationRequest): Promise<ListInvitationCompteResponse> {
    const result = await this.invitationCompteService.findByOrganisation(
      data.organisationId,
      data.etat,
      data.pagination,
    );
    return {
      invitations: result.invitations.map((i) => this.mapInvitationCompte(i)),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('InvitationCompteService', 'Delete')
  async deleteInvitationCompte(data: DeleteInvitationCompteRequest): Promise<DeleteResponse> {
    const success = await this.invitationCompteService.delete(data.id);
    return { success };
  }

  @GrpcMethod('InvitationCompteService', 'AcceptInvitation')
  async acceptInvitation(data: AcceptInvitationRequest): Promise<AcceptInvitationResponse> {
    const validation = await this.invitationCompteService.isTokenValid(data.token);
    if (!validation.valid || !validation.invitation) {
      return { success: false, message: validation.reason || 'Invalid invitation', membre: undefined };
    }

    const invitation = validation.invitation;

    const keycloakUser: KeycloakUser = {
      sub: data.keycloakUser?.sub || '',
      email: data.keycloakUser?.email || '',
      given_name: data.keycloakUser?.givenName,
      family_name: data.keycloakUser?.familyName,
      preferred_username: data.keycloakUser?.preferredUsername,
      name: data.keycloakUser?.name,
    };
    const user = await this.authSyncService.syncKeycloakUser(keycloakUser);

    const membre = await this.membreCompteService.create({
      organisationId: invitation.organisationId,
      utilisateurId: user.id,
      roleId: invitation.roleId,
      etat: 'actif',
    });

    await this.invitationCompteService.markAsAccepted(invitation.id);

    return {
      success: true,
      message: 'Invitation accepted successfully',
      membre: this.mapMembreCompte(membre),
    };
  }

  private mapInvitationCompte(entity: any): InvitationCompte {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      emailInvite: entity.emailInvite,
      roleId: entity.roleId,
      token: entity.token,
      expireAt: toProtoDate(entity.expireAt),
      etat: entity.etat,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }
}

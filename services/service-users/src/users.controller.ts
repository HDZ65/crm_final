import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

import type {
  CreateUtilisateurRequest,
  UpdateUtilisateurRequest,
  GetUtilisateurRequest,
  GetByKeycloakIdRequest,
  GetByEmailRequest,
  GetProfileRequest,
  ListUtilisateurRequest,
  DeleteUtilisateurRequest,
  SyncKeycloakUserRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  GetRoleRequest,
  GetRoleByCodeRequest,
  ListRoleRequest,
  DeleteRoleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  GetPermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionRequest,
  DeletePermissionRequest,
  CreateRolePermissionRequest,
  GetRolePermissionRequest,
  ListByRoleRequest,
  DeleteRolePermissionRequest,
  CreateCompteRequest,
  CreateCompteWithOwnerRequest,
  UpdateCompteRequest,
  GetCompteRequest,
  ListCompteRequest,
  DeleteCompteRequest,
  CreateMembreCompteRequest,
  UpdateMembreCompteRequest,
  GetMembreCompteRequest,
  ListByOrganisationRequest,
  ListByUtilisateurRequest,
  DeleteMembreCompteRequest,
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
  GetInvitationCompteRequest,
  GetByTokenRequest,
  ListInvitationByOrganisationRequest,
  DeleteInvitationCompteRequest,
  AcceptInvitationRequest,
} from '@proto/organisations/users';

import { UtilisateurService } from './modules/utilisateur/utilisateur.service';
import { RoleService } from './modules/role/role.service';
import { PermissionService } from './modules/permission/permission.service';
import { RolePermissionService } from './modules/role-permission/role-permission.service';
import { CompteService } from './modules/compte/compte.service';
import { MembreCompteService } from './modules/membre-compte/membre-compte.service';
import { InvitationCompteService } from './modules/invitation-compte/invitation-compte.service';
import { AuthSyncService, KeycloakUser } from './modules/auth-sync/auth-sync.service';
import { OrganisationsClientService } from './modules/organisations-client/organisations-client.service';

const EMPTY_USER = { id: '', keycloakId: '', nom: '', prenom: '', email: '', telephone: '', actif: false, createdAt: '', updatedAt: '' };

@Controller()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly utilisateurService: UtilisateurService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly rolePermissionService: RolePermissionService,
    private readonly compteService: CompteService,
    private readonly membreCompteService: MembreCompteService,
    private readonly invitationCompteService: InvitationCompteService,
    private readonly authSyncService: AuthSyncService,
    private readonly organisationsClientService: OrganisationsClientService,
  ) {}

  @GrpcMethod('UtilisateurService', 'Create')
  async createUtilisateur(data: CreateUtilisateurRequest) {
    return this.utilisateurService.create({
      keycloakId: data.keycloakId,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      actif: data.actif,
    });
  }

  @GrpcMethod('UtilisateurService', 'Update')
  async updateUtilisateur(data: UpdateUtilisateurRequest) {
    return this.utilisateurService.update(data);
  }

  @GrpcMethod('UtilisateurService', 'Get')
  async getUtilisateur(data: GetUtilisateurRequest) {
    return this.utilisateurService.findById(data.id);
  }

  @GrpcMethod('UtilisateurService', 'GetByKeycloakId')
  async getByKeycloakId(data: GetByKeycloakIdRequest) {
    const entity = await this.utilisateurService.findByKeycloakId(data.keycloakId);
    return entity ?? EMPTY_USER;
  }

  @GrpcMethod('UtilisateurService', 'GetByEmail')
  async getByEmail(data: GetByEmailRequest) {
    const entity = await this.utilisateurService.findByEmail(data.email);
    return entity ?? EMPTY_USER;
  }

  @GrpcMethod('UtilisateurService', 'GetProfile')
  async getProfile(data: GetProfileRequest) {
    const profile = await this.authSyncService.getUserProfile(data.keycloakId);
    if (!profile) {
      return { utilisateur: undefined, organisations: [], hasOrganisation: false };
    }
    return {
      utilisateur: profile.utilisateur,
      organisations: profile.organisations.map((org) => ({
        organisationId: org.organisationId,
        organisationNom: org.organisationNom,
        role: { id: org.role.id, code: org.role.code, nom: org.role.nom },
        etat: org.etat,
      })),
      hasOrganisation: profile.hasOrganisation,
    };
  }

  @GrpcMethod('UtilisateurService', 'List')
  async listUtilisateurs(data: ListUtilisateurRequest) {
    return this.utilisateurService.findAll(
      { search: data.search, actif: data.actif },
      data.pagination,
    );
  }

  @GrpcMethod('UtilisateurService', 'Delete')
  async deleteUtilisateur(data: DeleteUtilisateurRequest) {
    const success = await this.utilisateurService.delete(data.id);
    return { success };
  }

  @GrpcMethod('AuthSyncService', 'SyncKeycloakUser')
  async syncKeycloakUser(data: SyncKeycloakUserRequest) {
    const keycloakUser: KeycloakUser = {
      sub: data.sub,
      email: data.email,
      given_name: data.givenName,
      family_name: data.familyName,
      preferred_username: data.preferredUsername,
      name: data.name,
    };
    return this.authSyncService.syncKeycloakUser(keycloakUser);
  }

  @GrpcMethod('AuthSyncService', 'FindByKeycloakId')
  async findByKeycloakId(data: GetByKeycloakIdRequest) {
    const entity = await this.authSyncService.findByKeycloakId(data.keycloakId);
    return entity ?? EMPTY_USER;
  }

  @GrpcMethod('RoleService', 'Create')
  async createRole(data: CreateRoleRequest) {
    return this.roleService.create(data);
  }

  @GrpcMethod('RoleService', 'Update')
  async updateRole(data: UpdateRoleRequest) {
    return this.roleService.update(data);
  }

  @GrpcMethod('RoleService', 'Get')
  async getRole(data: GetRoleRequest) {
    return this.roleService.findById(data.id);
  }

  @GrpcMethod('RoleService', 'GetByCode')
  async getRoleByCode(data: GetRoleByCodeRequest) {
    return this.roleService.findByCode(data.code);
  }

  @GrpcMethod('RoleService', 'List')
  async listRoles(data: ListRoleRequest) {
    return this.roleService.findAll(data.pagination);
  }

  @GrpcMethod('RoleService', 'Delete')
  async deleteRole(data: DeleteRoleRequest) {
    const success = await this.roleService.delete(data.id);
    return { success };
  }

  @GrpcMethod('PermissionService', 'Create')
  async createPermission(data: CreatePermissionRequest) {
    return this.permissionService.create(data);
  }

  @GrpcMethod('PermissionService', 'Update')
  async updatePermission(data: UpdatePermissionRequest) {
    return this.permissionService.update(data);
  }

  @GrpcMethod('PermissionService', 'Get')
  async getPermission(data: GetPermissionRequest) {
    return this.permissionService.findById(data.id);
  }

  @GrpcMethod('PermissionService', 'GetByCode')
  async getPermissionByCode(data: GetPermissionByCodeRequest) {
    return this.permissionService.findByCode(data.code);
  }

  @GrpcMethod('PermissionService', 'List')
  async listPermissions(data: ListPermissionRequest) {
    return this.permissionService.findAll(data.pagination);
  }

  @GrpcMethod('PermissionService', 'Delete')
  async deletePermission(data: DeletePermissionRequest) {
    const success = await this.permissionService.delete(data.id);
    return { success };
  }

  @GrpcMethod('RolePermissionService', 'Create')
  async createRolePermission(data: CreateRolePermissionRequest) {
    return this.rolePermissionService.create({
      roleId: data.roleId,
      permissionId: data.permissionId,
    });
  }

  @GrpcMethod('RolePermissionService', 'Get')
  async getRolePermission(data: GetRolePermissionRequest) {
    return this.rolePermissionService.findById(data.id);
  }

  @GrpcMethod('RolePermissionService', 'ListByRole')
  async listRolePermissions(data: ListByRoleRequest) {
    return this.rolePermissionService.findByRole(data.roleId, data.pagination);
  }

  @GrpcMethod('RolePermissionService', 'Delete')
  async deleteRolePermission(data: DeleteRolePermissionRequest) {
    const success = await this.rolePermissionService.delete(data.id);
    return { success };
  }

  @GrpcMethod('CompteService', 'Create')
  async createCompte(data: CreateCompteRequest) {
    return this.compteService.create({
      nom: data.nom,
      etat: data.etat,
      createdByUserId: data.createdByUserId,
    });
  }

  @GrpcMethod('CompteService', 'CreateWithOwner')
  async createCompteWithOwner(data: CreateCompteWithOwnerRequest) {
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

    // Synchronize with organisations service - this is mandatory
    try {
      await this.organisationsClientService.syncOrganisationWithCompte(compte.id, data.nom);
      this.logger.log(`Organisation synchronisée avec compte ${compte.id}`);
    } catch (error) {
      // Rollback: delete the compte if organisation sync fails
      this.logger.error(`Erreur lors de la synchronisation de l'organisation: ${error}`);
      try {
        await this.compteService.delete(compte.id);
        this.logger.log(`Compte ${compte.id} supprimé suite à l'échec de synchronisation`);
      } catch (deleteError) {
        this.logger.error(`Impossible de supprimer le compte ${compte.id}: ${deleteError}`);
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: `Impossible de créer l'organisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      });
    }

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

    return { compte, owner, membre };
  }

  @GrpcMethod('CompteService', 'Update')
  async updateCompte(data: UpdateCompteRequest) {
    return this.compteService.update(data);
  }

  @GrpcMethod('CompteService', 'Get')
  async getCompte(data: GetCompteRequest) {
    return this.compteService.findById(data.id);
  }

  @GrpcMethod('CompteService', 'List')
  async listComptes(data: ListCompteRequest) {
    return this.compteService.findAll(
      { search: data.search, etat: data.etat },
      data.pagination,
    );
  }

  @GrpcMethod('CompteService', 'Delete')
  async deleteCompte(data: DeleteCompteRequest) {
    const success = await this.compteService.delete(data.id);
    return { success };
  }

  @GrpcMethod('MembreCompteService', 'Create')
  async createMembreCompte(data: CreateMembreCompteRequest) {
    return this.membreCompteService.create({
      organisationId: data.organisationId,
      utilisateurId: data.utilisateurId,
      roleId: data.roleId,
      etat: data.etat,
    });
  }

  @GrpcMethod('MembreCompteService', 'Update')
  async updateMembreCompte(data: UpdateMembreCompteRequest) {
    return this.membreCompteService.update({
      id: data.id,
      roleId: data.roleId,
      etat: data.etat,
    });
  }

  @GrpcMethod('MembreCompteService', 'Get')
  async getMembreCompte(data: GetMembreCompteRequest) {
    return this.membreCompteService.findById(data.id);
  }

  @GrpcMethod('MembreCompteService', 'ListByOrganisation')
  async listMembresByOrganisation(data: ListByOrganisationRequest) {
    return this.membreCompteService.findByOrganisation(data.organisationId, data.pagination);
  }

  @GrpcMethod('MembreCompteService', 'ListByUtilisateur')
  async listMembresByUtilisateur(data: ListByUtilisateurRequest) {
    return this.membreCompteService.findByUtilisateur(data.utilisateurId, data.pagination);
  }

  @GrpcMethod('MembreCompteService', 'Delete')
  async deleteMembreCompte(data: DeleteMembreCompteRequest) {
    const success = await this.membreCompteService.delete(data.id);
    return { success };
  }

  @GrpcMethod('InvitationCompteService', 'Create')
  async createInvitationCompte(data: CreateInvitationCompteRequest) {
    return this.invitationCompteService.create({
      organisationId: data.organisationId,
      emailInvite: data.emailInvite,
      roleId: data.roleId,
      expireDays: data.expireDays,
    });
  }

  @GrpcMethod('InvitationCompteService', 'Update')
  async updateInvitationCompte(data: UpdateInvitationCompteRequest) {
    return this.invitationCompteService.update({
      id: data.id,
      roleId: data.roleId,
      etat: data.etat,
    });
  }

  @GrpcMethod('InvitationCompteService', 'Get')
  async getInvitationCompte(data: GetInvitationCompteRequest) {
    return this.invitationCompteService.findById(data.id);
  }

  @GrpcMethod('InvitationCompteService', 'GetByToken')
  async getInvitationByToken(data: GetByTokenRequest) {
    return this.invitationCompteService.findByToken(data.token);
  }

  @GrpcMethod('InvitationCompteService', 'ListByOrganisation')
  async listInvitationsByOrganisation(data: ListInvitationByOrganisationRequest) {
    return this.invitationCompteService.findByOrganisation(
      data.organisationId,
      data.etat,
      data.pagination,
    );
  }

  @GrpcMethod('InvitationCompteService', 'Delete')
  async deleteInvitationCompte(data: DeleteInvitationCompteRequest) {
    const success = await this.invitationCompteService.delete(data.id);
    return { success };
  }

  @GrpcMethod('InvitationCompteService', 'AcceptInvitation')
  async acceptInvitation(data: AcceptInvitationRequest) {
    const validation = await this.invitationCompteService.isTokenValid(data.token);
    if (!validation.valid || !validation.invitation) {
      return { success: false, message: validation.reason ?? 'Invalid invitation', membre: undefined };
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
      membre,
    };
  }
}

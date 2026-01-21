import { Controller, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { GrpcMethod, ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { OrganisationService } from './modules/organisation/organisation.service';
import { SocieteService } from './modules/societe/societe.service';
import { StatutPartenaireService } from './modules/statut-partenaire/statut-partenaire.service';
import { PartenaireMarqueBlancheService } from './modules/partenaire-marque-blanche/partenaire-marque-blanche.service';
import { ThemeMarqueService } from './modules/theme-marque/theme-marque.service';
import { RolePartenaireService } from './modules/role-partenaire/role-partenaire.service';
import { MembrePartenaireService } from './modules/membre-partenaire/membre-partenaire.service';
import { InvitationCompteService } from './modules/invitation-compte/invitation-compte.service';

import type {
  CreateOrganisationRequest,
  CreateOrganisationWithOwnerRequest,
  UpdateOrganisationRequest,
  GetOrganisationRequest,
  ListOrganisationRequest,
  DeleteOrganisationRequest,
  CreateSocieteRequest,
  UpdateSocieteRequest,
  GetSocieteRequest,
  ListSocieteByOrganisationRequest,
  ListSocieteRequest,
  DeleteSocieteRequest,
  CreateStatutPartenaireRequest,
  UpdateStatutPartenaireRequest,
  GetStatutPartenaireRequest,
  GetStatutPartenaireByCodeRequest,
  ListStatutPartenaireRequest,
  DeleteStatutPartenaireRequest,
  CreatePartenaireRequest,
  UpdatePartenaireRequest,
  GetPartenaireRequest,
  ListPartenaireRequest,
  DeletePartenaireRequest,
  CreateThemeMarqueRequest,
  UpdateThemeMarqueRequest,
  GetThemeMarqueRequest,
  ListThemeMarqueRequest,
  DeleteThemeMarqueRequest,
  CreateRolePartenaireRequest,
  UpdateRolePartenaireRequest,
  GetRolePartenaireRequest,
  GetRolePartenaireByCodeRequest,
  ListRolePartenaireRequest,
  DeleteRolePartenaireRequest,
  CreateMembrePartenaireRequest,
  UpdateMembrePartenaireRequest,
  GetMembrePartenaireRequest,
  ListMembreByPartenaireRequest,
  ListMembreByUtilisateurRequest,
  DeleteMembrePartenaireRequest,
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
  GetInvitationCompteRequest,
  GetInvitationByTokenRequest,
  ListInvitationByOrganisationRequest,
  ListPendingByEmailRequest,
  AcceptInvitationRequest,
  RejectInvitationRequest,
  ExpireInvitationRequest,
  DeleteInvitationCompteRequest,
} from '@proto/organisations/organisations';

import { SocieteEntity } from './modules/societe/entities/societe.entity';
import { PartenaireMarqueBlancheEntity } from './modules/partenaire-marque-blanche/entities/partenaire-marque-blanche.entity';

interface UtilisateurResponse {
  id: string;
  keycloak_id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface RoleResponse {
  id: string;
  code: string;
  nom: string;
  description?: string;
}

interface MembreCompteResponse {
  id: string;
  organisation_id: string;
  utilisateur_id: string;
  role_id: string;
  etat: string;
}

interface AuthSyncServiceClient {
  syncKeycloakUser(data: {
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
    preferred_username?: string;
    name?: string;
  }): import('rxjs').Observable<UtilisateurResponse>;
}

interface RoleServiceClient {
  getByCode(data: { code: string }): import('rxjs').Observable<RoleResponse>;
  create(data: { code: string; nom: string; description?: string }): import('rxjs').Observable<RoleResponse>;
}

interface MembreCompteServiceClient {
  create(data: {
    organisation_id: string;
    utilisateur_id: string;
    role_id: string;
    etat?: string;
  }): import('rxjs').Observable<MembreCompteResponse>;
}

function mapSociete(entity: SocieteEntity) {
  return {
    ...entity,
    numeroTva: entity.numeroTVA,
  };
}

function mapPartenaire(entity: PartenaireMarqueBlancheEntity) {
  return {
    ...entity,
    numeroTva: entity.numeroTVA,
  };
}

@Controller()
export class OrganisationsController implements OnModuleInit {
  private readonly logger = new Logger(OrganisationsController.name);
  private authSyncService: AuthSyncServiceClient;
  private roleService: RoleServiceClient;
  private membreCompteService: MembreCompteServiceClient;

  constructor(
    private readonly organisationService: OrganisationService,
    private readonly societeService: SocieteService,
    private readonly statutPartenaireService: StatutPartenaireService,
    private readonly partenaireService: PartenaireMarqueBlancheService,
    private readonly themeMarqueService: ThemeMarqueService,
    private readonly rolePartenaireService: RolePartenaireService,
    private readonly membrePartenaireService: MembrePartenaireService,
    private readonly invitationCompteService: InvitationCompteService,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authSyncService = this.usersClient.getService<AuthSyncServiceClient>('AuthSyncService');
    this.roleService = this.usersClient.getService<RoleServiceClient>('RoleService');
    this.membreCompteService = this.usersClient.getService<MembreCompteServiceClient>('MembreCompteService');
  }

  @GrpcMethod('OrganisationService', 'Create')
  async createOrganisation(data: CreateOrganisationRequest) {
    return this.organisationService.create(data);
  }

  @GrpcMethod('OrganisationService', 'CreateWithOwner')
  async createOrganisationWithOwner(data: CreateOrganisationWithOwnerRequest) {
    this.logger.log(`Création d'organisation avec propriétaire: ${data.keycloakUser?.email}`);

    const user = await firstValueFrom(
      this.authSyncService.syncKeycloakUser({
        sub: data.keycloakUser?.sub ?? '',
        email: data.keycloakUser?.email ?? '',
        given_name: data.keycloakUser?.givenName,
        family_name: data.keycloakUser?.familyName,
        preferred_username: data.keycloakUser?.preferredUsername,
        name: data.keycloakUser?.name,
      }),
    );
    this.logger.log(`Utilisateur synchronisé: ${user.email} (id: ${user.id})`);

    const organisation = await this.organisationService.create({
      nom: data.nom,
      description: data.description,
      siret: data.siret,
      adresse: data.adresse,
      telephone: data.telephone,
      email: data.email,
      actif: data.actif ?? true,
    });
    this.logger.log(`Organisation créée: ${organisation.nom} (id: ${organisation.id})`);

    let ownerRole: RoleResponse;
    try {
      ownerRole = await firstValueFrom(this.roleService.getByCode({ code: 'owner' }));
      if (!ownerRole?.id) {
        throw new Error('Role not found');
      }
    } catch {
      this.logger.log('Création du rôle "owner"...');
      ownerRole = await firstValueFrom(
        this.roleService.create({
          code: 'owner',
          nom: 'Propriétaire',
          description: "Propriétaire de l'organisation avec tous les droits",
        }),
      );
    }
    this.logger.log(`Rôle owner: ${ownerRole.id}`);

    const membre = await firstValueFrom(
      this.membreCompteService.create({
        organisation_id: organisation.id,
        utilisateur_id: user.id,
        role_id: ownerRole.id,
        etat: 'actif',
      }),
    );
    this.logger.log(`Membre créé: ${membre.id} (role: ${ownerRole.id})`);

    return {
      organisation,
      utilisateur: {
        id: user.id,
        keycloakId: user.keycloak_id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
      },
      membre: {
        id: membre.id,
        roleId: membre.role_id,
        etat: membre.etat,
      },
    };
  }

  @GrpcMethod('OrganisationService', 'Update')
  async updateOrganisation(data: UpdateOrganisationRequest) {
    return this.organisationService.update(data);
  }

  @GrpcMethod('OrganisationService', 'Get')
  async getOrganisation(data: GetOrganisationRequest) {
    return this.organisationService.findById(data.id);
  }

  @GrpcMethod('OrganisationService', 'List')
  async listOrganisations(data: ListOrganisationRequest) {
    return this.organisationService.findAll({ search: data.search, actif: data.actif }, data.pagination);
  }

  @GrpcMethod('OrganisationService', 'Delete')
  async deleteOrganisation(data: DeleteOrganisationRequest) {
    const success = await this.organisationService.delete(data.id);
    return { success };
  }

  @GrpcMethod('SocieteService', 'Create')
  async createSociete(data: CreateSocieteRequest) {
    const entity = await this.societeService.create({
      organisationId: data.organisationId,
      raisonSociale: data.raisonSociale,
      siren: data.siren,
      numeroTVA: data.numeroTva,
    });
    return mapSociete(entity);
  }

  @GrpcMethod('SocieteService', 'Update')
  async updateSociete(data: UpdateSocieteRequest) {
    const entity = await this.societeService.update({
      id: data.id,
      raisonSociale: data.raisonSociale,
      siren: data.siren,
      numeroTVA: data.numeroTva,
    });
    return mapSociete(entity);
  }

  @GrpcMethod('SocieteService', 'Get')
  async getSociete(data: GetSocieteRequest) {
    const entity = await this.societeService.findById(data.id);
    return mapSociete(entity);
  }

  @GrpcMethod('SocieteService', 'ListByOrganisation')
  async listSocietesByOrganisation(data: ListSocieteByOrganisationRequest) {
    const result = await this.societeService.findByOrganisation(data.organisationId, data.pagination);
    return {
      societes: result.societes.map(mapSociete),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('SocieteService', 'List')
  async listSocietes(data: ListSocieteRequest) {
    const result = await this.societeService.findAll({ search: data.search }, data.pagination);
    return {
      societes: result.societes.map(mapSociete),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('SocieteService', 'Delete')
  async deleteSociete(data: DeleteSocieteRequest) {
    const success = await this.societeService.delete(data.id);
    return { success };
  }

  @GrpcMethod('StatutPartenaireService', 'Create')
  async createStatutPartenaire(data: CreateStatutPartenaireRequest) {
    return this.statutPartenaireService.create(data);
  }

  @GrpcMethod('StatutPartenaireService', 'Update')
  async updateStatutPartenaire(data: UpdateStatutPartenaireRequest) {
    return this.statutPartenaireService.update(data);
  }

  @GrpcMethod('StatutPartenaireService', 'Get')
  async getStatutPartenaire(data: GetStatutPartenaireRequest) {
    return this.statutPartenaireService.findById(data.id);
  }

  @GrpcMethod('StatutPartenaireService', 'GetByCode')
  async getStatutPartenaireByCode(data: GetStatutPartenaireByCodeRequest) {
    return this.statutPartenaireService.findByCode(data.code);
  }

  @GrpcMethod('StatutPartenaireService', 'List')
  async listStatutsPartenaire(data: ListStatutPartenaireRequest) {
    return this.statutPartenaireService.findAll(data.pagination);
  }

  @GrpcMethod('StatutPartenaireService', 'Delete')
  async deleteStatutPartenaire(data: DeleteStatutPartenaireRequest) {
    const success = await this.statutPartenaireService.delete(data.id);
    return { success };
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Create')
  async createPartenaire(data: CreatePartenaireRequest) {
    const entity = await this.partenaireService.create({
      denomination: data.denomination,
      siren: data.siren,
      numeroTVA: data.numeroTva,
      contactSupportEmail: data.contactSupportEmail,
      telephone: data.telephone,
      statutId: data.statutId,
    });
    return mapPartenaire(entity);
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Update')
  async updatePartenaire(data: UpdatePartenaireRequest) {
    const entity = await this.partenaireService.update({
      id: data.id,
      denomination: data.denomination,
      siren: data.siren,
      numeroTVA: data.numeroTva,
      contactSupportEmail: data.contactSupportEmail,
      telephone: data.telephone,
      statutId: data.statutId,
    });
    return mapPartenaire(entity);
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Get')
  async getPartenaire(data: GetPartenaireRequest) {
    const entity = await this.partenaireService.findById(data.id);
    return mapPartenaire(entity);
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'List')
  async listPartenaires(data: ListPartenaireRequest) {
    const result = await this.partenaireService.findAll(
      { search: data.search, statutId: data.statutId },
      data.pagination,
    );
    return {
      partenaires: result.partenaires.map(mapPartenaire),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Delete')
  async deletePartenaire(data: DeletePartenaireRequest) {
    const success = await this.partenaireService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ThemeMarqueService', 'Create')
  async createThemeMarque(data: CreateThemeMarqueRequest) {
    return this.themeMarqueService.create({
      logoUrl: data.logoUrl,
      couleurPrimaire: data.couleurPrimaire,
      couleurSecondaire: data.couleurSecondaire,
      faviconUrl: data.faviconUrl,
    });
  }

  @GrpcMethod('ThemeMarqueService', 'Update')
  async updateThemeMarque(data: UpdateThemeMarqueRequest) {
    return this.themeMarqueService.update({
      id: data.id,
      logoUrl: data.logoUrl,
      couleurPrimaire: data.couleurPrimaire,
      couleurSecondaire: data.couleurSecondaire,
      faviconUrl: data.faviconUrl,
    });
  }

  @GrpcMethod('ThemeMarqueService', 'Get')
  async getThemeMarque(data: GetThemeMarqueRequest) {
    return this.themeMarqueService.findById(data.id);
  }

  @GrpcMethod('ThemeMarqueService', 'List')
  async listThemesMarque(data: ListThemeMarqueRequest) {
    return this.themeMarqueService.findAll(data.pagination);
  }

  @GrpcMethod('ThemeMarqueService', 'Delete')
  async deleteThemeMarque(data: DeleteThemeMarqueRequest) {
    const success = await this.themeMarqueService.delete(data.id);
    return { success };
  }

  @GrpcMethod('RolePartenaireService', 'Create')
  async createRolePartenaire(data: CreateRolePartenaireRequest) {
    return this.rolePartenaireService.create(data);
  }

  @GrpcMethod('RolePartenaireService', 'Update')
  async updateRolePartenaire(data: UpdateRolePartenaireRequest) {
    return this.rolePartenaireService.update(data);
  }

  @GrpcMethod('RolePartenaireService', 'Get')
  async getRolePartenaire(data: GetRolePartenaireRequest) {
    return this.rolePartenaireService.findById(data.id);
  }

  @GrpcMethod('RolePartenaireService', 'GetByCode')
  async getRolePartenaireByCode(data: GetRolePartenaireByCodeRequest) {
    return this.rolePartenaireService.findByCode(data.code);
  }

  @GrpcMethod('RolePartenaireService', 'List')
  async listRolesPartenaire(data: ListRolePartenaireRequest) {
    return this.rolePartenaireService.findAll(data.pagination);
  }

  @GrpcMethod('RolePartenaireService', 'Delete')
  async deleteRolePartenaire(data: DeleteRolePartenaireRequest) {
    const success = await this.rolePartenaireService.delete(data.id);
    return { success };
  }

  @GrpcMethod('MembrePartenaireService', 'Create')
  async createMembrePartenaire(data: CreateMembrePartenaireRequest) {
    return this.membrePartenaireService.create({
      utilisateurId: data.utilisateurId,
      partenaireId: data.partenaireId,
      roleId: data.roleId,
    });
  }

  @GrpcMethod('MembrePartenaireService', 'Update')
  async updateMembrePartenaire(data: UpdateMembrePartenaireRequest) {
    return this.membrePartenaireService.update({ id: data.id, roleId: data.roleId });
  }

  @GrpcMethod('MembrePartenaireService', 'Get')
  async getMembrePartenaire(data: GetMembrePartenaireRequest) {
    return this.membrePartenaireService.findById(data.id);
  }

  @GrpcMethod('MembrePartenaireService', 'ListByPartenaire')
  async listMembresByPartenaire(data: ListMembreByPartenaireRequest) {
    return this.membrePartenaireService.findByPartenaire(data.partenaireId, data.pagination);
  }

  @GrpcMethod('MembrePartenaireService', 'ListByUtilisateur')
  async listMembresByUtilisateur(data: ListMembreByUtilisateurRequest) {
    return this.membrePartenaireService.findByUtilisateur(data.utilisateurId, data.pagination);
  }

  @GrpcMethod('MembrePartenaireService', 'Delete')
  async deleteMembrePartenaire(data: DeleteMembrePartenaireRequest) {
    const success = await this.membrePartenaireService.delete(data.id);
    return { success };
  }

  @GrpcMethod('InvitationCompteService', 'Create')
  async createInvitationCompte(data: CreateInvitationCompteRequest) {
    return this.invitationCompteService.create({
      organisationId: data.organisationId,
      emailInvite: data.emailInvite,
      roleId: data.roleId,
      expireAt: data.expireAt ? new Date(data.expireAt) : undefined,
    });
  }

  @GrpcMethod('InvitationCompteService', 'Update')
  async updateInvitationCompte(data: UpdateInvitationCompteRequest) {
    return this.invitationCompteService.update(data);
  }

  @GrpcMethod('InvitationCompteService', 'Get')
  async getInvitationCompte(data: GetInvitationCompteRequest) {
    return this.invitationCompteService.findById(data.id);
  }

  @GrpcMethod('InvitationCompteService', 'GetByToken')
  async getInvitationByToken(data: GetInvitationByTokenRequest) {
    return this.invitationCompteService.findByToken(data.token);
  }

  @GrpcMethod('InvitationCompteService', 'ListByOrganisation')
  async listInvitationsByOrganisation(data: ListInvitationByOrganisationRequest) {
    return this.invitationCompteService.findByOrganisation(data.organisationId, data.pagination);
  }

  @GrpcMethod('InvitationCompteService', 'ListPendingByEmail')
  async listPendingInvitationsByEmail(data: ListPendingByEmailRequest) {
    const invitations = await this.invitationCompteService.findPendingByEmail(data.email);
    return {
      invitations,
      pagination: { total: invitations.length, page: 1, limit: invitations.length, totalPages: 1 },
    };
  }

  @GrpcMethod('InvitationCompteService', 'Accept')
  async acceptInvitation(data: AcceptInvitationRequest) {
    return this.invitationCompteService.accept(data.id);
  }

  @GrpcMethod('InvitationCompteService', 'Reject')
  async rejectInvitation(data: RejectInvitationRequest) {
    return this.invitationCompteService.reject(data.id);
  }

  @GrpcMethod('InvitationCompteService', 'Expire')
  async expireInvitation(data: ExpireInvitationRequest) {
    return this.invitationCompteService.expire(data.id);
  }

  @GrpcMethod('InvitationCompteService', 'Delete')
  async deleteInvitationCompte(data: DeleteInvitationCompteRequest) {
    const success = await this.invitationCompteService.delete(data.id);
    return { success };
  }
}

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
  Organisation,
  CreateOrganisationRequest,
  CreateOrganisationWithOwnerRequest,
  UpdateOrganisationRequest,
  GetOrganisationRequest,
  ListOrganisationRequest,
  ListOrganisationResponse,
  DeleteOrganisationRequest,
  OrganisationWithOwner,
  Societe,
  CreateSocieteRequest,
  UpdateSocieteRequest,
  GetSocieteRequest,
  ListSocieteByOrganisationRequest,
  ListSocieteRequest,
  ListSocieteResponse,
  DeleteSocieteRequest,
  StatutPartenaire,
  CreateStatutPartenaireRequest,
  UpdateStatutPartenaireRequest,
  GetStatutPartenaireRequest,
  GetStatutPartenaireByCodeRequest,
  ListStatutPartenaireRequest,
  ListStatutPartenaireResponse,
  DeleteStatutPartenaireRequest,
  PartenaireMarqueBlanche,
  CreatePartenaireRequest,
  UpdatePartenaireRequest,
  GetPartenaireRequest,
  ListPartenaireRequest,
  ListPartenaireResponse,
  DeletePartenaireRequest,
  ThemeMarque,
  CreateThemeMarqueRequest,
  UpdateThemeMarqueRequest,
  GetThemeMarqueRequest,
  ListThemeMarqueRequest,
  ListThemeMarqueResponse,
  DeleteThemeMarqueRequest,
  RolePartenaire,
  CreateRolePartenaireRequest,
  UpdateRolePartenaireRequest,
  GetRolePartenaireRequest,
  GetRolePartenaireByCodeRequest,
  ListRolePartenaireRequest,
  ListRolePartenaireResponse,
  DeleteRolePartenaireRequest,
  MembrePartenaire,
  CreateMembrePartenaireRequest,
  UpdateMembrePartenaireRequest,
  GetMembrePartenaireRequest,
  ListMembreByPartenaireRequest,
  ListMembreByUtilisateurRequest,
  ListMembrePartenaireResponse,
  DeleteMembrePartenaireRequest,
  InvitationCompte,
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
  GetInvitationCompteRequest,
  GetInvitationByTokenRequest,
  ListInvitationByOrganisationRequest,
  ListPendingByEmailRequest,
  ListInvitationCompteResponse,
  AcceptInvitationRequest,
  RejectInvitationRequest,
  ExpireInvitationRequest,
  DeleteInvitationCompteRequest,
  DeleteResponse,
} from '@proto/organisations/organisations';

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

function toProtoDate(date: Date | null | undefined): string {
  return date ? date.toISOString() : '';
}

function mapPagination(pagination: any): { total: number; page: number; limit: number; totalPages: number } {
  return {
    total: pagination.total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: pagination.total_pages ?? pagination.totalPages,
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

  // ===== ORGANISATION =====

  @GrpcMethod('OrganisationService', 'Create')
  async createOrganisation(data: CreateOrganisationRequest): Promise<Organisation> {
    const entity = await this.organisationService.create(data);
    return this.mapOrganisation(entity);
  }

  /**
   * Crée une organisation et associe automatiquement l'utilisateur comme propriétaire.
   * Équivalent de POST /organisations/with-owner dans le backend monolithique.
   */
  @GrpcMethod('OrganisationService', 'CreateWithOwner')
  async createOrganisationWithOwner(data: CreateOrganisationWithOwnerRequest): Promise<OrganisationWithOwner> {
    this.logger.log(`Création d'organisation avec propriétaire: ${data.keycloakUser?.email}`);

    // 1. Synchroniser l'utilisateur dans la BDD via service-users
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

    // 2. Créer l'organisation
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

    // 3. Récupérer ou créer le rôle "owner"
    let ownerRole: any;
    try {
      ownerRole = await firstValueFrom(this.roleService.getByCode({ code: 'owner' }));
      // Si le rôle n'a pas d'id, il n'existe pas
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

    // 4. Associer l'utilisateur à l'organisation comme propriétaire
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
      organisation: this.mapOrganisation(organisation),
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
  async updateOrganisation(data: UpdateOrganisationRequest): Promise<Organisation> {
    const entity = await this.organisationService.update(data);
    return this.mapOrganisation(entity);
  }

  @GrpcMethod('OrganisationService', 'Get')
  async getOrganisation(data: GetOrganisationRequest): Promise<Organisation> {
    const entity = await this.organisationService.findById(data.id);
    return this.mapOrganisation(entity);
  }

  @GrpcMethod('OrganisationService', 'List')
  async listOrganisations(data: ListOrganisationRequest): Promise<ListOrganisationResponse> {
    const result = await this.organisationService.findAll({ search: data.search, actif: data.actif }, data.pagination);
    return {
      organisations: result.organisations.map((o) => this.mapOrganisation(o)),
      pagination: mapPagination(result.pagination),
    };
  }

  @GrpcMethod('OrganisationService', 'Delete')
  async deleteOrganisation(data: DeleteOrganisationRequest): Promise<DeleteResponse> {
    const success = await this.organisationService.delete(data.id);
    return { success };
  }

  private mapOrganisation(entity: any): Organisation {
    return {
      id: entity.id,
      nom: entity.nom,
      description: entity.description || '',
      siret: entity.siret || '',
      adresse: entity.adresse || '',
      telephone: entity.telephone || '',
      email: entity.email || '',
      actif: entity.actif,
      etat: entity.etat,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== SOCIETE =====

  @GrpcMethod('SocieteService', 'Create')
  async createSociete(data: CreateSocieteRequest): Promise<Societe> {
    const entity = await this.societeService.create({
      organisationId: data.organisationId,
      raisonSociale: data.raisonSociale,
      siren: data.siren,
      numeroTVA: data.numeroTva,
    });
    return this.mapSociete(entity);
  }

  @GrpcMethod('SocieteService', 'Update')
  async updateSociete(data: UpdateSocieteRequest): Promise<Societe> {
    const entity = await this.societeService.update({
      id: data.id,
      raisonSociale: data.raisonSociale,
      siren: data.siren,
      numeroTVA: data.numeroTva,
    });
    return this.mapSociete(entity);
  }

  @GrpcMethod('SocieteService', 'Get')
  async getSociete(data: GetSocieteRequest): Promise<Societe> {
    const entity = await this.societeService.findById(data.id);
    return this.mapSociete(entity);
  }

  @GrpcMethod('SocieteService', 'ListByOrganisation')
  async listSocietesByOrganisation(data: ListSocieteByOrganisationRequest): Promise<ListSocieteResponse> {
    const result = await this.societeService.findByOrganisation(data.organisationId, data.pagination);
    return {
      societes: result.societes.map((s) => this.mapSociete(s)),
      pagination: mapPagination(result.pagination),
    };
  }

  @GrpcMethod('SocieteService', 'List')
  async listSocietes(data: ListSocieteRequest): Promise<ListSocieteResponse> {
    const result = await this.societeService.findAll({ search: data.search }, data.pagination);
    return {
      societes: result.societes.map((s) => this.mapSociete(s)),
      pagination: mapPagination(result.pagination),
    };
  }

  @GrpcMethod('SocieteService', 'Delete')
  async deleteSociete(data: DeleteSocieteRequest): Promise<DeleteResponse> {
    const success = await this.societeService.delete(data.id);
    return { success };
  }

  private mapSociete(entity: any): Societe {
    return {
      id: entity.id,
      organisationId: entity.organisationId,
      raisonSociale: entity.raisonSociale,
      siren: entity.siren,
      numeroTva: entity.numeroTVA,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== STATUT PARTENAIRE =====

  @GrpcMethod('StatutPartenaireService', 'Create')
  async createStatutPartenaire(data: CreateStatutPartenaireRequest): Promise<StatutPartenaire> {
    const entity = await this.statutPartenaireService.create(data);
    return this.mapStatutPartenaire(entity);
  }

  @GrpcMethod('StatutPartenaireService', 'Update')
  async updateStatutPartenaire(data: UpdateStatutPartenaireRequest): Promise<StatutPartenaire> {
    const entity = await this.statutPartenaireService.update(data);
    return this.mapStatutPartenaire(entity);
  }

  @GrpcMethod('StatutPartenaireService', 'Get')
  async getStatutPartenaire(data: GetStatutPartenaireRequest): Promise<StatutPartenaire> {
    const entity = await this.statutPartenaireService.findById(data.id);
    return this.mapStatutPartenaire(entity);
  }

  @GrpcMethod('StatutPartenaireService', 'GetByCode')
  async getStatutPartenaireByCode(data: GetStatutPartenaireByCodeRequest): Promise<StatutPartenaire> {
    const entity = await this.statutPartenaireService.findByCode(data.code);
    return this.mapStatutPartenaire(entity);
  }

  @GrpcMethod('StatutPartenaireService', 'List')
  async listStatutsPartenaire(data: ListStatutPartenaireRequest): Promise<ListStatutPartenaireResponse> {
    const result = await this.statutPartenaireService.findAll(data.pagination);
    return {
      statuts: result.statuts.map((s) => this.mapStatutPartenaire(s)),
      pagination: mapPagination(result.pagination),
    };
  }

  @GrpcMethod('StatutPartenaireService', 'Delete')
  async deleteStatutPartenaire(data: DeleteStatutPartenaireRequest): Promise<DeleteResponse> {
    const success = await this.statutPartenaireService.delete(data.id);
    return { success };
  }

  private mapStatutPartenaire(entity: any): StatutPartenaire {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description || '',
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== PARTENAIRE MARQUE BLANCHE =====

  @GrpcMethod('PartenaireMarqueBlancheService', 'Create')
  async createPartenaire(data: CreatePartenaireRequest): Promise<PartenaireMarqueBlanche> {
    const entity = await this.partenaireService.create({
      denomination: data.denomination,
      siren: data.siren,
      numeroTVA: data.numeroTva,
      contactSupportEmail: data.contactSupportEmail,
      telephone: data.telephone,
      statutId: data.statutId,
    });
    return this.mapPartenaire(entity);
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Update')
  async updatePartenaire(data: UpdatePartenaireRequest): Promise<PartenaireMarqueBlanche> {
    const entity = await this.partenaireService.update({
      id: data.id,
      denomination: data.denomination,
      siren: data.siren,
      numeroTVA: data.numeroTva,
      contactSupportEmail: data.contactSupportEmail,
      telephone: data.telephone,
      statutId: data.statutId,
    });
    return this.mapPartenaire(entity);
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Get')
  async getPartenaire(data: GetPartenaireRequest): Promise<PartenaireMarqueBlanche> {
    const entity = await this.partenaireService.findById(data.id);
    return this.mapPartenaire(entity);
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'List')
  async listPartenaires(data: ListPartenaireRequest): Promise<ListPartenaireResponse> {
    const result = await this.partenaireService.findAll(
      { search: data.search, statutId: data.statutId },
      data.pagination,
    );
    return {
      partenaires: result.partenaires.map((p) => this.mapPartenaire(p)),
      pagination: mapPagination(result.pagination),
    };
  }

  @GrpcMethod('PartenaireMarqueBlancheService', 'Delete')
  async deletePartenaire(data: DeletePartenaireRequest): Promise<DeleteResponse> {
    const success = await this.partenaireService.delete(data.id);
    return { success };
  }

  private mapPartenaire(entity: any): PartenaireMarqueBlanche {
    return {
      id: entity.id,
      denomination: entity.denomination,
      siren: entity.siren,
      numeroTva: entity.numeroTVA,
      contactSupportEmail: entity.contactSupportEmail,
      telephone: entity.telephone,
      statutId: entity.statutId,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== THEME MARQUE =====

  @GrpcMethod('ThemeMarqueService', 'Create')
  async createThemeMarque(data: CreateThemeMarqueRequest): Promise<ThemeMarque> {
    const entity = await this.themeMarqueService.create({
      logoUrl: data.logoUrl,
      couleurPrimaire: data.couleurPrimaire,
      couleurSecondaire: data.couleurSecondaire,
      faviconUrl: data.faviconUrl,
    });
    return this.mapThemeMarque(entity);
  }

  @GrpcMethod('ThemeMarqueService', 'Update')
  async updateThemeMarque(data: UpdateThemeMarqueRequest): Promise<ThemeMarque> {
    const entity = await this.themeMarqueService.update({
      id: data.id,
      logoUrl: data.logoUrl,
      couleurPrimaire: data.couleurPrimaire,
      couleurSecondaire: data.couleurSecondaire,
      faviconUrl: data.faviconUrl,
    });
    return this.mapThemeMarque(entity);
  }

  @GrpcMethod('ThemeMarqueService', 'Get')
  async getThemeMarque(data: GetThemeMarqueRequest): Promise<ThemeMarque> {
    const entity = await this.themeMarqueService.findById(data.id);
    return this.mapThemeMarque(entity);
  }

  @GrpcMethod('ThemeMarqueService', 'List')
  async listThemesMarque(data: ListThemeMarqueRequest): Promise<ListThemeMarqueResponse> {
    const result = await this.themeMarqueService.findAll(data.pagination);
    return {
      themes: result.themes.map((t) => this.mapThemeMarque(t)),
      pagination: mapPagination(result.pagination),
    };
  }

  @GrpcMethod('ThemeMarqueService', 'Delete')
  async deleteThemeMarque(data: DeleteThemeMarqueRequest): Promise<DeleteResponse> {
    const success = await this.themeMarqueService.delete(data.id);
    return { success };
  }

  private mapThemeMarque(entity: any): ThemeMarque {
    return {
      id: entity.id,
      logoUrl: entity.logoUrl,
      couleurPrimaire: entity.couleurPrimaire,
      couleurSecondaire: entity.couleurSecondaire,
      faviconUrl: entity.faviconUrl,
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== ROLE PARTENAIRE =====

  @GrpcMethod('RolePartenaireService', 'Create')
  async createRolePartenaire(data: CreateRolePartenaireRequest): Promise<RolePartenaire> {
    const entity = await this.rolePartenaireService.create(data);
    return this.mapRolePartenaire(entity);
  }

  @GrpcMethod('RolePartenaireService', 'Update')
  async updateRolePartenaire(data: UpdateRolePartenaireRequest): Promise<RolePartenaire> {
    const entity = await this.rolePartenaireService.update(data);
    return this.mapRolePartenaire(entity);
  }

  @GrpcMethod('RolePartenaireService', 'Get')
  async getRolePartenaire(data: GetRolePartenaireRequest): Promise<RolePartenaire> {
    const entity = await this.rolePartenaireService.findById(data.id);
    return this.mapRolePartenaire(entity);
  }

  @GrpcMethod('RolePartenaireService', 'GetByCode')
  async getRolePartenaireByCode(data: GetRolePartenaireByCodeRequest): Promise<RolePartenaire> {
    const entity = await this.rolePartenaireService.findByCode(data.code);
    return this.mapRolePartenaire(entity);
  }

  @GrpcMethod('RolePartenaireService', 'List')
  async listRolesPartenaire(data: ListRolePartenaireRequest): Promise<ListRolePartenaireResponse> {
    const result = await this.rolePartenaireService.findAll(data.pagination);
    return {
      roles: result.roles.map((r) => this.mapRolePartenaire(r)),
      pagination: mapPagination(result.pagination),
    };
  }

  @GrpcMethod('RolePartenaireService', 'Delete')
  async deleteRolePartenaire(data: DeleteRolePartenaireRequest): Promise<DeleteResponse> {
    const success = await this.rolePartenaireService.delete(data.id);
    return { success };
  }

  private mapRolePartenaire(entity: any): RolePartenaire {
    return {
      id: entity.id,
      code: entity.code,
      nom: entity.nom,
      description: entity.description || '',
      createdAt: toProtoDate(entity.createdAt),
      updatedAt: toProtoDate(entity.updatedAt),
    };
  }

  // ===== MEMBRE PARTENAIRE =====

  @GrpcMethod('MembrePartenaireService', 'Create')
  async createMembrePartenaire(data: CreateMembrePartenaireRequest): Promise<MembrePartenaire> {
    const entity = await this.membrePartenaireService.create({
      utilisateurId: data.utilisateurId,
      partenaireId: data.partenaireId,
      roleId: data.roleId,
    });
    return this.mapMembrePartenaire(entity);
  }

  @GrpcMethod('MembrePartenaireService', 'Update')
  async updateMembrePartenaire(data: UpdateMembrePartenaireRequest): Promise<MembrePartenaire> {
    const entity = await this.membrePartenaireService.update({ id: data.id, roleId: data.roleId });
    return this.mapMembrePartenaire(entity);
  }

  @GrpcMethod('MembrePartenaireService', 'Get')
  async getMembrePartenaire(data: GetMembrePartenaireRequest): Promise<MembrePartenaire> {
    const entity = await this.membrePartenaireService.findById(data.id);
    return this.mapMembrePartenaire(entity);
  }

  @GrpcMethod('MembrePartenaireService', 'ListByPartenaire')
  async listMembresByPartenaire(data: ListMembreByPartenaireRequest): Promise<ListMembrePartenaireResponse> {
    const result = await this.membrePartenaireService.findByPartenaire(data.partenaireId, data.pagination);
    return {
      membres: result.membres.map((m) => this.mapMembrePartenaire(m)),
      pagination: mapPagination(result.pagination),
    };
  }

  @GrpcMethod('MembrePartenaireService', 'ListByUtilisateur')
  async listMembresByUtilisateur(data: ListMembreByUtilisateurRequest): Promise<ListMembrePartenaireResponse> {
    const result = await this.membrePartenaireService.findByUtilisateur(data.utilisateurId, data.pagination);
    return {
      membres: result.membres.map((m) => this.mapMembrePartenaire(m)),
      pagination: mapPagination(result.pagination),
    };
  }

  @GrpcMethod('MembrePartenaireService', 'Delete')
  async deleteMembrePartenaire(data: DeleteMembrePartenaireRequest): Promise<DeleteResponse> {
    const success = await this.membrePartenaireService.delete(data.id);
    return { success };
  }

  private mapMembrePartenaire(entity: any): MembrePartenaire {
    return {
      id: entity.id,
      utilisateurId: entity.utilisateurId,
      partenaireId: entity.partenaireId,
      roleId: entity.roleId,
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
      expireAt: data.expireAt ? new Date(data.expireAt) : undefined,
    });
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'Update')
  async updateInvitationCompte(data: UpdateInvitationCompteRequest): Promise<InvitationCompte> {
    const entity = await this.invitationCompteService.update(data);
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'Get')
  async getInvitationCompte(data: GetInvitationCompteRequest): Promise<InvitationCompte> {
    const entity = await this.invitationCompteService.findById(data.id);
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'GetByToken')
  async getInvitationByToken(data: GetInvitationByTokenRequest): Promise<InvitationCompte> {
    const entity = await this.invitationCompteService.findByToken(data.token);
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'ListByOrganisation')
  async listInvitationsByOrganisation(data: ListInvitationByOrganisationRequest): Promise<ListInvitationCompteResponse> {
    const result = await this.invitationCompteService.findByOrganisation(data.organisationId, data.pagination);
    return {
      invitations: result.invitations.map((i) => this.mapInvitationCompte(i)),
      pagination: mapPagination(result.pagination),
    };
  }

  @GrpcMethod('InvitationCompteService', 'ListPendingByEmail')
  async listPendingInvitationsByEmail(data: ListPendingByEmailRequest): Promise<ListInvitationCompteResponse> {
    const invitations = await this.invitationCompteService.findPendingByEmail(data.email);
    return {
      invitations: invitations.map((i) => this.mapInvitationCompte(i)),
      pagination: { total: invitations.length, page: 1, limit: invitations.length, totalPages: 1 },
    };
  }

  @GrpcMethod('InvitationCompteService', 'Accept')
  async acceptInvitation(data: AcceptInvitationRequest): Promise<InvitationCompte> {
    const entity = await this.invitationCompteService.accept(data.id);
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'Reject')
  async rejectInvitation(data: RejectInvitationRequest): Promise<InvitationCompte> {
    const entity = await this.invitationCompteService.reject(data.id);
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'Expire')
  async expireInvitation(data: ExpireInvitationRequest): Promise<InvitationCompte> {
    const entity = await this.invitationCompteService.expire(data.id);
    return this.mapInvitationCompte(entity);
  }

  @GrpcMethod('InvitationCompteService', 'Delete')
  async deleteInvitationCompte(data: DeleteInvitationCompteRequest): Promise<DeleteResponse> {
    const success = await this.invitationCompteService.delete(data.id);
    return { success };
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

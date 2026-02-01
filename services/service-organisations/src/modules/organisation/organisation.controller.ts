import { Controller, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { GrpcMethod, ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { OrganisationService } from './organisation.service';

import type {
  CreateOrganisationRequest,
  CreateOrganisationWithOwnerRequest,
  UpdateOrganisationRequest,
  GetOrganisationRequest,
  ListOrganisationRequest,
  DeleteOrganisationRequest,
} from '@crm/proto/organisations';

import type {
  Utilisateur,
  Role,
  MembreCompte,
  SyncKeycloakUserRequest,
  CreateRoleRequest,
  GetRoleByCodeRequest,
  CreateMembreCompteRequest,
} from '@crm/proto/users';
import type { Observable } from 'rxjs';

interface AuthSyncServiceClient {
  syncKeycloakUser(data: SyncKeycloakUserRequest): Observable<Utilisateur>;
}

interface RoleServiceClient {
  getByCode(data: GetRoleByCodeRequest): Observable<Role>;
  create(data: CreateRoleRequest): Observable<Role>;
}

interface MembreCompteServiceClient {
  create(data: CreateMembreCompteRequest): Observable<MembreCompte>;
}

@Controller()
export class OrganisationController implements OnModuleInit {
  private readonly logger = new Logger(OrganisationController.name);
  private authSyncService: AuthSyncServiceClient;
  private roleService: RoleServiceClient;
  private membreCompteService: MembreCompteServiceClient;

  constructor(
    private readonly organisationService: OrganisationService,
    @Inject('USERS_SERVICE') private readonly usersClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authSyncService = this.usersClient.getService<AuthSyncServiceClient>('AuthSyncService');
    this.roleService = this.usersClient.getService<RoleServiceClient>('RoleService');
    this.membreCompteService = this.usersClient.getService<MembreCompteServiceClient>('MembreCompteService');
  }

  @GrpcMethod('OrganisationService', 'Create')
  async create(data: CreateOrganisationRequest) {
    return this.organisationService.create(data);
  }

  @GrpcMethod('OrganisationService', 'CreateWithOwner')
  async createWithOwner(data: CreateOrganisationWithOwnerRequest) {
    this.logger.log(`Création d'organisation avec propriétaire: ${data.keycloakUser?.email}`);

    const user = await firstValueFrom(
      this.authSyncService.syncKeycloakUser({
        sub: data.keycloakUser?.sub ?? '',
        email: data.keycloakUser?.email ?? '',
        givenName: data.keycloakUser?.givenName ?? '',
        familyName: data.keycloakUser?.familyName ?? '',
        preferredUsername: data.keycloakUser?.preferredUsername ?? '',
        name: data.keycloakUser?.name ?? '',
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

    let ownerRole: Role;
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
        organisationId: organisation.id,
        utilisateurId: user.id,
        roleId: ownerRole.id,
        etat: 'actif',
      }),
    );
    this.logger.log(`Membre créé: ${membre.id} (role: ${ownerRole.id})`);

    return {
      organisation,
      utilisateur: {
        id: user.id,
        keycloakId: user.keycloakId,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
      },
      membre: {
        id: membre.id,
        roleId: membre.roleId,
        etat: membre.etat,
      },
    };
  }

  @GrpcMethod('OrganisationService', 'Update')
  async update(data: UpdateOrganisationRequest) {
    return this.organisationService.update(data);
  }

  @GrpcMethod('OrganisationService', 'Get')
  async get(data: GetOrganisationRequest) {
    return this.organisationService.findById(data.id);
  }

  @GrpcMethod('OrganisationService', 'List')
  async list(data: ListOrganisationRequest) {
    return this.organisationService.findAll({ search: data.search, actif: data.actif }, data.pagination);
  }

  @GrpcMethod('OrganisationService', 'Delete')
  async delete(data: DeleteOrganisationRequest) {
    const success = await this.organisationService.delete(data.id);
    return { success };
  }
}

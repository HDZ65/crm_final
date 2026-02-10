import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrganisationService } from '../../persistence/typeorm/repositories/organisations/organisation.service';
import { AuthSyncService, KeycloakUser } from '../../persistence/typeorm/repositories/users/auth-sync.service';
import { RoleService } from '../../persistence/typeorm/repositories/users/role.service';
import { MembreCompteService } from '../../persistence/typeorm/repositories/users/membre-compte.service';
import { OrganisationEntity } from '../../../domain/organisations/entities/organisation.entity';
import type {
  CreateOrganisationRequest,
  CreateOrganisationWithOwnerRequest,
  UpdateOrganisationRequest,
  GetOrganisationRequest,
  ListOrganisationRequest,
  ListOrganisationResponse,
  DeleteOrganisationRequest,
  Organisation,
  OrganisationWithOwner,
  DeleteResponse,
} from '@proto/organisations';

/**
 * Map OrganisationEntity (camelCase) to proto Organisation (snake_case).
 * Required because proto-loader uses keepCase: true.
 */
function organisationToProto(entity: OrganisationEntity) {
  return {
    id: entity.id,
    nom: entity.nom,
    description: entity.description ?? '',
    siret: entity.siret ?? '',
    adresse: entity.adresse ?? '',
    telephone: entity.telephone ?? '',
    email: entity.email ?? '',
    actif: entity.actif,
    etat: entity.etat,
    created_at: entity.createdAt?.toISOString() ?? '',
    updated_at: entity.updatedAt?.toISOString() ?? '',
  };
}

@Controller()
export class OrganisationController {
  private readonly logger = new Logger(OrganisationController.name);

  constructor(
    private readonly organisationService: OrganisationService,
    private readonly authSyncService: AuthSyncService,
    private readonly roleService: RoleService,
    private readonly membreCompteService: MembreCompteService,
  ) {}

  @GrpcMethod('OrganisationService', 'Create')
  async create(data: CreateOrganisationRequest) {
    const entity = await this.organisationService.create(data);
    return organisationToProto(entity);
  }

  @GrpcMethod('OrganisationService', 'CreateWithOwner')
  async createWithOwner(data: CreateOrganisationWithOwnerRequest) {
    this.logger.log(`Creating organisation with owner: ${data.keycloak_user?.email}`);

    const keycloakUser: KeycloakUser = {
      sub: data.keycloak_user?.sub ?? '',
      email: data.keycloak_user?.email ?? '',
      given_name: data.keycloak_user?.given_name,
      family_name: data.keycloak_user?.family_name,
      preferred_username: data.keycloak_user?.preferred_username,
      name: data.keycloak_user?.name,
    };
    const user = await this.authSyncService.syncKeycloakUser(keycloakUser);
    this.logger.log(`User synced: ${user.email} (id: ${user.id})`);

    const organisation = await this.organisationService.create({
      nom: data.nom,
      description: data.description,
      siret: data.siret,
      adresse: data.adresse,
      telephone: data.telephone,
      email: data.email,
      actif: data.actif ?? true,
    });
    this.logger.log(`Organisation created: ${organisation.nom} (id: ${organisation.id})`);

    let ownerRole: Awaited<ReturnType<typeof this.roleService.findByCode>>;
    try {
      ownerRole = await this.roleService.findByCode('owner');
    } catch {
      this.logger.log('Creating "owner" role...');
      ownerRole = await this.roleService.create({
        code: 'owner',
        nom: 'Proprietaire',
        description: 'Organisation owner with all rights',
      });
    }
    this.logger.log(`Owner role: ${ownerRole.id}`);

    const membre = await this.membreCompteService.create({
      organisationId: organisation.id,
      utilisateurId: user.id,
      roleId: ownerRole.id,
      etat: 'actif',
    });
    this.logger.log(`Member created: ${membre.id} (role: ${ownerRole.id})`);

    return {
      organisation: organisationToProto(organisation),
      utilisateur: {
        id: user.id,
        keycloak_id: user.keycloakId,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
      },
      membre: {
        id: membre.id,
        role_id: membre.roleId,
        etat: membre.etat,
      },
    };
  }

  @GrpcMethod('OrganisationService', 'Update')
  async update(data: UpdateOrganisationRequest) {
    const entity = await this.organisationService.update(data);
    return organisationToProto(entity);
  }

  @GrpcMethod('OrganisationService', 'Get')
  async get(data: GetOrganisationRequest) {
    const entity = await this.organisationService.findById(data.id);
    return organisationToProto(entity);
  }

  @GrpcMethod('OrganisationService', 'List')
  async list(data: ListOrganisationRequest) {
    const result = await this.organisationService.findAll({ search: data.search, actif: data.actif }, data.pagination);
    return {
      organisations: result.organisations.map(organisationToProto),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('OrganisationService', 'Delete')
  async delete(data: DeleteOrganisationRequest) {
    const success = await this.organisationService.delete(data.id);
    return { success };
  }
}

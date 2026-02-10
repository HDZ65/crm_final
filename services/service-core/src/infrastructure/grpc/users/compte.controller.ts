import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CompteService } from '../../persistence/typeorm/repositories/users/compte.service';
import { CompteEntity } from '../../../domain/users/entities';
import { AuthSyncService, KeycloakUser } from '../../persistence/typeorm/repositories/users/auth-sync.service';
import { RoleService } from '../../persistence/typeorm/repositories/users/role.service';
import { MembreCompteService } from '../../persistence/typeorm/repositories/users/membre-compte.service';
import { OrganisationService } from '../../persistence/typeorm/repositories/organisations/organisation.service';
import type {
  CreateCompteRequest,
  CreateCompteWithOwnerRequest,
  UpdateCompteRequest,
  GetCompteRequest,
  ListCompteRequest,
  ListCompteResponse,
  DeleteCompteRequest,
  Compte,
  CompteWithOwner,
  DeleteResponse,
} from '@proto/users';

/**
 * Map CompteEntity (camelCase) to proto Compte (snake_case).
 * Required because proto-loader uses keepCase: true.
 */
function compteToProto(entity: CompteEntity) {
  return {
    id: entity.id,
    nom: entity.nom,
    etat: entity.etat,
    date_creation: entity.dateCreation?.toISOString() ?? '',
    created_by_user_id: entity.createdByUserId ?? '',
    created_at: entity.createdAt?.toISOString() ?? '',
    updated_at: entity.updatedAt?.toISOString() ?? '',
  };
}

@Controller()
export class CompteController {
  private readonly logger = new Logger(CompteController.name);

  constructor(
    private readonly compteService: CompteService,
    private readonly authSyncService: AuthSyncService,
    private readonly roleService: RoleService,
    private readonly membreCompteService: MembreCompteService,
    private readonly organisationService: OrganisationService,
  ) {}

  @GrpcMethod('CompteService', 'Create')
  async create(data: CreateCompteRequest) {
    const entity = await this.compteService.create({
      nom: data.nom,
      etat: data.etat,
      createdByUserId: data.created_by_user_id,
    });
    return compteToProto(entity);
  }

  @GrpcMethod('CompteService', 'CreateWithOwner')
  async createWithOwner(data: CreateCompteWithOwnerRequest) {
    const keycloakUser: KeycloakUser = {
      sub: data.keycloak_user?.sub || '',
      email: data.keycloak_user?.email || '',
      given_name: data.keycloak_user?.given_name,
      family_name: data.keycloak_user?.family_name,
      preferred_username: data.keycloak_user?.preferred_username,
      name: data.keycloak_user?.name,
    };
    const owner = await this.authSyncService.syncKeycloakUser(keycloakUser);

    const compte = await this.compteService.create({
      nom: data.nom,
      etat: 'actif',
      createdByUserId: owner.id,
    });

    try {
      await this.organisationService.create({
        id: compte.id,
        nom: data.nom,
        actif: true,
      });
      this.logger.log(`Organisation created with compte ${compte.id}`);
    } catch (error) {
      this.logger.error(`Failed to create organisation: ${error}`);
      try {
        await this.compteService.delete(compte.id);
        this.logger.log(`Compte ${compte.id} deleted after organisation creation failure`);
      } catch (deleteError) {
        this.logger.error(`Failed to delete compte ${compte.id}: ${deleteError}`);
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: `Failed to create organisation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    let ownerRole: Awaited<ReturnType<typeof this.roleService.findByCode>>;
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
      compte: compteToProto(compte),
      owner,
      membre,
    };
  }

  @GrpcMethod('CompteService', 'Update')
  async update(data: UpdateCompteRequest) {
    const entity = await this.compteService.update(data);
    return compteToProto(entity);
  }

  @GrpcMethod('CompteService', 'Get')
  async get(data: GetCompteRequest) {
    const entity = await this.compteService.findById(data.id);
    return compteToProto(entity);
  }

  @GrpcMethod('CompteService', 'List')
  async list(data: ListCompteRequest) {
    const result = await this.compteService.findAll(
      { search: data.search, etat: data.etat },
      data.pagination,
    );
    return {
      comptes: result.comptes.map(compteToProto),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('CompteService', 'Delete')
  async delete(data: DeleteCompteRequest) {
    const success = await this.compteService.delete(data.id);
    return { success };
  }
}

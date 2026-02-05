import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CompteService } from '../../../../infrastructure/persistence/typeorm/repositories/users/compte.service';
import { AuthSyncService, KeycloakUser } from '../../../../infrastructure/persistence/typeorm/repositories/users/auth-sync.service';
import { RoleService } from '../../../../infrastructure/persistence/typeorm/repositories/users/role.service';
import { MembreCompteService } from '../../../../infrastructure/persistence/typeorm/repositories/users/membre-compte.service';
import { OrganisationService } from '../../../../infrastructure/persistence/typeorm/repositories/organisations/organisation.service';

import type {
  CreateCompteRequest,
  CreateCompteWithOwnerRequest,
  UpdateCompteRequest,
  GetCompteRequest,
  ListCompteRequest,
  DeleteCompteRequest,
} from '@crm/proto/users';

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
    return this.compteService.create({
      nom: data.nom,
      etat: data.etat,
      createdByUserId: data.created_by_user_id,
    });
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

    return { compte, owner, membre };
  }

  @GrpcMethod('CompteService', 'Update')
  async update(data: UpdateCompteRequest) {
    return this.compteService.update(data);
  }

  @GrpcMethod('CompteService', 'Get')
  async get(data: GetCompteRequest) {
    return this.compteService.findById(data.id);
  }

  @GrpcMethod('CompteService', 'List')
  async list(data: ListCompteRequest) {
    return this.compteService.findAll(
      { search: data.search, etat: data.etat },
      data.pagination,
    );
  }

  @GrpcMethod('CompteService', 'Delete')
  async delete(data: DeleteCompteRequest) {
    const success = await this.compteService.delete(data.id);
    return { success };
  }
}

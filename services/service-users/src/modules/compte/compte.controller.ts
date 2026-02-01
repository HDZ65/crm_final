import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CompteService } from './compte.service';
import { AuthSyncService, KeycloakUser } from '../auth-sync/auth-sync.service';
import { RoleService } from '../role/role.service';
import { MembreCompteService } from '../membre-compte/membre-compte.service';
import { OrganisationsClientService } from '../organisations-client/organisations-client.service';

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
    private readonly organisationsClientService: OrganisationsClientService,
  ) {}

  @GrpcMethod('CompteService', 'Create')
  async create(data: CreateCompteRequest) {
    return this.compteService.create({
      nom: data.nom,
      etat: data.etat,
      createdByUserId: data.createdByUserId,
    });
  }

  @GrpcMethod('CompteService', 'CreateWithOwner')
  async createWithOwner(data: CreateCompteWithOwnerRequest) {
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

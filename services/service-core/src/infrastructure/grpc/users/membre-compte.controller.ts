import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MembreCompteService } from '../../persistence/typeorm/repositories/users/membre-compte.service';
import { MembreCompteEntity } from '../../../domain/users/entities';
import type {
  CreateMembreCompteRequest,
  UpdateMembreCompteRequest,
  GetMembreCompteRequest,
  ListByOrganisationRequest,
  ListByUtilisateurRequest,
  ListMembreCompteResponse,
  DeleteMembreCompteRequest,
  MembreCompte,
  DeleteResponse,
} from '@proto/users';

/**
 * Map MembreCompteEntity (camelCase) to proto MembreCompte (snake_case).
 * Required because proto-loader uses keepCase: true.
 */
function toProto(entity: MembreCompteEntity) {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    utilisateur_id: entity.utilisateurId,
    role_id: entity.roleId,
    etat: entity.etat,
    date_invitation: entity.dateInvitation?.toISOString() ?? '',
    date_activation: entity.dateActivation?.toISOString() ?? '',
    created_at: entity.createdAt?.toISOString() ?? '',
    updated_at: entity.updatedAt?.toISOString() ?? '',
  };
}

@Controller()
export class MembreCompteController {
  constructor(private readonly membreCompteService: MembreCompteService) {}

  @GrpcMethod('MembreCompteService', 'Create')
  async create(data: CreateMembreCompteRequest) {
    const entity = await this.membreCompteService.create({
      organisationId: data.organisation_id,
      utilisateurId: data.utilisateur_id,
      roleId: data.role_id,
      etat: data.etat,
    });
    return toProto(entity);
  }

  @GrpcMethod('MembreCompteService', 'Update')
  async update(data: UpdateMembreCompteRequest) {
    const entity = await this.membreCompteService.update({
      id: data.id,
      roleId: data.role_id,
      etat: data.etat,
    });
    return toProto(entity);
  }

  @GrpcMethod('MembreCompteService', 'Get')
  async get(data: GetMembreCompteRequest) {
    const entity = await this.membreCompteService.findById(data.id);
    return toProto(entity);
  }

  @GrpcMethod('MembreCompteService', 'ListByOrganisation')
  async listByOrganisation(data: ListByOrganisationRequest) {
    const result = await this.membreCompteService.findByOrganisation(data.organisation_id, data.pagination);
    return {
      membres: result.membres.map(toProto),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('MembreCompteService', 'ListByUtilisateur')
  async listByUtilisateur(data: ListByUtilisateurRequest) {
    const result = await this.membreCompteService.findByUtilisateur(data.utilisateur_id, data.pagination);
    return {
      membres: result.membres.map(toProto),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('MembreCompteService', 'Delete')
  async delete(data: DeleteMembreCompteRequest) {
    const success = await this.membreCompteService.delete(data.id);
    return { success };
  }
}

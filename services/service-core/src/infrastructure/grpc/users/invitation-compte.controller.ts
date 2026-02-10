import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InvitationCompteService } from '../../persistence/typeorm/repositories/users/invitation-compte.service';
import { AuthSyncService, KeycloakUser } from '../../persistence/typeorm/repositories/users/auth-sync.service';
import { MembreCompteService } from '../../persistence/typeorm/repositories/users/membre-compte.service';
import { InvitationCompteEntity } from '../../../domain/users/entities';
import type {
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
  GetInvitationCompteRequest,
  GetByTokenRequest,
  ListInvitationByOrganisationRequest,
  ListInvitationCompteResponse,
  DeleteInvitationCompteRequest,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  InvitationCompte,
  DeleteResponse,
} from '@proto/users';

/**
 * Map InvitationCompteEntity (camelCase) to proto InvitationCompte (snake_case).
 * Required because proto-loader uses keepCase: true.
 */
function invitationToProto(entity: InvitationCompteEntity) {
  return {
    id: entity.id,
    organisation_id: entity.organisationId,
    email_invite: entity.emailInvite,
    role_id: entity.roleId,
    token: entity.token,
    expire_at: entity.expireAt?.toISOString() ?? '',
    etat: entity.etat,
    created_at: entity.createdAt?.toISOString() ?? '',
    updated_at: entity.updatedAt?.toISOString() ?? '',
  };
}

@Controller()
export class InvitationCompteController {
  constructor(
    private readonly invitationCompteService: InvitationCompteService,
    private readonly authSyncService: AuthSyncService,
    private readonly membreCompteService: MembreCompteService,
  ) {}

  @GrpcMethod('InvitationCompteService', 'Create')
  async create(data: CreateInvitationCompteRequest) {
    const entity = await this.invitationCompteService.create({
      organisationId: data.organisation_id,
      emailInvite: data.email_invite,
      roleId: data.role_id,
      expireDays: data.expire_days,
    });
    return invitationToProto(entity);
  }

  @GrpcMethod('InvitationCompteService', 'Update')
  async update(data: UpdateInvitationCompteRequest) {
    const entity = await this.invitationCompteService.update({
      id: data.id,
      roleId: data.role_id,
      etat: data.etat,
    });
    return invitationToProto(entity);
  }

  @GrpcMethod('InvitationCompteService', 'Get')
  async get(data: GetInvitationCompteRequest) {
    const entity = await this.invitationCompteService.findById(data.id);
    return invitationToProto(entity);
  }

  @GrpcMethod('InvitationCompteService', 'GetByToken')
  async getByToken(data: GetByTokenRequest) {
    const entity = await this.invitationCompteService.findByToken(data.token);
    return invitationToProto(entity);
  }

  @GrpcMethod('InvitationCompteService', 'ListByOrganisation')
  async listByOrganisation(data: ListInvitationByOrganisationRequest) {
    const result = await this.invitationCompteService.findByOrganisation(
      data.organisation_id,
      data.etat,
      data.pagination,
    );
    return {
      invitations: result.invitations.map(invitationToProto),
      pagination: result.pagination,
    };
  }

  @GrpcMethod('InvitationCompteService', 'Delete')
  async delete(data: DeleteInvitationCompteRequest) {
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
      sub: data.keycloak_user?.sub || '',
      email: data.keycloak_user?.email || '',
      given_name: data.keycloak_user?.given_name,
      family_name: data.keycloak_user?.family_name,
      preferred_username: data.keycloak_user?.preferred_username,
      name: data.keycloak_user?.name,
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

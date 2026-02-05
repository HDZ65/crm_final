import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InvitationCompteService } from '../../../../infrastructure/persistence/typeorm/repositories/users/invitation-compte.service';
import { AuthSyncService, KeycloakUser } from '../../../../infrastructure/persistence/typeorm/repositories/users/auth-sync.service';
import { MembreCompteService } from '../../../../infrastructure/persistence/typeorm/repositories/users/membre-compte.service';

import type {
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
  GetInvitationCompteRequest,
  GetByTokenRequest,
  ListInvitationByOrganisationRequest,
  DeleteInvitationCompteRequest,
  AcceptInvitationRequest,
} from '@crm/proto/users';

@Controller()
export class InvitationCompteController {
  constructor(
    private readonly invitationCompteService: InvitationCompteService,
    private readonly authSyncService: AuthSyncService,
    private readonly membreCompteService: MembreCompteService,
  ) {}

  @GrpcMethod('InvitationCompteService', 'Create')
  async create(data: CreateInvitationCompteRequest) {
    return this.invitationCompteService.create({
      organisationId: data.organisation_id,
      emailInvite: data.email_invite,
      roleId: data.role_id,
      expireDays: data.expire_days,
    });
  }

  @GrpcMethod('InvitationCompteService', 'Update')
  async update(data: UpdateInvitationCompteRequest) {
    return this.invitationCompteService.update({
      id: data.id,
      roleId: data.role_id,
      etat: data.etat,
    });
  }

  @GrpcMethod('InvitationCompteService', 'Get')
  async get(data: GetInvitationCompteRequest) {
    return this.invitationCompteService.findById(data.id);
  }

  @GrpcMethod('InvitationCompteService', 'GetByToken')
  async getByToken(data: GetByTokenRequest) {
    return this.invitationCompteService.findByToken(data.token);
  }

  @GrpcMethod('InvitationCompteService', 'ListByOrganisation')
  async listByOrganisation(data: ListInvitationByOrganisationRequest) {
    return this.invitationCompteService.findByOrganisation(
      data.organisation_id,
      data.etat,
      data.pagination,
    );
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

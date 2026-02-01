import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InvitationCompteService } from './invitation-compte.service';
import { AuthSyncService, KeycloakUser } from '../auth-sync/auth-sync.service';
import { MembreCompteService } from '../membre-compte/membre-compte.service';

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
      organisationId: data.organisationId,
      emailInvite: data.emailInvite,
      roleId: data.roleId,
      expireDays: data.expireDays,
    });
  }

  @GrpcMethod('InvitationCompteService', 'Update')
  async update(data: UpdateInvitationCompteRequest) {
    return this.invitationCompteService.update({
      id: data.id,
      roleId: data.roleId,
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
      data.organisationId,
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
      sub: data.keycloakUser?.sub || '',
      email: data.keycloakUser?.email || '',
      given_name: data.keycloakUser?.givenName,
      family_name: data.keycloakUser?.familyName,
      preferred_username: data.keycloakUser?.preferredUsername,
      name: data.keycloakUser?.name,
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

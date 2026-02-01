import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InvitationCompteService } from './invitation-compte.service';

import type {
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
  GetInvitationCompteRequest,
  GetInvitationByTokenRequest,
  ListInvitationByOrganisationRequest,
  ListPendingByEmailRequest,
  AcceptInvitationRequest,
  RejectInvitationRequest,
  ExpireInvitationRequest,
  DeleteInvitationCompteRequest,
} from '@crm/proto/organisations';

@Controller()
export class InvitationCompteController {
  constructor(private readonly invitationCompteService: InvitationCompteService) {}

  @GrpcMethod('InvitationCompteService', 'Create')
  async create(data: CreateInvitationCompteRequest) {
    return this.invitationCompteService.create({
      organisationId: data.organisationId,
      emailInvite: data.emailInvite,
      roleId: data.roleId,
      expireAt: data.expireAt ? new Date(data.expireAt) : undefined,
    });
  }

  @GrpcMethod('InvitationCompteService', 'Update')
  async update(data: UpdateInvitationCompteRequest) {
    return this.invitationCompteService.update(data);
  }

  @GrpcMethod('InvitationCompteService', 'Get')
  async get(data: GetInvitationCompteRequest) {
    return this.invitationCompteService.findById(data.id);
  }

  @GrpcMethod('InvitationCompteService', 'GetByToken')
  async getByToken(data: GetInvitationByTokenRequest) {
    return this.invitationCompteService.findByToken(data.token);
  }

  @GrpcMethod('InvitationCompteService', 'ListByOrganisation')
  async listByOrganisation(data: ListInvitationByOrganisationRequest) {
    return this.invitationCompteService.findByOrganisation(data.organisationId, data.pagination);
  }

  @GrpcMethod('InvitationCompteService', 'ListPendingByEmail')
  async listPendingByEmail(data: ListPendingByEmailRequest) {
    const invitations = await this.invitationCompteService.findPendingByEmail(data.email);
    return {
      invitations,
      pagination: { total: invitations.length, page: 1, limit: invitations.length, totalPages: 1 },
    };
  }

  @GrpcMethod('InvitationCompteService', 'Accept')
  async accept(data: AcceptInvitationRequest) {
    return this.invitationCompteService.accept(data.id);
  }

  @GrpcMethod('InvitationCompteService', 'Reject')
  async reject(data: RejectInvitationRequest) {
    return this.invitationCompteService.reject(data.id);
  }

  @GrpcMethod('InvitationCompteService', 'Expire')
  async expire(data: ExpireInvitationRequest) {
    return this.invitationCompteService.expire(data.id);
  }

  @GrpcMethod('InvitationCompteService', 'Delete')
  async delete(data: DeleteInvitationCompteRequest) {
    const success = await this.invitationCompteService.delete(data.id);
    return { success };
  }
}

export class InvitationCompteDto {
  id: string;
  organisationId: string;
  emailInvite: string;
  roleId: string;
  token: string;
  expireAt: string;
  etat: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<InvitationCompteDto>) {
    Object.assign(this, partial);
  }
}

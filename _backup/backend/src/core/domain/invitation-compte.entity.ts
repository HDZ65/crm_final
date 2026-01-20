import { BaseEntity } from './base.entity';

export interface InvitationCompteProps {
  id?: string;
  organisationId: string;
  emailInvite: string;
  roleId: string;
  token: string;
  expireAt: string;
  etat: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InvitationCompteEntity extends BaseEntity {
  organisationId: string;
  emailInvite: string;
  roleId: string;
  token: string;
  expireAt: string;
  etat: string;

  constructor(props: InvitationCompteProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.emailInvite = props.emailInvite;
    this.roleId = props.roleId;
    this.token = props.token;
    this.expireAt = props.expireAt;
    this.etat = props.etat;
  }

  // Add domain business logic methods here
}

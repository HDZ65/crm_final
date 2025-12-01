import { BaseEntity } from './base.entity';

export interface MembreCompteProps {
  id?: string;
  organisationId: string;
  utilisateurId: string;
  roleId: string;
  etat: string;
  dateInvitation?: Date | null;
  dateActivation?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MembreCompteEntity extends BaseEntity {
  organisationId: string;
  utilisateurId: string;
  roleId: string;
  etat: string;
  dateInvitation?: Date | null;
  dateActivation?: Date | null;

  constructor(props: MembreCompteProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.utilisateurId = props.utilisateurId;
    this.roleId = props.roleId;
    this.etat = props.etat;
    this.dateInvitation = props.dateInvitation;
    this.dateActivation = props.dateActivation;
  }

  // Add domain business logic methods here
}

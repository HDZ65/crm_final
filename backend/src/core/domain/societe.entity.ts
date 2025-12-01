import { BaseEntity } from './base.entity';

export interface SocieteProps {
  id?: string;
  organisationId: string;
  raisonSociale: string;
  siren: string;
  numeroTVA: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SocieteEntity extends BaseEntity {
  organisationId: string;
  raisonSociale: string;
  siren: string;
  numeroTVA: string;

  constructor(props: SocieteProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.raisonSociale = props.raisonSociale;
    this.siren = props.siren;
    this.numeroTVA = props.numeroTVA;
  }

  // Add domain business logic methods here
}

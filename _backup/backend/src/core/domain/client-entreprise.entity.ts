import { BaseEntity } from './base.entity';

export interface ClientEntrepriseProps {
  id?: string;
  raisonSociale: string;
  numeroTVA: string;
  siren: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ClientEntrepriseEntity extends BaseEntity {
  raisonSociale: string;
  numeroTVA: string;
  siren: string;

  constructor(props: ClientEntrepriseProps) {
    super(props);
    this.raisonSociale = props.raisonSociale;
    this.numeroTVA = props.numeroTVA;
    this.siren = props.siren;
  }

  // Add domain business logic methods here
}

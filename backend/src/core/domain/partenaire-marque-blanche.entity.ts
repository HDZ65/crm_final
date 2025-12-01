import { BaseEntity } from './base.entity';

export interface PartenaireMarqueBlancheProps {
  id?: string;
  denomination: string;
  siren: string;
  numeroTVA: string;
  contactSupportEmail: string;
  telephone: string;
  statutId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PartenaireMarqueBlancheEntity extends BaseEntity {
  denomination: string;
  siren: string;
  numeroTVA: string;
  contactSupportEmail: string;
  telephone: string;
  statutId: string;

  constructor(props: PartenaireMarqueBlancheProps) {
    super(props);
    this.denomination = props.denomination;
    this.siren = props.siren;
    this.numeroTVA = props.numeroTVA;
    this.contactSupportEmail = props.contactSupportEmail;
    this.telephone = props.telephone;
    this.statutId = props.statutId;
  }

  // Add domain business logic methods here
}

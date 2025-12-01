import { BaseEntity } from './base.entity';

export interface AdresseProps {
  id?: string;
  clientBaseId: string;
  ligne1: string;
  ligne2?: string | null;
  codePostal: string;
  ville: string;
  pays: string;
  type: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AdresseEntity extends BaseEntity {
  clientBaseId: string;
  ligne1: string;
  ligne2?: string | null;
  codePostal: string;
  ville: string;
  pays: string;
  type: string;

  constructor(props: AdresseProps) {
    super(props);
    this.clientBaseId = props.clientBaseId;
    this.ligne1 = props.ligne1;
    this.ligne2 = props.ligne2 ?? null;
    this.codePostal = props.codePostal;
    this.ville = props.ville;
    this.pays = props.pays;
    this.type = props.type;
  }

  // Add domain business logic methods here
}

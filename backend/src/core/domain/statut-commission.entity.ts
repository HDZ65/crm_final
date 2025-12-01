import { BaseEntity } from './base.entity';

export interface StatutCommissionProps {
  id?: string;
  code: string;
  nom: string;
  description?: string | null;
  ordreAffichage: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StatutCommissionEntity extends BaseEntity {
  code: string;
  nom: string;
  description?: string | null;
  ordreAffichage: number;

  constructor(props: StatutCommissionProps) {
    super(props);
    this.code = props.code;
    this.nom = props.nom;
    this.description = props.description;
    this.ordreAffichage = props.ordreAffichage;
  }
}

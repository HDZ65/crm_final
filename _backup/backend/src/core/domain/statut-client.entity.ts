import { BaseEntity } from './base.entity';

export interface StatutClientProps {
  id?: string;
  code: string;
  nom: string;
  description: string;
  ordreAffichage: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StatutClientEntity extends BaseEntity {
  code: string;
  nom: string;
  description: string;
  ordreAffichage: number;

  constructor(props: StatutClientProps) {
    super(props);
    this.code = props.code;
    this.nom = props.nom;
    this.description = props.description;
    this.ordreAffichage = props.ordreAffichage;
  }

  // Add domain business logic methods here
}

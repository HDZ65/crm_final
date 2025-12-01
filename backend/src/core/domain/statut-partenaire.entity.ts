import { BaseEntity } from './base.entity';

export interface StatutPartenaireProps {
  id?: string;
  code: string;
  nom: string;
  description: string;
  ordreAffichage: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StatutPartenaireEntity extends BaseEntity {
  code: string;
  nom: string;
  description: string;
  ordreAffichage: number;

  constructor(props: StatutPartenaireProps) {
    super(props);
    this.code = props.code;
    this.nom = props.nom;
    this.description = props.description;
    this.ordreAffichage = props.ordreAffichage;
  }

  // Add domain business logic methods here
}

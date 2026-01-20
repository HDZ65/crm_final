import { BaseEntity } from './base.entity';

export interface CompteProps {
  id?: string;
  nom: string;
  etat: string;
  dateCreation: string;
  createdByUserId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CompteEntity extends BaseEntity {
  nom: string;
  etat: string;
  dateCreation: string;
  createdByUserId: string;

  constructor(props: CompteProps) {
    super(props);
    this.nom = props.nom;
    this.etat = props.etat;
    this.dateCreation = props.dateCreation;
    this.createdByUserId = props.createdByUserId;
  }

  // Add domain business logic methods here
}

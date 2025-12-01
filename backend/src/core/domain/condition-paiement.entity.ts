import { BaseEntity } from './base.entity';

export interface ConditionPaiementProps {
  id?: string;
  code: string;
  nom: string;
  description: string;
  delaiJours: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ConditionPaiementEntity extends BaseEntity {
  code: string;
  nom: string;
  description: string;
  delaiJours: number;

  constructor(props: ConditionPaiementProps) {
    super(props);
    this.code = props.code;
    this.nom = props.nom;
    this.description = props.description;
    this.delaiJours = props.delaiJours;
  }

  // Add domain business logic methods here
}

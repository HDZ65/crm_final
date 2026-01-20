import { BaseEntity } from './base.entity';

export interface PeriodeFacturationProps {
  id?: string;
  code: string;
  nom: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PeriodeFacturationEntity extends BaseEntity {
  code: string;
  nom: string;
  description: string;

  constructor(props: PeriodeFacturationProps) {
    super(props);
    this.code = props.code;
    this.nom = props.nom;
    this.description = props.description;
  }

  // Add domain business logic methods here
}

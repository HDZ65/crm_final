import { BaseEntity } from './base.entity';

export interface TypeActiviteProps {
  id?: string;
  code: string;
  nom: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TypeActiviteEntity extends BaseEntity {
  code: string;
  nom: string;
  description: string;

  constructor(props: TypeActiviteProps) {
    super(props);
    this.code = props.code;
    this.nom = props.nom;
    this.description = props.description;
  }

  // Add domain business logic methods here
}

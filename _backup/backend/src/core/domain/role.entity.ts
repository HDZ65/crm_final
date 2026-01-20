import { BaseEntity } from './base.entity';

export interface RoleProps {
  id?: string;
  code: string;
  nom: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RoleEntity extends BaseEntity {
  code: string;
  nom: string;
  description: string;

  constructor(props: RoleProps) {
    super(props);
    this.code = props.code;
    this.nom = props.nom;
    this.description = props.description;
  }

  // Add domain business logic methods here
}

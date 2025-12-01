import { BaseEntity } from './base.entity';

export interface GroupeProps {
  id?: string;
  organisationId: string;
  nom: string;
  description?: string | null;
  type: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class GroupeEntity extends BaseEntity {
  organisationId: string;
  nom: string;
  description?: string | null;
  type: string;

  constructor(props: GroupeProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.nom = props.nom;
    this.description = props.description;
    this.type = props.type;
  }

  // Add domain business logic methods here
}

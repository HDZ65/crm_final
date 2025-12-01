import { BaseEntity } from './base.entity';

export interface ModeleDistributionProps {
  id?: string;
  code: string;
  nom: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ModeleDistributionEntity extends BaseEntity {
  code: string;
  nom: string;
  description: string;

  constructor(props: ModeleDistributionProps) {
    super(props);
    this.code = props.code;
    this.nom = props.nom;
    this.description = props.description;
  }

  // Add domain business logic methods here
}

import { BaseEntity } from './base.entity';

export interface MembrePartenaireProps {
  id?: string;
  utilisateurId: string;
  partenaireMarqueBlancheId: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MembrePartenaireEntity extends BaseEntity {
  utilisateurId: string;
  partenaireMarqueBlancheId: string;
  role: string;

  constructor(props: MembrePartenaireProps) {
    super(props);
    this.utilisateurId = props.utilisateurId;
    this.partenaireMarqueBlancheId = props.partenaireMarqueBlancheId;
    this.role = props.role;
  }

  // Add domain business logic methods here
}

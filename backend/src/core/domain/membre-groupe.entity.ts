import { BaseEntity } from './base.entity';

export interface MembreGroupeProps {
  id?: string;
  membreCompteId: string;
  groupeId: string;
  roleLocal: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MembreGroupeEntity extends BaseEntity {
  membreCompteId: string;
  groupeId: string;
  roleLocal: string;

  constructor(props: MembreGroupeProps) {
    super(props);
    this.membreCompteId = props.membreCompteId;
    this.groupeId = props.groupeId;
    this.roleLocal = props.roleLocal;
  }

  // Add domain business logic methods here
}

import { BaseEntity } from './base.entity';

export interface GroupeEntiteProps {
  id?: string;
  groupeId: string;
  entiteId: string;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class GroupeEntiteEntity extends BaseEntity {
  groupeId: string;
  entiteId: string;
  type?: string;

  constructor(props: GroupeEntiteProps) {
    super(props);
    this.groupeId = props.groupeId;
    this.entiteId = props.entiteId;
    this.type = props.type;
  }

  // Add domain business logic methods here
}

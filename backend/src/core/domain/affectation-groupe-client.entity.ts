import { BaseEntity } from './base.entity';

export interface AffectationGroupeClientProps {
  id?: string;
  groupeId: string;
  clientBaseId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AffectationGroupeClientEntity extends BaseEntity {
  groupeId: string;
  clientBaseId: string;

  constructor(props: AffectationGroupeClientProps) {
    super(props);
    this.groupeId = props.groupeId;
    this.clientBaseId = props.clientBaseId;
  }

  // Add domain business logic methods here
}

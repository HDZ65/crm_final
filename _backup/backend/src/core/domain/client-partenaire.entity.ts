import { BaseEntity } from './base.entity';

export interface ClientPartenaireProps {
  id?: string;
  clientBaseId: string;
  partenaireId: string;
  rolePartenaireId: string;
  validFrom: string;
  validTo: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ClientPartenaireEntity extends BaseEntity {
  clientBaseId: string;
  partenaireId: string;
  rolePartenaireId: string;
  validFrom: string;
  validTo: string;

  constructor(props: ClientPartenaireProps) {
    super(props);
    this.clientBaseId = props.clientBaseId;
    this.partenaireId = props.partenaireId;
    this.rolePartenaireId = props.rolePartenaireId;
    this.validFrom = props.validFrom;
    this.validTo = props.validTo;
  }

  // Add domain business logic methods here
}

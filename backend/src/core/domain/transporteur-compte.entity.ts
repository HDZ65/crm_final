import { BaseEntity } from './base.entity';

export interface TransporteurCompteProps {
  id?: string;
  type: string;
  organisationId: string;
  contractNumber: string;
  password: string;
  labelFormat: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TransporteurCompteEntity extends BaseEntity {
  type: string;
  organisationId: string;
  contractNumber: string;
  password: string;
  labelFormat: string;
  actif: boolean;

  constructor(props: TransporteurCompteProps) {
    super(props);
    this.type = props.type;
    this.organisationId = props.organisationId;
    this.contractNumber = props.contractNumber;
    this.password = props.password;
    this.labelFormat = props.labelFormat;
    this.actif = props.actif;
  }

  // Add domain business logic methods here
}

import { BaseEntity } from './base.entity';

export interface EvenementSuiviProps {
  id?: string;
  expeditionId: string;
  code: string;
  label: string;
  dateEvenement: string;
  lieu: string;
  raw: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EvenementSuiviEntity extends BaseEntity {
  expeditionId: string;
  code: string;
  label: string;
  dateEvenement: string;
  lieu: string;
  raw: string;

  constructor(props: EvenementSuiviProps) {
    super(props);
    this.expeditionId = props.expeditionId;
    this.code = props.code;
    this.label = props.label;
    this.dateEvenement = props.dateEvenement;
    this.lieu = props.lieu;
    this.raw = props.raw;
  }

  // Add domain business logic methods here
}

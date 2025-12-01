import { BaseEntity } from './base.entity';

export interface HistoriqueStatutContratProps {
  id?: string;
  contratId: string;
  ancienStatutId: string;
  nouveauStatutId: string;
  dateChangement: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class HistoriqueStatutContratEntity extends BaseEntity {
  contratId: string;
  ancienStatutId: string;
  nouveauStatutId: string;
  dateChangement: string;

  constructor(props: HistoriqueStatutContratProps) {
    super(props);
    this.contratId = props.contratId;
    this.ancienStatutId = props.ancienStatutId;
    this.nouveauStatutId = props.nouveauStatutId;
    this.dateChangement = props.dateChangement;
  }

  // Add domain business logic methods here
}

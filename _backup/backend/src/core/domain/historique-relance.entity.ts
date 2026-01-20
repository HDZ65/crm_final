import { BaseEntity } from './base.entity';

export type RelanceResultat = 'SUCCES' | 'ECHEC' | 'IGNORE';

export interface HistoriqueRelanceProps {
  id?: string;
  organisationId: string;
  regleRelanceId: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  tacheCreeeId?: string;
  dateExecution: Date;
  resultat: RelanceResultat;
  messageErreur?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class HistoriqueRelanceEntity extends BaseEntity {
  organisationId: string;
  regleRelanceId: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  tacheCreeeId?: string;
  dateExecution: Date;
  resultat: RelanceResultat;
  messageErreur?: string;
  metadata?: Record<string, any>;

  constructor(props: HistoriqueRelanceProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.regleRelanceId = props.regleRelanceId;
    this.clientId = props.clientId;
    this.contratId = props.contratId;
    this.factureId = props.factureId;
    this.tacheCreeeId = props.tacheCreeeId;
    this.dateExecution = props.dateExecution;
    this.resultat = props.resultat;
    this.messageErreur = props.messageErreur;
    this.metadata = props.metadata;
  }
}

import { BaseEntity } from './base.entity';

export interface ActiviteProps {
  id?: string;
  typeId: string;
  dateActivite: string;
  sujet: string;
  commentaire: string;
  echeance: string;
  clientBaseId: string;
  contratId: string;
  clientPartenaireId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ActiviteEntity extends BaseEntity {
  typeId: string;
  dateActivite: string;
  sujet: string;
  commentaire: string;
  echeance: string;
  clientBaseId: string;
  contratId: string;
  clientPartenaireId: string;

  constructor(props: ActiviteProps) {
    super(props);
    this.typeId = props.typeId;
    this.dateActivite = props.dateActivite;
    this.sujet = props.sujet;
    this.commentaire = props.commentaire;
    this.echeance = props.echeance;
    this.clientBaseId = props.clientBaseId;
    this.contratId = props.contratId;
    this.clientPartenaireId = props.clientPartenaireId;
  }

  // Add domain business logic methods here
}

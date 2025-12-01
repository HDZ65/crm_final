import { BaseEntity } from './base.entity';

export interface LigneContratProps {
  id?: string;
  quantite: number;
  prixUnitaire: number;
  contratId: string;
  periodeFacturationId: string;
  produitId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class LigneContratEntity extends BaseEntity {
  quantite: number;
  prixUnitaire: number;
  contratId: string;
  periodeFacturationId: string;
  produitId: string;

  constructor(props: LigneContratProps) {
    super(props);
    this.quantite = props.quantite;
    this.prixUnitaire = props.prixUnitaire;
    this.contratId = props.contratId;
    this.periodeFacturationId = props.periodeFacturationId;
    this.produitId = props.produitId;
  }

  // Add domain business logic methods here
}

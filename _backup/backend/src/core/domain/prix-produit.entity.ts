import { BaseEntity } from './base.entity';

export interface PrixProduitProps {
  id?: string;
  prix: number;
  periodeFacturationId: string;
  remisePourcent: number;
  produitId: string;
  grilleTarifaireId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PrixProduitEntity extends BaseEntity {
  prix: number;
  periodeFacturationId: string;
  remisePourcent: number;
  produitId: string;
  grilleTarifaireId: string;

  constructor(props: PrixProduitProps) {
    super(props);
    this.prix = props.prix;
    this.periodeFacturationId = props.periodeFacturationId;
    this.remisePourcent = props.remisePourcent;
    this.produitId = props.produitId;
    this.grilleTarifaireId = props.grilleTarifaireId;
  }

  // Add domain business logic methods here
}

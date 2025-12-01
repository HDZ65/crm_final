import { BaseEntity } from './base.entity';

export interface ProduitProps {
  id?: string;
  sku: string;
  nom: string;
  description: string;
  actif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProduitEntity extends BaseEntity {
  sku: string;
  nom: string;
  description: string;
  actif: boolean;

  constructor(props: ProduitProps) {
    super(props);
    this.sku = props.sku;
    this.nom = props.nom;
    this.description = props.description;
    this.actif = props.actif;
  }

  // Add domain business logic methods here
}

import { BaseEntity } from './base.entity';

export interface ProduitProps {
  id?: string;
  societeId: string;
  gammeId?: string;
  sku: string;
  nom: string;
  description: string;
  categorie?: string;
  type: 'Interne' | 'Partenaire';
  prix: number;
  tauxTVA: number;
  devise: string;
  fournisseur?: string;
  actif: boolean;
  // Champs promotion
  promotionActive?: boolean;
  promotionPourcentage?: number;
  promotionDateDebut?: string;
  promotionDateFin?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProduitEntity extends BaseEntity {
  societeId: string;
  gammeId?: string;
  sku: string;
  nom: string;
  description: string;
  categorie?: string;
  type: 'Interne' | 'Partenaire';
  prix: number;
  tauxTVA: number;
  devise: string;
  fournisseur?: string;
  actif: boolean;
  // Champs promotion
  promotionActive: boolean;
  promotionPourcentage?: number;
  promotionDateDebut?: string;
  promotionDateFin?: string;

  constructor(props: ProduitProps) {
    super(props);
    this.societeId = props.societeId;
    this.gammeId = props.gammeId;
    this.sku = props.sku;
    this.nom = props.nom;
    this.description = props.description;
    this.categorie = props.categorie;
    this.type = props.type;
    this.prix = props.prix;
    this.tauxTVA = props.tauxTVA;
    this.devise = props.devise;
    this.fournisseur = props.fournisseur;
    this.actif = props.actif;
    this.promotionActive = props.promotionActive ?? false;
    this.promotionPourcentage = props.promotionPourcentage;
    this.promotionDateDebut = props.promotionDateDebut;
    this.promotionDateFin = props.promotionDateFin;
  }

  get prixTTC(): number {
    return Math.round(this.prix * (1 + this.tauxTVA / 100) * 100) / 100;
  }

  get prixPromo(): number | undefined {
    if (!this.promotionActive || !this.promotionPourcentage) return undefined;
    return (
      Math.round(this.prix * (1 - this.promotionPourcentage / 100) * 100) / 100
    );
  }

  get prixPromoTTC(): number | undefined {
    const promo = this.prixPromo;
    if (!promo) return undefined;
    return Math.round(promo * (1 + this.tauxTVA / 100) * 100) / 100;
  }
}

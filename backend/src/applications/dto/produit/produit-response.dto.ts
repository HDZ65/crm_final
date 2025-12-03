export class ProduitDto {
  id: string;
  societeId: string;
  gammeId?: string;
  sku: string;
  nom: string;
  description: string;
  categorie?: string;
  type: 'Interne' | 'Partenaire';
  prix: number;
  tauxTVA: number;
  prixTTC: number;
  devise: string;
  fournisseur?: string;
  actif: boolean;
  // Champs promotion
  promotionActive: boolean;
  promotionPourcentage?: number;
  promotionDateDebut?: string;
  promotionDateFin?: string;
  prixPromo?: number;
  prixPromoTTC?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProduitDto>) {
    Object.assign(this, partial);
    if (this.prix != null && this.tauxTVA != null) {
      this.prixTTC = Math.round(this.prix * (1 + this.tauxTVA / 100) * 100) / 100;

      // Calcul du prix promo si promotion active
      if (this.promotionActive && this.promotionPourcentage != null) {
        this.prixPromo = Math.round(this.prix * (1 - this.promotionPourcentage / 100) * 100) / 100;
        this.prixPromoTTC = Math.round(this.prixPromo * (1 + this.tauxTVA / 100) * 100) / 100;
      }
    }
  }
}

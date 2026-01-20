import { BaseEntity } from './base.entity';

export interface LigneFactureProps {
  id?: string;
  factureId: string;
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  description?: string;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  ordreAffichage: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class LigneFactureEntity extends BaseEntity {
  factureId: string;
  produitId: string;
  quantite: number;
  prixUnitaire: number;
  description?: string;
  montantHT: number;
  tauxTVA: number;
  montantTVA: number;
  montantTTC: number;
  ordreAffichage: number;

  constructor(props: LigneFactureProps) {
    super(props);
    this.factureId = props.factureId;
    this.produitId = props.produitId;
    this.quantite = props.quantite;
    this.prixUnitaire = props.prixUnitaire;
    this.description = props.description;
    this.montantHT = props.montantHT;
    this.tauxTVA = props.tauxTVA;
    this.montantTVA = props.montantTVA;
    this.montantTTC = props.montantTTC;
    this.ordreAffichage = props.ordreAffichage;
  }

  /**
   * Business logic: Calculate amounts from quantity, unit price and VAT rate
   * This ensures consistent calculation logic across the application
   * All amounts are rounded to 2 decimal places for financial precision
   *
   * @param quantite - Quantity of items
   * @param prixUnitaire - Unit price excluding VAT
   * @param tauxTVA - VAT rate (e.g., 20 for 20%)
   * @returns Object with calculated amounts (HT, TVA, TTC)
   */
  static calculateAmounts(
    quantite: number,
    prixUnitaire: number,
    tauxTVA: number,
  ): { montantHT: number; montantTVA: number; montantTTC: number } {
    // Calculate amount excluding VAT (HT = Hors Taxes)
    const montantHT = Math.round(quantite * prixUnitaire * 100) / 100;

    // Calculate VAT amount
    const montantTVA = Math.round(montantHT * (tauxTVA / 100) * 100) / 100;

    // Calculate total including VAT (TTC = Toutes Taxes Comprises)
    const montantTTC = Math.round((montantHT + montantTVA) * 100) / 100;

    return { montantHT, montantTVA, montantTTC };
  }
}

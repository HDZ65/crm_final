import { BaseEntity } from './base.entity';
import { LigneFactureEntity } from './ligne-facture.entity';

export interface FactureClientInfo {
  id: string;
  nom: string;
  prenom: string;
}

export interface FactureStatutInfo {
  id: string;
  code: string;
  nom: string;
  description?: string;
  ordreAffichage: number;
}

export interface FactureProps {
  id?: string;
  organisationId: string;
  numero: string | null; // Nullable for drafts
  dateEmission: string;
  montantHT: number;
  montantTTC: number;
  statutId: string;
  emissionFactureId: string;
  clientBaseId: string;
  contratId?: string | null;
  clientPartenaireId: string;
  adresseFacturationId: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Relations optionnelles
  client?: FactureClientInfo;
  statut?: FactureStatutInfo;
  lignes?: LigneFactureEntity[]; // Invoice lines
}

export class FactureEntity extends BaseEntity {
  organisationId: string;
  numero: string | null; // Nullable for drafts
  dateEmission: string;
  montantHT: number;
  montantTTC: number;
  statutId: string;
  emissionFactureId: string;
  clientBaseId: string;
  contratId?: string | null;
  clientPartenaireId: string;
  adresseFacturationId: string;
  // Relations optionnelles
  client?: FactureClientInfo;
  statut?: FactureStatutInfo;
  lignes?: LigneFactureEntity[]; // Invoice lines

  constructor(props: FactureProps) {
    super(props);
    this.organisationId = props.organisationId;
    this.numero = props.numero ?? null;
    this.dateEmission = props.dateEmission;
    this.montantHT = props.montantHT;
    this.montantTTC = props.montantTTC;
    this.statutId = props.statutId;
    this.emissionFactureId = props.emissionFactureId;
    this.clientBaseId = props.clientBaseId;
    this.contratId = props.contratId ?? null;
    this.clientPartenaireId = props.clientPartenaireId;
    this.adresseFacturationId = props.adresseFacturationId;
    this.client = props.client;
    this.statut = props.statut;
    this.lignes = props.lignes;
  }

  /**
   * Business logic: Check if invoice is a draft
   * @returns true if invoice status is BROUILLON
   */
  estBrouillon(): boolean {
    return this.statut?.code === 'BROUILLON';
  }

  /**
   * Business logic: Validate if invoice can be finalized/validated
   * Checks business rules before validation
   * @returns Object with validation result and error messages
   */
  canBeValidated(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if invoice has at least one line
    if (!this.lignes || this.lignes.length === 0) {
      errors.push('Au moins une ligne de facture est requise');
    }

    // Check if total amount is positive
    if (this.montantHT <= 0) {
      errors.push('Le montant HT doit être supérieur à 0');
    }

    // Check if invoice is a draft
    if (!this.estBrouillon()) {
      errors.push('Seules les factures brouillon peuvent être validées');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Business logic: Calculate invoice totals from all lines
   * Ensures accuracy by summing all line amounts
   * @param lignes - Array of invoice lines
   * @returns Object with calculated totals (HT and TTC)
   */
  static calculateTotalsFromLines(
    lignes: LigneFactureEntity[],
  ): {
    montantHT: number;
    montantTTC: number;
  } {
    const montantHT = lignes.reduce((sum, ligne) => sum + ligne.montantHT, 0);
    const montantTTC = lignes.reduce((sum, ligne) => sum + ligne.montantTTC, 0);

    return {
      montantHT: Math.round(montantHT * 100) / 100,
      montantTTC: Math.round(montantTTC * 100) / 100,
    };
  }
}

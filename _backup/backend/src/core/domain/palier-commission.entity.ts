import { BaseEntity } from './base.entity';

export type TypePalier = 'volume' | 'ca' | 'prime_produit';

export class PalierCommissionEntity extends BaseEntity {
  organisationId: string;
  baremeId: string; // Lien vers BaremeCommission

  // Identification
  code: string;
  nom: string;
  description: string | null;
  typePalier: TypePalier;

  // Seuils
  seuilMin: number; // Ex: 30 contrats, 10000€ CA
  seuilMax: number | null; // null = pas de max

  // Récompense
  montantPrime: number; // Ex: 200€
  tauxBonus: number | null; // % bonus optionnel

  // Configuration
  cumulable: boolean; // Peut se cumuler avec autres paliers
  parPeriode: boolean; // Reset chaque période (mois)
  typeProduit: string | null; // Filtre par produit (telecom, depanssur, etc.)

  // Ordre d'application
  ordre: number;
  actif: boolean;

  constructor(partial: Partial<PalierCommissionEntity>) {
    super();
    Object.assign(this, partial);
  }
}

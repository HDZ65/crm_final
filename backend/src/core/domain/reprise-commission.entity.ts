import { BaseEntity } from './base.entity';

export type TypeReprise = 'resiliation' | 'impaye' | 'annulation' | 'regularisation';
export type StatutReprise = 'en_attente' | 'appliquee' | 'annulee';

export class RepriseCommissionEntity extends BaseEntity {
  organisationId: string;
  commissionOriginaleId: string; // Lien vers la commission d'origine
  contratId: string;
  apporteurId: string;

  // Identification
  reference: string;
  typeReprise: TypeReprise;

  // Montants
  montantReprise: number; // Montant à reprendre (négatif)
  tauxReprise: number; // % de la commission d'origine
  montantOriginal: number; // Commission originale pour traçabilité

  // Période
  periodeOrigine: string; // Période de la commission d'origine (YYYY-MM)
  periodeApplication: string; // Période où la reprise est appliquée

  // Dates
  dateEvenement: Date; // Date résiliation/impayé
  dateLimite: Date; // Date limite de reprise (selon fenêtre)
  dateApplication: Date | null; // Date effective d'application

  // Statut
  statutReprise: StatutReprise;
  bordereauId: string | null; // Lien vers le bordereau si appliquée

  // Détails
  motif: string | null;
  commentaire: string | null;

  constructor(partial: Partial<RepriseCommissionEntity>) {
    super();
    Object.assign(this, partial);
  }
}

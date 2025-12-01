import { BaseEntity } from './base.entity';

export type TypeCalcul = 'fixe' | 'pourcentage' | 'palier' | 'mixte';
export type BaseCalcul = 'cotisation_ht' | 'ca_ht' | 'forfait';
export type TypeProduit = 'telecom' | 'assurance_sante' | 'prevoyance' | 'energie' | 'conciergerie' | 'mondial_tv' | 'autre';
export type ProfilRemuneration = 'vrp' | 'manager' | 'directeur' | 'partenaire';

export class BaremeCommissionEntity extends BaseEntity {
  organisationId: string;
  code: string;
  nom: string;
  description: string | null;

  // Type de calcul
  typeCalcul: TypeCalcul;
  baseCalcul: BaseCalcul;

  // Valeurs de calcul
  montantFixe: number | null; // Pour type fixe
  tauxPourcentage: number | null; // Pour type pourcentage (ex: 5.5 = 5.5%)

  // Récurrence
  recurrenceActive: boolean;
  tauxRecurrence: number | null; // % sur récurrence
  dureeRecurrenceMois: number | null; // null = illimitée

  // Reprises
  dureeReprisesMois: number; // 3, 6 ou 12 mois
  tauxReprise: number; // 100% par défaut

  // Filtres d'application
  typeProduit: TypeProduit | null; // null = tous produits
  profilRemuneration: ProfilRemuneration | null; // null = tous profils
  societeId: string | null; // null = toutes sociétés

  // Versioning
  version: number;
  dateEffet: Date;
  dateFin: Date | null; // null = actif
  actif: boolean;

  // Audit
  creePar: string | null;
  modifiePar: string | null;
  motifModification: string | null;

  constructor(partial: Partial<BaremeCommissionEntity>) {
    super();
    Object.assign(this, partial);
  }
}

import { BaseEntity } from './base.entity';

export type TypeLigne = 'commission' | 'reprise' | 'acompte' | 'prime' | 'regularisation';
export type StatutLigne = 'selectionnee' | 'deselectionnee' | 'validee' | 'rejetee';

export class LigneBordereauEntity extends BaseEntity {
  organisationId: string;
  bordereauId: string;
  commissionId: string | null; // Null pour reprises/primes
  repriseId: string | null;

  // Type de ligne
  typeLigne: TypeLigne;

  // Référence contrat
  contratId: string;
  contratReference: string;
  clientNom: string | null;
  produitNom: string | null;

  // Montants
  montantBrut: number;
  montantReprise: number;
  montantNet: number;

  // Détails calcul
  baseCalcul: string | null; // cotisation_ht, ca_ht, forfait
  tauxApplique: number | null;
  baremeId: string | null;

  // Validation ADV
  statutLigne: StatutLigne;
  selectionne: boolean;
  motifDeselection: string | null;
  validateurId: string | null;
  dateValidation: Date | null;

  // Ordre d'affichage
  ordre: number;

  constructor(partial: Partial<LigneBordereauEntity>) {
    super();
    Object.assign(this, partial);
  }
}

export class LigneBordereauResponseDto {
  id: string;
  organisationId: string;
  bordereauId: string;
  commissionId: string | null;
  repriseId: string | null;
  typeLigne: string;
  contratId: string;
  contratReference: string;
  clientNom: string | null;
  produitNom: string | null;
  montantBrut: number;
  montantReprise: number;
  montantNet: number;
  baseCalcul: string | null;
  tauxApplique: number | null;
  baremeId: string | null;
  statutLigne: string;
  selectionne: boolean;
  motifDeselection: string | null;
  validateurId: string | null;
  dateValidation: Date | null;
  ordre: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<LigneBordereauResponseDto>) {
    Object.assign(this, partial);
  }
}

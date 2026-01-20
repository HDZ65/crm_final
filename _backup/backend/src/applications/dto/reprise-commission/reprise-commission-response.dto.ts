export class RepriseCommissionResponseDto {
  id: string;
  organisationId: string;
  commissionOriginaleId: string;
  contratId: string;
  apporteurId: string;
  reference: string;
  typeReprise: string;
  montantReprise: number;
  tauxReprise: number;
  montantOriginal: number;
  periodeOrigine: string;
  periodeApplication: string;
  dateEvenement: Date | string;
  dateLimite: Date | string;
  dateApplication: Date | string | null;
  statutReprise: string;
  bordereauId: string | null;
  motif: string | null;
  commentaire: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RepriseCommissionResponseDto>) {
    Object.assign(this, partial);
  }
}

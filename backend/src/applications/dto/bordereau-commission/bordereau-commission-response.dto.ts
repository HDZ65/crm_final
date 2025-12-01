export class BordereauCommissionResponseDto {
  id: string;
  organisationId: string;
  reference: string;
  periode: string;
  apporteurId: string;
  totalBrut: number;
  totalReprises: number;
  totalAcomptes: number;
  totalNetAPayer: number;
  nombreLignes: number;
  statutBordereau: string;
  dateValidation: Date | null;
  validateurId: string | null;
  dateExport: Date | null;
  fichierPdfUrl: string | null;
  fichierExcelUrl: string | null;
  commentaire: string | null;
  creePar: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<BordereauCommissionResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ApporteurSummaryForBordereauDto {
  id: string;
  nom: string;
  prenom: string;
  typeApporteur: string;

  constructor(partial: Partial<ApporteurSummaryForBordereauDto>) {
    Object.assign(this, partial);
  }
}

export class BordereauWithDetailsResponseDto {
  id: string;
  organisationId: string;
  reference: string;
  periode: string;
  totalBrut: number;
  totalReprises: number;
  totalAcomptes: number;
  totalNetAPayer: number;
  nombreLignes: number;
  statutBordereau: string;
  dateValidation: Date | null;
  dateExport: Date | null;
  fichierPdfUrl: string | null;
  fichierExcelUrl: string | null;
  apporteur: ApporteurSummaryForBordereauDto | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<BordereauWithDetailsResponseDto>) {
    Object.assign(this, partial);
  }
}

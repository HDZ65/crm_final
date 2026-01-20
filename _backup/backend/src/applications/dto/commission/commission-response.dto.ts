export class CommissionResponseDto {
  id: string;
  organisationId: string;
  reference: string;
  apporteurId: string;
  contratId: string;
  produitId?: string | null;
  compagnie: string;
  typeBase: string;
  montantBrut: number;
  montantReprises: number;
  montantAcomptes: number;
  montantNetAPayer: number;
  statutId: string;
  periode: string;
  dateCreation: Date | string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<CommissionResponseDto>) {
    Object.assign(this, partial);
  }
}

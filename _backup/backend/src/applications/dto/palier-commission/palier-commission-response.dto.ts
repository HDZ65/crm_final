export class PalierCommissionResponseDto {
  id: string;
  organisationId: string;
  baremeId: string;
  code: string;
  nom: string;
  description: string | null;
  typePalier: string;
  seuilMin: number;
  seuilMax: number | null;
  montantPrime: number;
  tauxBonus: number | null;
  cumulable: boolean;
  parPeriode: boolean;
  typeProduit: string | null;
  ordre: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PalierCommissionResponseDto>) {
    Object.assign(this, partial);
  }
}

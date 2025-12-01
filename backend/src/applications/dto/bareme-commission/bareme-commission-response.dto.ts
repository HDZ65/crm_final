export class BaremeCommissionResponseDto {
  id: string;
  organisationId: string;
  code: string;
  nom: string;
  description: string | null;
  typeCalcul: string;
  baseCalcul: string;
  montantFixe: number | null;
  tauxPourcentage: number | null;
  recurrenceActive: boolean;
  tauxRecurrence: number | null;
  dureeRecurrenceMois: number | null;
  dureeReprisesMois: number;
  tauxReprise: number;
  typeProduit: string | null;
  profilRemuneration: string | null;
  societeId: string | null;
  version: number;
  dateEffet: Date | string;
  dateFin: Date | string | null;
  actif: boolean;
  creePar: string | null;
  modifiePar: string | null;
  motifModification: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<BaremeCommissionResponseDto>) {
    Object.assign(this, partial);
  }
}

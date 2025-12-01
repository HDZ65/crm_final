export class StatutCommissionResponseDto {
  id: string;
  code: string;
  nom: string;
  description?: string | null;
  ordreAffichage: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StatutCommissionResponseDto>) {
    Object.assign(this, partial);
  }
}

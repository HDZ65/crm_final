export class StatutFactureDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  ordreAffichage: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StatutFactureDto>) {
    Object.assign(this, partial);
  }
}

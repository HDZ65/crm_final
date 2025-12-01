export class StatutPartenaireDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  ordreAffichage: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StatutPartenaireDto>) {
    Object.assign(this, partial);
  }
}

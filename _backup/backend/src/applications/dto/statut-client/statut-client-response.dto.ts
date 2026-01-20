export class StatutClientDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  ordreAffichage: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StatutClientDto>) {
    Object.assign(this, partial);
  }
}

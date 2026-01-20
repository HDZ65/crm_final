export class StatutContratDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  ordreAffichage: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StatutContratDto>) {
    Object.assign(this, partial);
  }
}

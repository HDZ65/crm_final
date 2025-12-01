export class CompteDto {
  id: string;
  nom: string;
  etat: string;
  dateCreation: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<CompteDto>) {
    Object.assign(this, partial);
  }
}

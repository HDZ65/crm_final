export class GrilleTarifaireDto {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  estParDefaut: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<GrilleTarifaireDto>) {
    Object.assign(this, partial);
  }
}

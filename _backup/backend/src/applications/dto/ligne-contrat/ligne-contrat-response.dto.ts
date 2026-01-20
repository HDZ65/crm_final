export class LigneContratDto {
  id: string;
  quantite: number;
  prixUnitaire: number;
  contratId: string;
  periodeFacturationId: string;
  produitId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<LigneContratDto>) {
    Object.assign(this, partial);
  }
}

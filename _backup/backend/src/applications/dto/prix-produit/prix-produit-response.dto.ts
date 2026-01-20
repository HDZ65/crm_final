export class PrixProduitDto {
  id: string;
  prix: number;
  periodeFacturationId: string;
  remisePourcent: number;
  produitId: string;
  grilleTarifaireId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PrixProduitDto>) {
    Object.assign(this, partial);
  }
}

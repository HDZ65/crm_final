export class ProduitDto {
  id: string;
  sku: string;
  nom: string;
  description: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProduitDto>) {
    Object.assign(this, partial);
  }
}

export class MembrePartenaireDto {
  id: string;
  utilisateurId: string;
  partenaireMarqueBlancheId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MembrePartenaireDto>) {
    Object.assign(this, partial);
  }
}

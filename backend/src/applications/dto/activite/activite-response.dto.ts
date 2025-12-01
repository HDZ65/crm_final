export class ActiviteDto {
  id: string;
  typeId: string;
  dateActivite: string;
  sujet: string;
  commentaire: string;
  echeance: string;
  clientBaseId: string;
  contratId: string;
  clientPartenaireId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ActiviteDto>) {
    Object.assign(this, partial);
  }
}

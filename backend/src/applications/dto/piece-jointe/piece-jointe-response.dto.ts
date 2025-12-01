export class PieceJointeDto {
  id: string;
  nomFichier: string;
  url: string;
  dateUpload: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PieceJointeDto>) {
    Object.assign(this, partial);
  }
}

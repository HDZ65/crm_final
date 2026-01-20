export class ColisDto {
  id: string;
  expeditionId: string;
  poidsGr: number;
  longCm: number;
  largCm: number;
  hautCm: number;
  valeurDeclaree: number;
  contenu: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ColisDto>) {
    Object.assign(this, partial);
  }
}

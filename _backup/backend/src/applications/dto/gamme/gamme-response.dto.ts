export class GammeDto {
  id: string;
  societeId: string;
  nom: string;
  description?: string;
  icone?: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<GammeDto>) {
    Object.assign(this, partial);
  }
}

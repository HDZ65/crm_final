export class PeriodeFacturationDto {
  id: string;
  code: string;
  nom: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PeriodeFacturationDto>) {
    Object.assign(this, partial);
  }
}

export class EvenementSuiviDto {
  id: string;
  expeditionId: string;
  code: string;
  label: string;
  dateEvenement: string;
  lieu: string;
  raw: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<EvenementSuiviDto>) {
    Object.assign(this, partial);
  }
}

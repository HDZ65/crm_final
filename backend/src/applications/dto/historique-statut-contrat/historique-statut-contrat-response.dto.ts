export class HistoriqueStatutContratDto {
  id: string;
  contratId: string;
  ancienStatutId: string;
  nouveauStatutId: string;
  dateChangement: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<HistoriqueStatutContratDto>) {
    Object.assign(this, partial);
  }
}

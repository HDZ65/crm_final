export class HistoriqueRelanceDto {
  id: string;
  organisationId: string;
  regleRelanceId: string;
  clientId?: string;
  contratId?: string;
  factureId?: string;
  tacheCreeeId?: string;
  dateExecution: Date;
  resultat: string;
  messageErreur?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<HistoriqueRelanceDto>) {
    Object.assign(this, partial);
  }
}

import { HistoriqueStatutContratEntity } from '../entities/historique-statut-contrat.entity';

export interface IHistoriqueStatutContratRepository {
  findById(id: string): Promise<HistoriqueStatutContratEntity | null>;
  findByContrat(contratId: string): Promise<HistoriqueStatutContratEntity[]>;
  save(entity: HistoriqueStatutContratEntity): Promise<HistoriqueStatutContratEntity>;
  delete(id: string): Promise<void>;
}

import { HistoriqueStatutContratEntity } from '../domain/historique-statut-contrat.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface HistoriqueStatutContratRepositoryPort
  extends BaseRepositoryPort<HistoriqueStatutContratEntity> {
  // Add custom repository methods here
}

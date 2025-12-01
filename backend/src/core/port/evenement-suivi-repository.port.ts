import { EvenementSuiviEntity } from '../domain/evenement-suivi.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EvenementSuiviRepositoryPort
  extends BaseRepositoryPort<EvenementSuiviEntity> {
  // Add custom repository methods here
}

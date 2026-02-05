import { EvenementSuiviEntity } from '../entities/evenement-suivi.entity';

export interface IEvenementSuiviRepository {
  findById(id: string): Promise<EvenementSuiviEntity | null>;
  findByExpedition(expeditionId: string): Promise<EvenementSuiviEntity[]>;
  save(entity: EvenementSuiviEntity): Promise<EvenementSuiviEntity>;
  delete(id: string): Promise<boolean>;
}

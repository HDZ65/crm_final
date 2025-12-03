import { HistoriqueRelanceEntity } from '../domain/historique-relance.entity';
import { BaseRepositoryPort } from './repository.port';

export interface HistoriqueRelanceRepositoryPort extends BaseRepositoryPort<HistoriqueRelanceEntity> {
  findByOrganisationId(organisationId: string): Promise<HistoriqueRelanceEntity[]>;
  findByRegleRelanceId(regleRelanceId: string): Promise<HistoriqueRelanceEntity[]>;
  findByClientId(clientId: string): Promise<HistoriqueRelanceEntity[]>;
  findByContratId(contratId: string): Promise<HistoriqueRelanceEntity[]>;
  findByFactureId(factureId: string): Promise<HistoriqueRelanceEntity[]>;
  findRecent(organisationId: string, limit: number): Promise<HistoriqueRelanceEntity[]>;
  existsForToday(regleRelanceId: string, clientId?: string, contratId?: string, factureId?: string): Promise<boolean>;
}

import { ReducBoxAccessEntity, ReducBoxAccessStatus } from '../entities/reducbox-access.entity';
import { ReducBoxAccessHistoryEntity } from '../entities/reducbox-access-history.entity';

export interface IReducBoxAccessRepository {
  findById(id: string): Promise<ReducBoxAccessEntity | null>;
  findByClientId(clientId: string): Promise<ReducBoxAccessEntity[]>;
  findByContratId(contratId: string): Promise<ReducBoxAccessEntity | null>;
  findByStatus(status: ReducBoxAccessStatus): Promise<ReducBoxAccessEntity[]>;
  create(entity: Partial<ReducBoxAccessEntity>): Promise<ReducBoxAccessEntity>;
  update(entity: ReducBoxAccessEntity): Promise<ReducBoxAccessEntity>;
  addHistory(history: Partial<ReducBoxAccessHistoryEntity>): Promise<ReducBoxAccessHistoryEntity>;
}

import { GroupeEntity } from '../domain/groupe.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GroupeRepositoryPort extends BaseRepositoryPort<GroupeEntity> {
  // Add custom repository methods here
}

import { GroupeEntiteEntity } from '../domain/groupe-entite.entity';
import { BaseRepositoryPort } from './repository.port';

export interface GroupeEntiteRepositoryPort
  extends BaseRepositoryPort<GroupeEntiteEntity> {
  findByGroupeAndEntite(groupeId: string, entiteId: string): Promise<GroupeEntiteEntity | null>;
  findByEntiteId(entiteId: string): Promise<GroupeEntiteEntity | null>;
}

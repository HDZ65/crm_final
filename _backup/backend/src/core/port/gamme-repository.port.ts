import { GammeEntity } from '../domain/gamme.entity';
import { BaseRepositoryPort } from './repository.port';

export interface GammeRepositoryPort extends BaseRepositoryPort<GammeEntity> {
  findBySocieteId(societeId: string): Promise<GammeEntity[]>;
}

import { FactureSettingsEntity } from '../domain/facture-settings.entity';
import { BaseRepositoryPort } from './repository.port';

export interface FactureSettingsRepositoryPort extends BaseRepositoryPort<FactureSettingsEntity> {
  findBySocieteId(societeId: string): Promise<FactureSettingsEntity | null>;
}

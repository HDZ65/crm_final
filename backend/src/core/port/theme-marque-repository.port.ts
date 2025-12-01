import { ThemeMarqueEntity } from '../domain/theme-marque.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ThemeMarqueRepositoryPort
  extends BaseRepositoryPort<ThemeMarqueEntity> {
  // Add custom repository methods here
}

import { AffectationGroupeClientEntity } from '../domain/affectation-groupe-client.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AffectationGroupeClientRepositoryPort
  extends BaseRepositoryPort<AffectationGroupeClientEntity> {
  // Add custom repository methods here
}

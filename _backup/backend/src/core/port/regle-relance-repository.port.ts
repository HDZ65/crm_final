import {
  RegleRelanceEntity,
  RelanceDeclencheur,
} from '../domain/regle-relance.entity';
import { BaseRepositoryPort } from './repository.port';

export interface RegleRelanceRepositoryPort extends BaseRepositoryPort<RegleRelanceEntity> {
  findByOrganisationId(organisationId: string): Promise<RegleRelanceEntity[]>;
  findActives(organisationId: string): Promise<RegleRelanceEntity[]>;
  findByDeclencheur(
    organisationId: string,
    declencheur: RelanceDeclencheur,
  ): Promise<RegleRelanceEntity[]>;
  findActivesByDeclencheur(
    organisationId: string,
    declencheur: RelanceDeclencheur,
  ): Promise<RegleRelanceEntity[]>;
}

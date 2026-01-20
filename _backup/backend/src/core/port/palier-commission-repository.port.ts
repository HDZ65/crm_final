import { PalierCommissionEntity } from '../domain/palier-commission.entity';
import { BaseRepositoryPort } from './repository.port';

export interface PalierCommissionRepositoryPort extends BaseRepositoryPort<PalierCommissionEntity> {
  findByOrganisationId(
    organisationId: string,
  ): Promise<PalierCommissionEntity[]>;
  findByBaremeId(baremeId: string): Promise<PalierCommissionEntity[]>;
  findActifsByBaremeId(baremeId: string): Promise<PalierCommissionEntity[]>;
  findByTypeProduit(typeProduit: string): Promise<PalierCommissionEntity[]>;
  findPalierApplicable(
    baremeId: string,
    typePalier: string,
    valeur: number,
  ): Promise<PalierCommissionEntity | null>;
}

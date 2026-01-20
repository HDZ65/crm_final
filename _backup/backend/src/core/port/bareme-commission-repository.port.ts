import { BaremeCommissionEntity } from '../domain/bareme-commission.entity';
import { BaseRepositoryPort } from './repository.port';

export interface BaremeCommissionRepositoryPort extends BaseRepositoryPort<BaremeCommissionEntity> {
  findByOrganisationId(
    organisationId: string,
  ): Promise<BaremeCommissionEntity[]>;
  findByCode(code: string): Promise<BaremeCommissionEntity | null>;
  findActifs(organisationId?: string): Promise<BaremeCommissionEntity[]>;
  findByTypeProduit(typeProduit: string): Promise<BaremeCommissionEntity[]>;
  findByProfilRemuneration(profil: string): Promise<BaremeCommissionEntity[]>;
  findApplicable(
    organisationId: string,
    typeProduit?: string,
    profilRemuneration?: string,
    date?: Date,
  ): Promise<BaremeCommissionEntity | null>;
  creerNouvelleVersion(
    baremeId: string,
    modifications: Partial<BaremeCommissionEntity>,
    modifiePar: string,
    motif: string,
  ): Promise<BaremeCommissionEntity>;
}

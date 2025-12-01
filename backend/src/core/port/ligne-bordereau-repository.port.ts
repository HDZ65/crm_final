import { LigneBordereauEntity } from '../domain/ligne-bordereau.entity';
import { BaseRepositoryPort } from './repository.port';

export interface LigneBordereauRepositoryPort
  extends BaseRepositoryPort<LigneBordereauEntity> {
  findByOrganisationId(organisationId: string): Promise<LigneBordereauEntity[]>;
  findByBordereauId(bordereauId: string): Promise<LigneBordereauEntity[]>;
  findSelectionneesByBordereauId(bordereauId: string): Promise<LigneBordereauEntity[]>;
  findByCommissionId(commissionId: string): Promise<LigneBordereauEntity[]>;
  findByContratId(contratId: string): Promise<LigneBordereauEntity[]>;
  selectionnerLigne(id: string): Promise<LigneBordereauEntity>;
  deselectionnerLigne(
    id: string,
    motif: string,
    validateurId: string,
  ): Promise<LigneBordereauEntity>;
  validerLigne(id: string, validateurId: string): Promise<LigneBordereauEntity>;
  deleteByBordereauId(bordereauId: string): Promise<void>;
}

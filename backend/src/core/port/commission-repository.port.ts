import { CommissionEntity } from '../domain/commission.entity';
import { BaseRepositoryPort } from './repository.port';

export interface CommissionWithDetails {
  commission: CommissionEntity;
  apporteur: {
    id: string;
    nom: string;
    prenom: string;
    typeApporteur: string;
  } | null;
  contrat: {
    id: string;
    referenceExterne: string;
    clientNom?: string | null;
  } | null;
  produit: {
    id: string;
    nom: string;
    sku: string;
  } | null;
  statut: {
    id: string;
    code: string;
    nom: string;
  } | null;
}

export interface CommissionRepositoryPort
  extends BaseRepositoryPort<CommissionEntity> {
  findByOrganisationId(organisationId: string): Promise<CommissionEntity[]>;
  findByApporteurId(apporteurId: string): Promise<CommissionEntity[]>;
  findByPeriode(periode: string): Promise<CommissionEntity[]>;
  findAllWithDetails(organisationId?: string): Promise<CommissionWithDetails[]>;
  findByIdWithDetails(id: string): Promise<CommissionWithDetails | null>;
}

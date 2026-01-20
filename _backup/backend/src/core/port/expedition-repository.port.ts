import { ExpeditionEntity } from '../domain/expedition.entity';
import { BaseRepositoryPort } from './repository.port';

export interface ExpeditionWithDetails {
  expedition: ExpeditionEntity;
  client: {
    id: string;
    nom: string;
    prenom: string;
    entreprise?: string | null;
    email?: string | null;
  } | null;
  contrat: {
    id: string;
    referenceExterne: string;
  } | null;
  transporteur: {
    id: string;
    type: string;
  } | null;
}

export interface ExpeditionRepositoryPort extends BaseRepositoryPort<ExpeditionEntity> {
  findAllWithDetails(organisationId?: string): Promise<ExpeditionWithDetails[]>;
  findByIdWithDetails(id: string): Promise<ExpeditionWithDetails | null>;
}

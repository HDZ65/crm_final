import { FactureEntity } from '../domain/facture.entity';
import { BaseRepositoryPort } from './repository.port';

export interface FactureFilters {
  organisationId?: string;
  clientBaseId?: string;
  statutId?: string;
  dateDebut?: string;
  dateFin?: string;
}

export interface FactureRepositoryPort extends BaseRepositoryPort<FactureEntity> {
  findAllWithFilters(filters: FactureFilters): Promise<FactureEntity[]>;
  findByIdWithRelations(id: string): Promise<FactureEntity | null>;
}

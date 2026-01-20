import { ClientBaseEntity } from '../domain/client-base.entity';
import { BaseRepositoryPort } from './repository.port';

export interface ClientBaseFilters {
  organisationId?: string;
  statutId?: string;
  societeId?: string;
}

export interface ClientBaseWithContrats extends ClientBaseEntity {
  contrats?: {
    id: string;
    reference: string;
    titre: string;
    dateDebut: string;
    dateFin: string | null;
    statut: string;
    montant: number | null;
  }[];
}

export interface ClientBaseRepositoryPort extends BaseRepositoryPort<ClientBaseEntity> {
  findByPhoneAndName(
    telephone: string,
    nom: string,
  ): Promise<ClientBaseEntity | null>;

  findAllWithContrats(
    filters?: ClientBaseFilters,
  ): Promise<ClientBaseWithContrats[]>;

  findByIdWithContrats(
    id: string,
  ): Promise<ClientBaseWithContrats | null>;
}

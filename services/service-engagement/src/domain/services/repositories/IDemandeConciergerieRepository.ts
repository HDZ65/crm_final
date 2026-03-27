import {
  DemandeConciergerie,
  DemandeStatut,
  DemandeCategorie,
  DemandePriorite,
} from '../entities/demande-conciergerie.entity';

export interface IDemandeConciergerieRepository {
  findById(id: string): Promise<DemandeConciergerie | null>;
  findAll(
    filters?: {
      organisationId?: string;
      clientId?: string;
      statut?: DemandeStatut;
      categorie?: DemandeCategorie;
      priorite?: DemandePriorite;
      search?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: DemandeConciergerie[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByClient(
    clientId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: DemandeConciergerie[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  save(entity: DemandeConciergerie): Promise<DemandeConciergerie>;
  delete(id: string): Promise<boolean>;
}

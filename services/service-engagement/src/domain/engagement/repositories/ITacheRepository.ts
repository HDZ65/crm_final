import { TacheEntity, TacheStatut, TacheType, TachePriorite } from '../entities/tache.entity';

export interface ITacheRepository {
  findById(id: string): Promise<TacheEntity | null>;
  findAll(
    filters?: {
      organisationId?: string;
      statut?: TacheStatut;
      type?: TacheType;
      priorite?: TachePriorite;
      search?: string;
      enRetard?: boolean;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: TacheEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByAssigne(
    assigneA: string,
    periode?: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: TacheEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByClient(
    clientId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: TacheEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  save(entity: TacheEntity): Promise<TacheEntity>;
  delete(id: string): Promise<boolean>;
  getStats(organisationId: string): Promise<{
    aFaire: number;
    enCours: number;
    terminee: number;
    annulee: number;
    enRetard: number;
    total: number;
  }>;
}

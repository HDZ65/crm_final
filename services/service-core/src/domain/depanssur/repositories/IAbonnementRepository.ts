import { AbonnementDepanssurEntity } from '../entities/abonnement-depanssur.entity';

export interface IAbonnementRepository {
  findById(id: string): Promise<AbonnementDepanssurEntity | null>;
  findByClientId(organisationId: string, clientId: string): Promise<AbonnementDepanssurEntity | null>;
  findAll(
    organisationId: string,
    filters?: {
      clientId?: string;
      statut?: string;
      planType?: string;
      search?: string;
    },
    pagination?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
    },
  ): Promise<{
    abonnements: AbonnementDepanssurEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>;
  save(entity: AbonnementDepanssurEntity): Promise<AbonnementDepanssurEntity>;
  delete(id: string): Promise<void>;
}

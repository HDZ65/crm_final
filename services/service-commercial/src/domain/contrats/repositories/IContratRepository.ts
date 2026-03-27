import { ContratEntity } from '../entities/contrat.entity';

export interface IContratRepository {
  findById(id: string): Promise<ContratEntity | null>;
  findByIdWithDetails(id: string): Promise<ContratEntity | null>;
  findByReference(organisationId: string, reference: string): Promise<ContratEntity | null>;
  findAll(filters?: {
    organisationId?: string;
    clientId?: string;
    commercialId?: string;
    societeId?: string;
    statut?: string;
    search?: string;
  }, pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    contrats: ContratEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>;
  save(entity: ContratEntity): Promise<ContratEntity>;
  delete(id: string): Promise<boolean>;
  updateStatus(id: string, statut: string): Promise<ContratEntity>;
}

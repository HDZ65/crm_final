import { DossierDeclaratifEntity } from '../entities/dossier-declaratif.entity';

export interface IDossierDeclaratifRepository {
  findById(id: string): Promise<DossierDeclaratifEntity | null>;
  findByReferenceExterne(organisationId: string, referenceExterne: string): Promise<DossierDeclaratifEntity | null>;
  findAll(
    organisationId: string,
    filters?: {
      abonnementId?: string;
      clientId?: string;
      type?: string;
      statut?: string;
      search?: string;
    },
    pagination?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
    },
  ): Promise<{
    dossiers: DossierDeclaratifEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>;
  save(entity: DossierDeclaratifEntity): Promise<DossierDeclaratifEntity>;
  delete(id: string): Promise<void>;
}

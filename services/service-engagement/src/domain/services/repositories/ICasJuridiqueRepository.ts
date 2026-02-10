import {
  CasJuridique,
  CasJuridiqueStatut,
  CasJuridiqueType,
  CasJuridiquePriorite,
} from '../entities/cas-juridique.entity';

export interface ICasJuridiqueRepository {
  findById(id: string): Promise<CasJuridique | null>;
  findAll(
    filters?: {
      organisationId?: string;
      clientId?: string;
      statut?: CasJuridiqueStatut;
      type?: CasJuridiqueType;
      priorite?: CasJuridiquePriorite;
      search?: string;
    },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CasJuridique[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByClient(
    clientId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: CasJuridique[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  save(entity: CasJuridique): Promise<CasJuridique>;
  delete(id: string): Promise<boolean>;
}

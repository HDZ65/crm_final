import { ActiviteEntity } from '../entities/activite.entity';

export interface IActiviteRepository {
  findById(id: string): Promise<ActiviteEntity | null>;
  findByClient(
    clientBaseId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: ActiviteEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByContrat(
    contratId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: ActiviteEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findAll(
    filters?: { search?: string; typeId?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: ActiviteEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  save(entity: ActiviteEntity): Promise<ActiviteEntity>;
  delete(id: string): Promise<boolean>;
}

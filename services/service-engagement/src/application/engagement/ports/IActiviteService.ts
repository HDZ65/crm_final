import {
  CreateActiviteDto,
  UpdateActiviteDto,
  ActiviteResponseDto,
} from '../dtos';

export interface IActiviteService {
  create(dto: CreateActiviteDto): Promise<ActiviteResponseDto>;
  findById(id: string): Promise<ActiviteResponseDto>;
  findByClient(
    clientBaseId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: ActiviteResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findByContrat(
    contratId: string,
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: ActiviteResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findAll(
    filters?: { search?: string; typeId?: string },
    pagination?: { page: number; limit: number },
  ): Promise<{
    data: ActiviteResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  update(id: string, dto: UpdateActiviteDto): Promise<ActiviteResponseDto>;
  delete(id: string): Promise<boolean>;
}

export const ACTIVITE_SERVICE = Symbol('IActiviteService');

import {
  CreateCompteDto,
  UpdateCompteDto,
  CompteResponseDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface ICompteService {
  create(dto: CreateCompteDto): Promise<CompteResponseDto>;
  update(dto: UpdateCompteDto): Promise<CompteResponseDto>;
  findById(id: string): Promise<CompteResponseDto>;
  findAll(pagination?: PaginationDto): Promise<{
    comptes: CompteResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const COMPTE_SERVICE = Symbol('ICompteService');

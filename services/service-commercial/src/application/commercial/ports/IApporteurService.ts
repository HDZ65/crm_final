import {
  CreateApporteurDto,
  UpdateApporteurDto,
  ApporteurResponseDto,
  ApporteurFiltersDto,
} from '../dtos';
import { PaginationDto, PaginationResponseDto } from '../../shared/dtos';

export interface IApporteurService {
  create(dto: CreateApporteurDto): Promise<ApporteurResponseDto>;
  update(dto: UpdateApporteurDto): Promise<ApporteurResponseDto>;
  findById(id: string): Promise<ApporteurResponseDto>;
  findAll(
    filters?: ApporteurFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    apporteurs: ApporteurResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const APPORTEUR_SERVICE = Symbol('IApporteurService');

import {
  CreateCommissionDto,
  UpdateCommissionDto,
  CommissionResponseDto,
  CommissionFiltersDto,
} from '../dtos';
import { PaginationDto, PaginationResponseDto } from '../../shared/dtos';

export interface ICommissionService {
  create(dto: CreateCommissionDto): Promise<CommissionResponseDto>;
  update(dto: UpdateCommissionDto): Promise<CommissionResponseDto>;
  findById(id: string): Promise<CommissionResponseDto>;
  findAll(
    filters?: CommissionFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    commissions: CommissionResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const COMMISSION_SERVICE = Symbol('ICommissionService');

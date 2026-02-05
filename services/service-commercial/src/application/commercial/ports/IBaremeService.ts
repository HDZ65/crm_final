import {
  CreateBaremeDto,
  UpdateBaremeDto,
  BaremeResponseDto,
  BaremeFiltersDto,
} from '../dtos';
import { PaginationDto, PaginationResponseDto } from '../../shared/dtos';

export interface IBaremeService {
  create(dto: CreateBaremeDto): Promise<BaremeResponseDto>;
  update(dto: UpdateBaremeDto): Promise<BaremeResponseDto>;
  findById(id: string): Promise<BaremeResponseDto>;
  findByCode(code: string): Promise<BaremeResponseDto>;
  findAll(
    filters?: BaremeFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    baremes: BaremeResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const BAREME_SERVICE = Symbol('IBaremeService');

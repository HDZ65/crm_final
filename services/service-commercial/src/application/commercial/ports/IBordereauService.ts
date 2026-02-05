import {
  CreateBordereauDto,
  UpdateBordereauDto,
  BordereauResponseDto,
  BordereauFiltersDto,
} from '../dtos';
import { PaginationDto, PaginationResponseDto } from '../../shared/dtos';

export interface IBordereauService {
  create(dto: CreateBordereauDto): Promise<BordereauResponseDto>;
  update(dto: UpdateBordereauDto): Promise<BordereauResponseDto>;
  findById(id: string): Promise<BordereauResponseDto>;
  findAll(
    filters?: BordereauFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    bordereaux: BordereauResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  validate(id: string, validateurId: string): Promise<BordereauResponseDto>;
  delete(id: string): Promise<boolean>;
}

export const BORDEREAU_SERVICE = Symbol('IBordereauService');

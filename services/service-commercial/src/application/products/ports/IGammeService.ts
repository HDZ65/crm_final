import {
  CreateGammeDto,
  UpdateGammeDto,
  GammeResponseDto,
  GammeFiltersDto,
} from '../dtos';
import { PaginationDto, PaginationResponseDto } from '../../shared/dtos';

export interface IGammeService {
  create(dto: CreateGammeDto): Promise<GammeResponseDto>;
  update(dto: UpdateGammeDto): Promise<GammeResponseDto>;
  findById(id: string): Promise<GammeResponseDto>;
  findByCode(organisationId: string, code: string): Promise<GammeResponseDto>;
  findAll(
    filters?: GammeFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    gammes: GammeResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const GAMME_SERVICE = Symbol('IGammeService');

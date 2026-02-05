import {
  CreateSocieteDto,
  UpdateSocieteDto,
  SocieteResponseDto,
  SocieteFiltersDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface ISocieteService {
  create(dto: CreateSocieteDto): Promise<SocieteResponseDto>;
  update(dto: UpdateSocieteDto): Promise<SocieteResponseDto>;
  findById(id: string): Promise<SocieteResponseDto>;
  findByOrganisationId(organisationId: string): Promise<SocieteResponseDto[]>;
  findAll(
    filters?: SocieteFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    societes: SocieteResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const SOCIETE_SERVICE = Symbol('ISocieteService');

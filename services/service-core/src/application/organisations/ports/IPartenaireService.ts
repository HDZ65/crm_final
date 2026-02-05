import {
  CreatePartenaireDto,
  UpdatePartenaireDto,
  PartenaireResponseDto,
  PartenaireFiltersDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IPartenaireService {
  create(dto: CreatePartenaireDto): Promise<PartenaireResponseDto>;
  update(dto: UpdatePartenaireDto): Promise<PartenaireResponseDto>;
  findById(id: string): Promise<PartenaireResponseDto>;
  findByOrganisationId(organisationId: string): Promise<PartenaireResponseDto[]>;
  findAll(
    filters?: PartenaireFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    partenaires: PartenaireResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const PARTENAIRE_SERVICE = Symbol('IPartenaireService');

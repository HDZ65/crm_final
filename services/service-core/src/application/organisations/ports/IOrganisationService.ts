import {
  CreateOrganisationDto,
  UpdateOrganisationDto,
  OrganisationResponseDto,
  OrganisationFiltersDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IOrganisationService {
  create(dto: CreateOrganisationDto): Promise<OrganisationResponseDto>;
  update(dto: UpdateOrganisationDto): Promise<OrganisationResponseDto>;
  findById(id: string): Promise<OrganisationResponseDto>;
  findAll(
    filters?: OrganisationFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    organisations: OrganisationResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const ORGANISATION_SERVICE = Symbol('IOrganisationService');

import {
  CreateClientBaseDto,
  UpdateClientBaseDto,
  ClientBaseResponseDto,
  ClientBaseFiltersDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IClientBaseService {
  create(dto: CreateClientBaseDto): Promise<ClientBaseResponseDto>;
  update(dto: UpdateClientBaseDto): Promise<ClientBaseResponseDto>;
  findById(id: string): Promise<ClientBaseResponseDto>;
  findByPhoneAndName(telephone: string, nom: string): Promise<ClientBaseResponseDto | null>;
  findAll(
    filters: ClientBaseFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    clients: ClientBaseResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  search(
    organisationId: string,
    telephone: string,
    nom: string,
  ): Promise<{ found: boolean; client: ClientBaseResponseDto | null }>;
  delete(id: string): Promise<boolean>;
}

export const CLIENT_BASE_SERVICE = Symbol('IClientBaseService');

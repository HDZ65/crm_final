import {
  CreateClientPartenaireDto,
  UpdateClientPartenaireDto,
  ClientPartenaireResponseDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IClientPartenaireService {
  create(dto: CreateClientPartenaireDto): Promise<ClientPartenaireResponseDto>;
  update(dto: UpdateClientPartenaireDto): Promise<ClientPartenaireResponseDto>;
  findById(id: string): Promise<ClientPartenaireResponseDto>;
  findByClientBaseId(clientBaseId: string): Promise<ClientPartenaireResponseDto[]>;
  findByPartenaireId(partenaireId: string): Promise<ClientPartenaireResponseDto[]>;
  findAll(pagination?: PaginationDto): Promise<{
    clients: ClientPartenaireResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const CLIENT_PARTENAIRE_SERVICE = Symbol('IClientPartenaireService');

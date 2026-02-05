import {
  CreateStatutClientDto,
  UpdateStatutClientDto,
  StatutClientResponseDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IStatutClientService {
  create(dto: CreateStatutClientDto): Promise<StatutClientResponseDto>;
  update(dto: UpdateStatutClientDto): Promise<StatutClientResponseDto>;
  findById(id: string): Promise<StatutClientResponseDto>;
  findByCode(code: string): Promise<StatutClientResponseDto>;
  findAll(pagination?: PaginationDto): Promise<{
    statuts: StatutClientResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const STATUT_CLIENT_SERVICE = Symbol('IStatutClientService');

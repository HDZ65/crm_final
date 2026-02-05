import {
  CreateContratDto,
  UpdateContratDto,
  ContratResponseDto,
  ContratFiltersDto,
} from '../dtos';
import { PaginationDto, PaginationResponseDto } from '../../shared/dtos';

export interface IContratService {
  create(dto: CreateContratDto): Promise<ContratResponseDto>;
  update(dto: UpdateContratDto): Promise<ContratResponseDto>;
  findById(id: string): Promise<ContratResponseDto>;
  findByReference(organisationId: string, reference: string): Promise<ContratResponseDto>;
  findAll(
    filters?: ContratFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    contrats: ContratResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  updateStatus(id: string, statut: string): Promise<ContratResponseDto>;
  delete(id: string): Promise<boolean>;
}

export const CONTRAT_SERVICE = Symbol('IContratService');

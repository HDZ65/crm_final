import {
  CreateFactureDto,
  UpdateFactureDto,
  FactureResponseDto,
} from '../dtos';
import { PaginationDto, PaginationResponseDto } from '../../shared/dtos';

export interface IFactureService {
  create(dto: CreateFactureDto): Promise<FactureResponseDto>;
  update(dto: UpdateFactureDto): Promise<FactureResponseDto>;
  findById(id: string): Promise<FactureResponseDto>;
  findByOrganisation(
    organisationId: string,
    pagination?: PaginationDto,
  ): Promise<{
    factures: FactureResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
  valider(id: string): Promise<FactureResponseDto>;
}

export const FACTURE_SERVICE = Symbol('IFactureService');

import {
  CreatePieceJointeDto,
  UpdatePieceJointeDto,
  PieceJointeResponseDto,
  PieceJointeFiltersDto,
  PaginationDto,
  PaginationResponseDto,
} from '../dtos';

export interface IPieceJointeService {
  create(dto: CreatePieceJointeDto): Promise<PieceJointeResponseDto>;
  update(dto: UpdatePieceJointeDto): Promise<PieceJointeResponseDto>;
  findById(id: string): Promise<PieceJointeResponseDto>;
  findByEntite(
    entiteType: string,
    entiteId: string,
    pagination?: PaginationDto,
  ): Promise<{
    data: PieceJointeResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  findAll(
    filters?: PieceJointeFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    data: PieceJointeResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const PIECE_JOINTE_SERVICE = Symbol('IPieceJointeService');

import {
  CreateProduitDto,
  UpdateProduitDto,
  ProduitResponseDto,
  ProduitFiltersDto,
} from '../dtos';
import { PaginationDto, PaginationResponseDto } from '../../shared/dtos';

export interface IProduitService {
  create(dto: CreateProduitDto): Promise<ProduitResponseDto>;
  update(dto: UpdateProduitDto): Promise<ProduitResponseDto>;
  findById(id: string): Promise<ProduitResponseDto>;
  findBySku(organisationId: string, sku: string): Promise<ProduitResponseDto>;
  findAll(
    filters?: ProduitFiltersDto,
    pagination?: PaginationDto,
  ): Promise<{
    produits: ProduitResponseDto[];
    pagination: PaginationResponseDto;
  }>;
  delete(id: string): Promise<boolean>;
}

export const PRODUIT_SERVICE = Symbol('IProduitService');

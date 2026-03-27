/**
 * Port for product repository operations
 */
export interface ProductQueryResult {
  id: string;
  code: string;
  nom: string;
  description: string;
  gammeId: string;
  actif: boolean;
  prixBase: number;
}

export interface ProductFilters {
  gammeId?: string;
  actif?: boolean;
  search?: string;
}

export interface IProductRepositoryPort {
  findById(id: string): Promise<ProductQueryResult | null>;
  findByCode(code: string): Promise<ProductQueryResult | null>;
  findMany(filters: ProductFilters): Promise<ProductQueryResult[]>;
  findByGamme(gammeId: string): Promise<ProductQueryResult[]>;
}

export const PRODUCT_REPOSITORY_PORT = Symbol('IProductRepositoryPort');

import { ProduitEntity } from '../entities/produit.entity';

export interface IProduitRepository {
  findById(id: string): Promise<ProduitEntity | null>;
  findBySku(keycloakGroupId: string, sku: string): Promise<ProduitEntity | null>;
  findAll(filters?: {
    keycloakGroupId?: string;
    gammeId?: string;
    categorie?: string;
    actif?: boolean;
  }): Promise<ProduitEntity[]>;
  save(entity: ProduitEntity): Promise<ProduitEntity>;
  delete(id: string): Promise<void>;
}

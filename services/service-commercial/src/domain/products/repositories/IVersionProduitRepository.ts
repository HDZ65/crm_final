import { VersionProduitEntity } from '../entities/version-produit.entity';

export interface IVersionProduitRepository {
  findById(id: string): Promise<VersionProduitEntity | null>;
  findByProduit(produitId: string): Promise<VersionProduitEntity[]>;
  findLatest(produitId: string): Promise<VersionProduitEntity | null>;
  save(entity: VersionProduitEntity): Promise<VersionProduitEntity>;
  delete(id: string): Promise<void>;
}

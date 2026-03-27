import { PrixProduitEntity } from '../entities/prix-produit.entity';

export interface IPrixProduitRepository {
  findById(id: string): Promise<PrixProduitEntity | null>;
  findByGrille(grilleTarifaireId: string): Promise<PrixProduitEntity[]>;
  findByProduit(produitId: string): Promise<PrixProduitEntity[]>;
  save(entity: PrixProduitEntity): Promise<PrixProduitEntity>;
  delete(id: string): Promise<void>;
}

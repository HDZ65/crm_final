import { FormuleProduitEntity } from '../entities/formule-produit.entity';

export interface IFormuleProduitRepository {
  findById(id: string): Promise<FormuleProduitEntity | null>;
  findByProduit(produitId: string): Promise<FormuleProduitEntity[]>;
  findByCode(produitId: string, code: string): Promise<FormuleProduitEntity | null>;
  save(entity: FormuleProduitEntity): Promise<FormuleProduitEntity>;
  update(id: string, partial: Partial<FormuleProduitEntity>): Promise<FormuleProduitEntity>;
  delete(id: string): Promise<void>;
}

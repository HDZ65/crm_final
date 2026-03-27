import { LigneFactureEntity } from '../entities/ligne-facture.entity';

export interface ILigneFactureRepository {
  findById(id: string): Promise<LigneFactureEntity | null>;
  findByFacture(factureId: string): Promise<LigneFactureEntity[]>;
  save(entity: LigneFactureEntity): Promise<LigneFactureEntity>;
  delete(id: string): Promise<void>;
}

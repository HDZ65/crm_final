import { LigneContratEntity } from '../entities/ligne-contrat.entity';

export interface ILigneContratRepository {
  findById(id: string): Promise<LigneContratEntity | null>;
  findByContrat(contratId: string): Promise<LigneContratEntity[]>;
  save(entity: LigneContratEntity): Promise<LigneContratEntity>;
  delete(id: string): Promise<void>;
}

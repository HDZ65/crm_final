import { StatutFactureEntity } from '../entities/statut-facture.entity';

export interface IStatutFactureRepository {
  findById(id: string): Promise<StatutFactureEntity | null>;
  findByCode(code: string): Promise<StatutFactureEntity | null>;
  findAll(): Promise<StatutFactureEntity[]>;
  save(entity: StatutFactureEntity): Promise<StatutFactureEntity>;
}

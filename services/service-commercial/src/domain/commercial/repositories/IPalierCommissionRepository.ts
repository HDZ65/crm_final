import { PalierCommissionEntity } from '../entities/palier-commission.entity';

export interface IPalierCommissionRepository {
  findById(id: string): Promise<PalierCommissionEntity | null>;
  findByBareme(baremeId: string): Promise<PalierCommissionEntity[]>;
  save(entity: PalierCommissionEntity): Promise<PalierCommissionEntity>;
  delete(id: string): Promise<void>;
}

import { ModeleDistributionEntity } from '../entities/modele-distribution.entity';

export interface IModeleDistributionRepository {
  findById(id: string): Promise<ModeleDistributionEntity | null>;
  findByCode(code: string): Promise<ModeleDistributionEntity | null>;
  findAll(): Promise<ModeleDistributionEntity[]>;
  save(entity: ModeleDistributionEntity): Promise<ModeleDistributionEntity>;
  delete(id: string): Promise<void>;
}

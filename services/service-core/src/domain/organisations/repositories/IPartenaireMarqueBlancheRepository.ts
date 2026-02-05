import { PartenaireMarqueBlancheEntity } from '../entities/partenaire-marque-blanche.entity';

export interface IPartenaireMarqueBlancheRepository {
  findById(id: string): Promise<PartenaireMarqueBlancheEntity | null>;
  findAll(): Promise<PartenaireMarqueBlancheEntity[]>;
  save(entity: PartenaireMarqueBlancheEntity): Promise<PartenaireMarqueBlancheEntity>;
  delete(id: string): Promise<void>;
  findBySiren(siren: string): Promise<PartenaireMarqueBlancheEntity | null>;
}

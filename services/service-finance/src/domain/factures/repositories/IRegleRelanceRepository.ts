import { RegleRelanceEntity } from '../entities/regle-relance.entity';

export interface IRegleRelanceRepository {
  findById(id: string): Promise<RegleRelanceEntity | null>;
  findByOrganisation(organisationId: string): Promise<RegleRelanceEntity[]>;
  findActiveByOrganisation(organisationId: string): Promise<RegleRelanceEntity[]>;
  save(entity: RegleRelanceEntity): Promise<RegleRelanceEntity>;
  delete(id: string): Promise<void>;
}

import { EmissionFactureEntity } from '../entities/emission-facture.entity';

export interface IEmissionFactureRepository {
  findById(id: string): Promise<EmissionFactureEntity | null>;
  findAll(): Promise<EmissionFactureEntity[]>;
  save(entity: EmissionFactureEntity): Promise<EmissionFactureEntity>;
  delete(id: string): Promise<void>;
  findByCode(code: string): Promise<EmissionFactureEntity | null>;
}

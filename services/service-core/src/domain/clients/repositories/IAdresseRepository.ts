import { AdresseEntity } from '../entities/adresse.entity';

export interface IAdresseRepository {
  findById(id: string): Promise<AdresseEntity | null>;
  findAll(): Promise<AdresseEntity[]>;
  save(entity: AdresseEntity): Promise<AdresseEntity>;
  delete(id: string): Promise<void>;
  findByClientBaseId(clientBaseId: string): Promise<AdresseEntity[]>;
}

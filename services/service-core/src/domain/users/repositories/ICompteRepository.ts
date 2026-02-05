import { CompteEntity } from '../entities/compte.entity';

export interface ICompteRepository {
  findById(id: string): Promise<CompteEntity | null>;
  findAll(): Promise<CompteEntity[]>;
  save(entity: CompteEntity): Promise<CompteEntity>;
  delete(id: string): Promise<void>;
}

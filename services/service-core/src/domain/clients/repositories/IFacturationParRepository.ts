import { FacturationParEntity } from '../entities/facturation-par.entity';

export interface IFacturationParRepository {
  findById(id: string): Promise<FacturationParEntity | null>;
  findAll(): Promise<FacturationParEntity[]>;
  save(entity: FacturationParEntity): Promise<FacturationParEntity>;
  delete(id: string): Promise<void>;
  findByCode(code: string): Promise<FacturationParEntity | null>;
}

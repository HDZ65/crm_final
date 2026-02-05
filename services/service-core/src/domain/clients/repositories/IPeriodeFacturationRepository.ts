import { PeriodeFacturationEntity } from '../entities/periode-facturation.entity';

export interface IPeriodeFacturationRepository {
  findById(id: string): Promise<PeriodeFacturationEntity | null>;
  findAll(): Promise<PeriodeFacturationEntity[]>;
  save(entity: PeriodeFacturationEntity): Promise<PeriodeFacturationEntity>;
  delete(id: string): Promise<void>;
  findByCode(code: string): Promise<PeriodeFacturationEntity | null>;
}

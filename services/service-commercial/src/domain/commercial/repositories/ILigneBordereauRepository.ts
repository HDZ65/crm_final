import { LigneBordereauEntity } from '../entities/ligne-bordereau.entity';

export interface ILigneBordereauRepository {
  findById(id: string): Promise<LigneBordereauEntity | null>;
  findByBordereau(bordereauId: string): Promise<LigneBordereauEntity[]>;
  save(entity: LigneBordereauEntity): Promise<LigneBordereauEntity>;
  delete(id: string): Promise<void>;
}

import { PieceJointeEntity } from '../entities/piece-jointe.entity';

export interface IPieceJointeRepository {
  findById(id: string): Promise<PieceJointeEntity | null>;
  findAll(): Promise<PieceJointeEntity[]>;
  save(entity: PieceJointeEntity): Promise<PieceJointeEntity>;
  delete(id: string): Promise<void>;
  findByEntite(entiteType: string, entiteId: string): Promise<PieceJointeEntity[]>;
}

import { ProduitEntity } from '../domain/produit.entity';
import { BaseRepositoryPort } from './repository.port';

export interface ProduitRepositoryPort
  extends BaseRepositoryPort<ProduitEntity> {
  findBySocieteId(societeId: string): Promise<ProduitEntity[]>;
  findByGammeId(gammeId: string): Promise<ProduitEntity[]>;
}

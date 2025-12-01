import { ProduitEntity } from '../domain/produit.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ProduitRepositoryPort
  extends BaseRepositoryPort<ProduitEntity> {
  // Add custom repository methods here
}

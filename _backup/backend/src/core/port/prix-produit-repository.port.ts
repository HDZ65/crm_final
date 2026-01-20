import { PrixProduitEntity } from '../domain/prix-produit.entity';
import { BaseRepositoryPort } from './repository.port';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PrixProduitRepositoryPort extends BaseRepositoryPort<PrixProduitEntity> {
  // Add custom repository methods here
}

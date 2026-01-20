/**
 * Product Providers - Produit
 * Regroupement des providers liés aux produits
 */

import { CreateProduitUseCase } from '../../../../applications/usecase/produit/create-produit.usecase';
import { GetProduitUseCase } from '../../../../applications/usecase/produit/get-produit.usecase';
import { UpdateProduitUseCase } from '../../../../applications/usecase/produit/update-produit.usecase';
import { DeleteProduitUseCase } from '../../../../applications/usecase/produit/delete-produit.usecase';
import { TypeOrmProduitRepository } from '../../../repositories/typeorm-produit.repository';

export const PRODUCT_PROVIDERS = [
  // Produit Use Cases
  CreateProduitUseCase,
  GetProduitUseCase,
  UpdateProduitUseCase,
  DeleteProduitUseCase,

  // Produit Repository
  {
    provide: 'ProduitRepositoryPort',
    useClass: TypeOrmProduitRepository,
  },
];

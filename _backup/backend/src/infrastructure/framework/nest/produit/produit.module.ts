import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { ProduitController } from './controllers/produit.controller';
import { GammeController } from './controllers/gamme.controller';

// Entities
import { ProduitEntity } from '../../../db/entities/produit.entity';
import { GammeEntity } from '../../../db/entities/gamme.entity';

// Repositories
import { TypeOrmProduitRepository } from '../../../repositories/typeorm-produit.repository';
import { TypeOrmGammeRepository } from '../../../repositories/typeorm-gamme.repository';

// Use Cases - Produit
import { CreateProduitUseCase } from '../../../../applications/usecase/produit/create-produit.usecase';
import { GetProduitUseCase } from '../../../../applications/usecase/produit/get-produit.usecase';
import { UpdateProduitUseCase } from '../../../../applications/usecase/produit/update-produit.usecase';
import { DeleteProduitUseCase } from '../../../../applications/usecase/produit/delete-produit.usecase';

// Use Cases - Gamme
import { CreateGammeUseCase } from '../../../../applications/usecase/gamme/create-gamme.usecase';
import { GetGammeUseCase } from '../../../../applications/usecase/gamme/get-gamme.usecase';
import { UpdateGammeUseCase } from '../../../../applications/usecase/gamme/update-gamme.usecase';
import { DeleteGammeUseCase } from '../../../../applications/usecase/gamme/delete-gamme.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProduitEntity,
      GammeEntity,
    ]),
  ],
  controllers: [
    ProduitController,
    GammeController,
  ],
  providers: [
    // Produit
    {
      provide: 'ProduitRepositoryPort',
      useClass: TypeOrmProduitRepository,
    },
    CreateProduitUseCase,
    GetProduitUseCase,
    UpdateProduitUseCase,
    DeleteProduitUseCase,

    // Gamme
    {
      provide: 'GammeRepositoryPort',
      useClass: TypeOrmGammeRepository,
    },
    CreateGammeUseCase,
    GetGammeUseCase,
    UpdateGammeUseCase,
    DeleteGammeUseCase,
  ],
  exports: [
    'ProduitRepositoryPort',
    'GammeRepositoryPort',
  ],
})
export class ProduitModule {}

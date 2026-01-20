import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { AdresseController } from './controllers/adresse.controller';
import { PieceJointeController } from './controllers/piece-jointe.controller';

// Entities
import { AdresseEntity } from '../../../db/entities/adresse.entity';
import { PieceJointeEntity } from '../../../db/entities/piece-jointe.entity';

// Repositories
import { TypeOrmAdresseRepository } from '../../../repositories/typeorm-adresse.repository';
import { TypeOrmPieceJointeRepository } from '../../../repositories/typeorm-piece-jointe.repository';

// Use Cases - Adresse
import { CreateAdresseUseCase } from '../../../../applications/usecase/adresse/create-adresse.usecase';
import { GetAdresseUseCase } from '../../../../applications/usecase/adresse/get-adresse.usecase';
import { UpdateAdresseUseCase } from '../../../../applications/usecase/adresse/update-adresse.usecase';
import { DeleteAdresseUseCase } from '../../../../applications/usecase/adresse/delete-adresse.usecase';

// Use Cases - PieceJointe
import { CreatePieceJointeUseCase } from '../../../../applications/usecase/piece-jointe/create-piece-jointe.usecase';
import { GetPieceJointeUseCase } from '../../../../applications/usecase/piece-jointe/get-piece-jointe.usecase';
import { UpdatePieceJointeUseCase } from '../../../../applications/usecase/piece-jointe/update-piece-jointe.usecase';
import { DeletePieceJointeUseCase } from '../../../../applications/usecase/piece-jointe/delete-piece-jointe.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdresseEntity,
      PieceJointeEntity,
    ]),
  ],
  controllers: [
    AdresseController,
    PieceJointeController,
  ],
  providers: [
    // Adresse
    {
      provide: 'AdresseRepositoryPort',
      useClass: TypeOrmAdresseRepository,
    },
    CreateAdresseUseCase,
    GetAdresseUseCase,
    UpdateAdresseUseCase,
    DeleteAdresseUseCase,

    // PieceJointe
    {
      provide: 'PieceJointeRepositoryPort',
      useClass: TypeOrmPieceJointeRepository,
    },
    CreatePieceJointeUseCase,
    GetPieceJointeUseCase,
    UpdatePieceJointeUseCase,
    DeletePieceJointeUseCase,
  ],
  exports: [
    'AdresseRepositoryPort',
    'PieceJointeRepositoryPort',
  ],
})
export class CommonModule {}

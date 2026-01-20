import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { ActiviteController } from './controllers/activite.controller';
import { TypeActiviteController } from './controllers/type-activite.controller';
import { TacheController } from './controllers/tache.controller';

// Entities
import { ActiviteEntity } from '../../../db/entities/activite.entity';
import { TypeActiviteEntity } from '../../../db/entities/type-activite.entity';
import { TacheEntity } from '../../../db/entities/tache.entity';

// Repositories
import { TypeOrmActiviteRepository } from '../../../repositories/typeorm-activite.repository';
import { TypeOrmTypeActiviteRepository } from '../../../repositories/typeorm-type-activite.repository';
import { TypeOrmTacheRepository } from '../../../repositories/typeorm-tache.repository';

// Use Cases - Activite
import { CreateActiviteUseCase } from '../../../../applications/usecase/activite/create-activite.usecase';
import { GetActiviteUseCase } from '../../../../applications/usecase/activite/get-activite.usecase';
import { UpdateActiviteUseCase } from '../../../../applications/usecase/activite/update-activite.usecase';
import { DeleteActiviteUseCase } from '../../../../applications/usecase/activite/delete-activite.usecase';

// Use Cases - TypeActivite
import { CreateTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/create-type-activite.usecase';
import { GetTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/get-type-activite.usecase';
import { UpdateTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/update-type-activite.usecase';
import { DeleteTypeActiviteUseCase } from '../../../../applications/usecase/type-activite/delete-type-activite.usecase';

// Use Cases - Tache
import { CreateTacheUseCase } from '../../../../applications/usecase/tache/create-tache.usecase';
import { GetTacheUseCase } from '../../../../applications/usecase/tache/get-tache.usecase';
import { UpdateTacheUseCase } from '../../../../applications/usecase/tache/update-tache.usecase';
import { DeleteTacheUseCase } from '../../../../applications/usecase/tache/delete-tache.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActiviteEntity,
      TypeActiviteEntity,
      TacheEntity,
    ]),
  ],
  controllers: [
    ActiviteController,
    TypeActiviteController,
    TacheController,
  ],
  providers: [
    // Activite
    {
      provide: 'ActiviteRepositoryPort',
      useClass: TypeOrmActiviteRepository,
    },
    CreateActiviteUseCase,
    GetActiviteUseCase,
    UpdateActiviteUseCase,
    DeleteActiviteUseCase,

    // TypeActivite
    {
      provide: 'TypeActiviteRepositoryPort',
      useClass: TypeOrmTypeActiviteRepository,
    },
    CreateTypeActiviteUseCase,
    GetTypeActiviteUseCase,
    UpdateTypeActiviteUseCase,
    DeleteTypeActiviteUseCase,

    // Tache
    {
      provide: 'TacheRepositoryPort',
      useClass: TypeOrmTacheRepository,
    },
    CreateTacheUseCase,
    GetTacheUseCase,
    UpdateTacheUseCase,
    DeleteTacheUseCase,
  ],
  exports: [
    'ActiviteRepositoryPort',
    'TypeActiviteRepositoryPort',
    'TacheRepositoryPort',
  ],
})
export class ActiviteModule {}

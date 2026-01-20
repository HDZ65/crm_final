import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import {
  ClientBaseController,
  ClientEntrepriseController,
  ClientPartenaireController,
  StatutClientController,
} from './controllers';

// Entities
import { ClientBaseEntity } from '../../../db/entities/client-base.entity';
import { ClientEntrepriseEntity } from '../../../db/entities/client-entreprise.entity';
import { ClientPartenaireEntity } from '../../../db/entities/client-partenaire.entity';
import { StatutClientEntity } from '../../../db/entities/statut-client.entity';

// Repositories
import { TypeOrmClientBaseRepository } from '../../../repositories/typeorm-client-base.repository';
import { TypeOrmClientEntrepriseRepository } from '../../../repositories/typeorm-client-entreprise.repository';
import { TypeOrmClientPartenaireRepository } from '../../../repositories/typeorm-client-partenaire.repository';
import { TypeOrmStatutClientRepository } from '../../../repositories/typeorm-statut-client.repository';

// Use Cases - ClientBase
import { CreateClientBaseUseCase } from '../../../../applications/usecase/client-base/create-client-base.usecase';
import { GetClientBaseUseCase } from '../../../../applications/usecase/client-base/get-client-base.usecase';
import { UpdateClientBaseUseCase } from '../../../../applications/usecase/client-base/update-client-base.usecase';
import { DeleteClientBaseUseCase } from '../../../../applications/usecase/client-base/delete-client-base.usecase';

// Use Cases - ClientEntreprise
import { CreateClientEntrepriseUseCase } from '../../../../applications/usecase/client-entreprise/create-client-entreprise.usecase';
import { GetClientEntrepriseUseCase } from '../../../../applications/usecase/client-entreprise/get-client-entreprise.usecase';
import { UpdateClientEntrepriseUseCase } from '../../../../applications/usecase/client-entreprise/update-client-entreprise.usecase';
import { DeleteClientEntrepriseUseCase } from '../../../../applications/usecase/client-entreprise/delete-client-entreprise.usecase';

// Use Cases - ClientPartenaire
import { CreateClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/create-client-partenaire.usecase';
import { GetClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/get-client-partenaire.usecase';
import { UpdateClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/update-client-partenaire.usecase';
import { DeleteClientPartenaireUseCase } from '../../../../applications/usecase/client-partenaire/delete-client-partenaire.usecase';

// Use Cases - StatutClient
import { CreateStatutClientUseCase } from '../../../../applications/usecase/statut-client/create-statut-client.usecase';
import { GetStatutClientUseCase } from '../../../../applications/usecase/statut-client/get-statut-client.usecase';
import { UpdateStatutClientUseCase } from '../../../../applications/usecase/statut-client/update-statut-client.usecase';
import { DeleteStatutClientUseCase } from '../../../../applications/usecase/statut-client/delete-statut-client.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientBaseEntity,
      ClientEntrepriseEntity,
      ClientPartenaireEntity,
      StatutClientEntity,
    ]),
  ],
  controllers: [
    ClientBaseController,
    ClientEntrepriseController,
    ClientPartenaireController,
    StatutClientController,
  ],
  providers: [
    // ClientBase
    {
      provide: 'ClientBaseRepositoryPort',
      useClass: TypeOrmClientBaseRepository,
    },
    CreateClientBaseUseCase,
    GetClientBaseUseCase,
    UpdateClientBaseUseCase,
    DeleteClientBaseUseCase,

    // ClientEntreprise
    {
      provide: 'ClientEntrepriseRepositoryPort',
      useClass: TypeOrmClientEntrepriseRepository,
    },
    CreateClientEntrepriseUseCase,
    GetClientEntrepriseUseCase,
    UpdateClientEntrepriseUseCase,
    DeleteClientEntrepriseUseCase,

    // ClientPartenaire
    {
      provide: 'ClientPartenaireRepositoryPort',
      useClass: TypeOrmClientPartenaireRepository,
    },
    CreateClientPartenaireUseCase,
    GetClientPartenaireUseCase,
    UpdateClientPartenaireUseCase,
    DeleteClientPartenaireUseCase,

    // StatutClient
    {
      provide: 'StatutClientRepositoryPort',
      useClass: TypeOrmStatutClientRepository,
    },
    CreateStatutClientUseCase,
    GetStatutClientUseCase,
    UpdateStatutClientUseCase,
    DeleteStatutClientUseCase,
  ],
  exports: [
    'ClientBaseRepositoryPort',
    'ClientEntrepriseRepositoryPort',
    'ClientPartenaireRepositoryPort',
    'StatutClientRepositoryPort',
  ],
})
export class ClientModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { OrganisationController } from './controllers/organisation.controller';
import { CompteController } from './controllers/compte.controller';
import { MembreCompteController } from './controllers/membre-compte.controller';
import { InvitationCompteController } from './controllers/invitation-compte.controller';

// Entities
import { OrganisationEntity } from '../../../db/entities/organisation.entity';
import { CompteEntity } from '../../../db/entities/compte.entity';
import { MembreOrganisationEntity } from '../../../db/entities/membre-compte.entity';
import { InvitationCompteEntity } from '../../../db/entities/invitation-compte.entity';
import { RoleEntity } from '../../../db/entities/role.entity';
import { NotificationEntity } from '../../../db/entities/notification.entity';
import { UtilisateurEntity } from '../../../db/entities/utilisateur.entity';

// Repositories
import { TypeOrmOrganisationRepository } from '../../../repositories/typeorm-organisation.repository';
import { TypeOrmCompteRepository } from '../../../repositories/typeorm-compte.repository';
import { TypeOrmMembreCompteRepository } from '../../../repositories/typeorm-membre-compte.repository';
import { TypeOrmInvitationCompteRepository } from '../../../repositories/typeorm-invitation-compte.repository';

// Modules for dependencies
import { KeycloakModule } from '../keycloak.module';
import { SecurityModule } from '../security.module';
import { NotificationModule } from '../notification/notification.module';

// Use Cases - Organisation
import { CreateOrganisationUseCase } from '../../../../applications/usecase/organisation/create-organisation.usecase';
import { GetOrganisationUseCase } from '../../../../applications/usecase/organisation/get-organisation.usecase';
import { UpdateOrganisationUseCase } from '../../../../applications/usecase/organisation/update-organisation.usecase';
import { DeleteOrganisationUseCase } from '../../../../applications/usecase/organisation/delete-organisation.usecase';

// Use Cases - Compte
import { CreateCompteUseCase } from '../../../../applications/usecase/compte/create-compte.usecase';
import { GetCompteUseCase } from '../../../../applications/usecase/compte/get-compte.usecase';
import { UpdateCompteUseCase } from '../../../../applications/usecase/compte/update-compte.usecase';
import { DeleteCompteUseCase } from '../../../../applications/usecase/compte/delete-compte.usecase';

// Use Cases - MembreCompte
import { CreateMembreCompteUseCase } from '../../../../applications/usecase/membre-compte/create-membre-compte.usecase';
import { GetMembreCompteUseCase } from '../../../../applications/usecase/membre-compte/get-membre-compte.usecase';
import { UpdateMembreCompteUseCase } from '../../../../applications/usecase/membre-compte/update-membre-compte.usecase';
import { DeleteMembreCompteUseCase } from '../../../../applications/usecase/membre-compte/delete-membre-compte.usecase';

// Use Cases - InvitationCompte
import { CreateInvitationCompteUseCase } from '../../../../applications/usecase/invitation-compte/create-invitation-compte.usecase';
import { GetInvitationCompteUseCase } from '../../../../applications/usecase/invitation-compte/get-invitation-compte.usecase';
import { UpdateInvitationCompteUseCase } from '../../../../applications/usecase/invitation-compte/update-invitation-compte.usecase';
import { DeleteInvitationCompteUseCase } from '../../../../applications/usecase/invitation-compte/delete-invitation-compte.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrganisationEntity,
      CompteEntity,
      MembreOrganisationEntity,
      InvitationCompteEntity,
      RoleEntity,
      NotificationEntity,
      UtilisateurEntity,
    ]),
    // Required for @Public() decorator and Keycloak guards
    KeycloakModule,
    // Provides AuthSyncService
    SecurityModule,
    // Provides NotificationGateway
    NotificationModule,
  ],
  controllers: [
    OrganisationController,
    CompteController,
    MembreCompteController,
    InvitationCompteController,
  ],
  providers: [
    // Organisation
    {
      provide: 'OrganisationRepositoryPort',
      useClass: TypeOrmOrganisationRepository,
    },
    CreateOrganisationUseCase,
    GetOrganisationUseCase,
    UpdateOrganisationUseCase,
    DeleteOrganisationUseCase,

    // Compte
    {
      provide: 'CompteRepositoryPort',
      useClass: TypeOrmCompteRepository,
    },
    CreateCompteUseCase,
    GetCompteUseCase,
    UpdateCompteUseCase,
    DeleteCompteUseCase,

    // MembreCompte
    {
      provide: 'MembreCompteRepositoryPort',
      useClass: TypeOrmMembreCompteRepository,
    },
    CreateMembreCompteUseCase,
    GetMembreCompteUseCase,
    UpdateMembreCompteUseCase,
    DeleteMembreCompteUseCase,

    // InvitationCompte
    {
      provide: 'InvitationCompteRepositoryPort',
      useClass: TypeOrmInvitationCompteRepository,
    },
    CreateInvitationCompteUseCase,
    GetInvitationCompteUseCase,
    UpdateInvitationCompteUseCase,
    DeleteInvitationCompteUseCase,
  ],
  exports: [
    'OrganisationRepositoryPort',
    'CompteRepositoryPort',
    'MembreCompteRepositoryPort',
    'InvitationCompteRepositoryPort',
  ],
})
export class OrganisationModule {}

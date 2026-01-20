import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { ExpeditionController } from './controllers/expedition.controller';
import { ColisController } from './controllers/colis.controller';
import { EvenementSuiviController } from './controllers/evenement-suivi.controller';
import { TransporteurCompteController } from './controllers/transporteur-compte.controller';
import { LogisticsController } from './controllers/logistics.controller';

// Entities
import { ExpeditionEntity } from '../../../db/entities/expedition.entity';
import { ColisEntity } from '../../../db/entities/colis.entity';
import { EvenementSuiviEntity } from '../../../db/entities/evenement-suivi.entity';
import { TransporteurCompteEntity } from '../../../db/entities/transporteur-compte.entity';

// Repositories
import { TypeOrmExpeditionRepository } from '../../../repositories/typeorm-expedition.repository';
import { TypeOrmColisRepository } from '../../../repositories/typeorm-colis.repository';
import { TypeOrmEvenementSuiviRepository } from '../../../repositories/typeorm-evenement-suivi.repository';
import { TypeOrmTransporteurCompteRepository } from '../../../repositories/typeorm-transporteur-compte.repository';

// Services
import { MailevaLogisticsService } from '../../../services/maileva-logistics.service';

// Use Cases - Expedition
import { CreateExpeditionUseCase } from '../../../../applications/usecase/expedition/create-expedition.usecase';
import { GetExpeditionUseCase } from '../../../../applications/usecase/expedition/get-expedition.usecase';
import { GetExpeditionWithDetailsUseCase } from '../../../../applications/usecase/expedition/get-expedition-with-details.usecase';
import { UpdateExpeditionUseCase } from '../../../../applications/usecase/expedition/update-expedition.usecase';
import { DeleteExpeditionUseCase } from '../../../../applications/usecase/expedition/delete-expedition.usecase';

// Use Cases - Colis
import { CreateColisUseCase } from '../../../../applications/usecase/colis/create-colis.usecase';
import { GetColisUseCase } from '../../../../applications/usecase/colis/get-colis.usecase';
import { UpdateColisUseCase } from '../../../../applications/usecase/colis/update-colis.usecase';
import { DeleteColisUseCase } from '../../../../applications/usecase/colis/delete-colis.usecase';

// Use Cases - EvenementSuivi
import { CreateEvenementSuiviUseCase } from '../../../../applications/usecase/evenement-suivi/create-evenement-suivi.usecase';
import { GetEvenementSuiviUseCase } from '../../../../applications/usecase/evenement-suivi/get-evenement-suivi.usecase';
import { UpdateEvenementSuiviUseCase } from '../../../../applications/usecase/evenement-suivi/update-evenement-suivi.usecase';
import { DeleteEvenementSuiviUseCase } from '../../../../applications/usecase/evenement-suivi/delete-evenement-suivi.usecase';

// Use Cases - TransporteurCompte
import { CreateTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/create-transporteur-compte.usecase';
import { GetTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/get-transporteur-compte.usecase';
import { UpdateTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/update-transporteur-compte.usecase';
import { DeleteTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/delete-transporteur-compte.usecase';

// Use Cases - Logistics
import { GenerateLabelUseCase } from '../../../../applications/usecase/logistics/generate-label.usecase';
import { TrackShipmentUseCase } from '../../../../applications/usecase/logistics/track-shipment.usecase';
import { ValidateAddressUseCase } from '../../../../applications/usecase/logistics/validate-address.usecase';
import { SimulatePricingUseCase } from '../../../../applications/usecase/logistics/simulate-pricing.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExpeditionEntity,
      ColisEntity,
      EvenementSuiviEntity,
      TransporteurCompteEntity,
    ]),
  ],
  controllers: [
    ExpeditionController,
    ColisController,
    EvenementSuiviController,
    TransporteurCompteController,
    LogisticsController,
  ],
  providers: [
    // Maileva Logistics Service
    {
      provide: 'LogisticsProviderPort',
      useClass: MailevaLogisticsService,
    },

    // Expedition
    {
      provide: 'ExpeditionRepositoryPort',
      useClass: TypeOrmExpeditionRepository,
    },
    CreateExpeditionUseCase,
    GetExpeditionUseCase,
    GetExpeditionWithDetailsUseCase,
    UpdateExpeditionUseCase,
    DeleteExpeditionUseCase,

    // Colis
    {
      provide: 'ColisRepositoryPort',
      useClass: TypeOrmColisRepository,
    },
    CreateColisUseCase,
    GetColisUseCase,
    UpdateColisUseCase,
    DeleteColisUseCase,

    // EvenementSuivi
    {
      provide: 'EvenementSuiviRepositoryPort',
      useClass: TypeOrmEvenementSuiviRepository,
    },
    CreateEvenementSuiviUseCase,
    GetEvenementSuiviUseCase,
    UpdateEvenementSuiviUseCase,
    DeleteEvenementSuiviUseCase,

    // TransporteurCompte
    {
      provide: 'TransporteurCompteRepositoryPort',
      useClass: TypeOrmTransporteurCompteRepository,
    },
    CreateTransporteurCompteUseCase,
    GetTransporteurCompteUseCase,
    UpdateTransporteurCompteUseCase,
    DeleteTransporteurCompteUseCase,

    // Logistics Use Cases
    GenerateLabelUseCase,
    TrackShipmentUseCase,
    ValidateAddressUseCase,
    SimulatePricingUseCase,
  ],
  exports: [
    'ExpeditionRepositoryPort',
    'ColisRepositoryPort',
    'EvenementSuiviRepositoryPort',
    'TransporteurCompteRepositoryPort',
    'LogisticsProviderPort',
  ],
})
export class LogistiqueModule {}

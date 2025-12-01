/**
 * Logistics Providers - Expedition, Colis, EvenementSuivi, TransporteurCompte
 * Regroupement des providers liés à la logistique et aux expéditions
 */

import { CreateExpeditionUseCase } from '../../../../applications/usecase/expedition/create-expedition.usecase';
import { GetExpeditionUseCase } from '../../../../applications/usecase/expedition/get-expedition.usecase';
import { UpdateExpeditionUseCase } from '../../../../applications/usecase/expedition/update-expedition.usecase';
import { DeleteExpeditionUseCase } from '../../../../applications/usecase/expedition/delete-expedition.usecase';
import { TypeOrmExpeditionRepository } from '../../../repositories/typeorm-expedition.repository';

import { CreateColisUseCase } from '../../../../applications/usecase/colis/create-colis.usecase';
import { GetColisUseCase } from '../../../../applications/usecase/colis/get-colis.usecase';
import { UpdateColisUseCase } from '../../../../applications/usecase/colis/update-colis.usecase';
import { DeleteColisUseCase } from '../../../../applications/usecase/colis/delete-colis.usecase';
import { TypeOrmColisRepository } from '../../../repositories/typeorm-colis.repository';

import { CreateEvenementSuiviUseCase } from '../../../../applications/usecase/evenement-suivi/create-evenement-suivi.usecase';
import { GetEvenementSuiviUseCase } from '../../../../applications/usecase/evenement-suivi/get-evenement-suivi.usecase';
import { UpdateEvenementSuiviUseCase } from '../../../../applications/usecase/evenement-suivi/update-evenement-suivi.usecase';
import { DeleteEvenementSuiviUseCase } from '../../../../applications/usecase/evenement-suivi/delete-evenement-suivi.usecase';
import { TypeOrmEvenementSuiviRepository } from '../../../repositories/typeorm-evenement-suivi.repository';

import { CreateTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/create-transporteur-compte.usecase';
import { GetTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/get-transporteur-compte.usecase';
import { UpdateTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/update-transporteur-compte.usecase';
import { DeleteTransporteurCompteUseCase } from '../../../../applications/usecase/transporteur-compte/delete-transporteur-compte.usecase';
import { TypeOrmTransporteurCompteRepository } from '../../../repositories/typeorm-transporteur-compte.repository';

import { GenerateLabelUseCase } from '../../../../applications/usecase/logistics/generate-label.usecase';
import { TrackShipmentUseCase } from '../../../../applications/usecase/logistics/track-shipment.usecase';
import { ValidateAddressUseCase } from '../../../../applications/usecase/logistics/validate-address.usecase';
import { SimulatePricingUseCase } from '../../../../applications/usecase/logistics/simulate-pricing.usecase';
import { MailevaLogisticsService } from '../../../services/maileva-logistics.service';

export const LOGISTICS_PROVIDERS = [
  // Expedition Use Cases
  CreateExpeditionUseCase,
  GetExpeditionUseCase,
  UpdateExpeditionUseCase,
  DeleteExpeditionUseCase,

  // Expedition Repository
  {
    provide: 'ExpeditionRepositoryPort',
    useClass: TypeOrmExpeditionRepository,
  },

  // Colis Use Cases
  CreateColisUseCase,
  GetColisUseCase,
  UpdateColisUseCase,
  DeleteColisUseCase,

  // Colis Repository
  {
    provide: 'ColisRepositoryPort',
    useClass: TypeOrmColisRepository,
  },

  // EvenementSuivi Use Cases
  CreateEvenementSuiviUseCase,
  GetEvenementSuiviUseCase,
  UpdateEvenementSuiviUseCase,
  DeleteEvenementSuiviUseCase,

  // EvenementSuivi Repository
  {
    provide: 'EvenementSuiviRepositoryPort',
    useClass: TypeOrmEvenementSuiviRepository,
  },

  // TransporteurCompte Use Cases
  CreateTransporteurCompteUseCase,
  GetTransporteurCompteUseCase,
  UpdateTransporteurCompteUseCase,
  DeleteTransporteurCompteUseCase,

  // TransporteurCompte Repository
  {
    provide: 'TransporteurCompteRepositoryPort',
    useClass: TypeOrmTransporteurCompteRepository,
  },

  // Maileva Logistics Service
  {
    provide: 'LogisticsProviderPort',
    useClass: MailevaLogisticsService,
  },

  // Logistics Use Cases
  GenerateLabelUseCase,
  TrackShipmentUseCase,
  ValidateAddressUseCase,
  SimulatePricingUseCase,
];

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  RaccordementEnergieEntity,
  EnergieStatusHistoryEntity,
} from './domain/energie/entities';

// Domain ports
import {
  PLENITUDE_PORT,
  OHM_PORT,
} from './domain/energie/ports/energie-partenaire.port';

// Domain services
import { EnergieLifecycleService } from './domain/energie/services/energie-lifecycle.service';

// Infrastructure services (repositories)
import { RaccordementEnergieRepositoryService } from './infrastructure/persistence/typeorm/repositories/energie';

// Infrastructure adapters (external API clients)
import { PlenitudeMockClient } from './infrastructure/external/energie/plenitude-mock.client';
import { OhmMockClient } from './infrastructure/external/energie/ohm-mock.client';

// Infrastructure — gRPC controller
import { EnergieController } from './infrastructure/grpc/energie/energie.controller';

// Infrastructure — NATS handler
import { EnergieContractHandler } from './infrastructure/messaging/nats/handlers/energie-contract.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RaccordementEnergieEntity,
      EnergieStatusHistoryEntity,
    ]),
  ],
  controllers: [EnergieController],
  providers: [
    RaccordementEnergieRepositoryService,
    {
      provide: PLENITUDE_PORT,
      useClass: PlenitudeMockClient,
    },
    {
      provide: OHM_PORT,
      useClass: OhmMockClient,
    },
    EnergieLifecycleService,
    EnergieContractHandler,
  ],
  exports: [
    RaccordementEnergieRepositoryService,
    EnergieLifecycleService,
  ],
})
export class EnergieModule {}

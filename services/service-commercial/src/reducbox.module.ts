import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities — ReducBox
import {
  ReducBoxAccessEntity,
  ReducBoxAccessHistoryEntity,
} from './domain/reducbox/entities';

// Domain port
import { REDUCBOX_PORT } from './domain/reducbox/ports/reducbox.port';

// Domain services
import { ReducBoxLifecycleService } from './domain/reducbox/services/reducbox-lifecycle.service';

// Infrastructure services (repositories) — ReducBox
import { ReducBoxAccessRepositoryService } from './infrastructure/persistence/typeorm/repositories/reducbox';

// Infrastructure adapters (external API clients) — ReducBox
import { ReducBoxMockClient } from './infrastructure/external/reducbox/reducbox-mock.client';

// Infrastructure — gRPC controller
import { ReducBoxController } from './infrastructure/grpc/reducbox/reducbox.controller';

// Infrastructure — NATS handler
import { ReducBoxContractHandler } from './infrastructure/messaging/nats/handlers/reducbox-contract.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReducBoxAccessEntity,
      ReducBoxAccessHistoryEntity,
    ]),
  ],
  controllers: [ReducBoxController],
  providers: [
    ReducBoxAccessRepositoryService,
    {
      provide: REDUCBOX_PORT,
      useClass: ReducBoxMockClient,
    },
    ReducBoxLifecycleService,
    ReducBoxContractHandler,
  ],
  exports: [
    ReducBoxAccessRepositoryService,
    ReducBoxLifecycleService,
  ],
})
export class ReducBoxModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  PieceJointeEntity,
  BoiteMailEntity,
} from './domain/documents/entities';

// Infrastructure services
import {
  PieceJointeService,
  BoiteMailService,
} from './infrastructure/persistence/typeorm/repositories/documents';

// Infrastructure handlers
import { ContractSignedHandler } from './infrastructure/messaging/nats/handlers';

// Interface controllers
import {
  PieceJointeController,
  BoiteMailController,
} from './interfaces/grpc/controllers/documents';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PieceJointeEntity,
      BoiteMailEntity,
    ]),
  ],
  controllers: [
    PieceJointeController,
    BoiteMailController,
  ],
  providers: [
    PieceJointeService,
    BoiteMailService,
    ContractSignedHandler,
  ],
  exports: [
    PieceJointeService,
    BoiteMailService,
  ],
})
export class DocumentsModule {}

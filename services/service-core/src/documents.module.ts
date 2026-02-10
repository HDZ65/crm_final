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

// Interface controllers
import {
  PieceJointeController,
  BoiteMailController,
} from './infrastructure/grpc/documents';

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
  ],
  exports: [
    PieceJointeService,
    BoiteMailService,
  ],
})
export class DocumentsModule {}

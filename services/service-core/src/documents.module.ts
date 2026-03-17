import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import {
  PieceJointeEntity,
  BoiteMailEntity,
  DocumentAuditLogEntity,
} from './domain/documents/entities';

// Infrastructure services
import {
  PieceJointeService,
  BoiteMailService,
} from './infrastructure/persistence/typeorm/repositories/documents';

// Infrastructure storage
import { StorageModule } from './infrastructure/storage/storage.module';
import { DocumentStorageService } from './infrastructure/storage/document-storage.service';

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
      DocumentAuditLogEntity,
    ]),
    StorageModule,
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
    DocumentStorageService,
  ],
})
export class DocumentsModule {}

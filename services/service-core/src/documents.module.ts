import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain entities
import { BoiteMailEntity, DocumentAuditLogEntity, PieceJointeEntity } from './domain/documents/entities';
// Interface controllers
import { BoiteMailController, PieceJointeController } from './infrastructure/grpc/documents';
// Infrastructure services
import { BoiteMailService, PieceJointeService } from './infrastructure/persistence/typeorm/repositories/documents';
// Infrastructure storage
import { StorageModule } from './infrastructure/storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([PieceJointeEntity, BoiteMailEntity, DocumentAuditLogEntity]), StorageModule],
  controllers: [PieceJointeController, BoiteMailController],
  providers: [PieceJointeService, BoiteMailService],
  exports: [PieceJointeService, BoiteMailService, StorageModule],
})
export class DocumentsModule {}

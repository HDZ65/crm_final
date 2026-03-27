import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Domain entities
import {
  WinLeadPlusConfigEntity,
  WinLeadPlusMappingEntity,
  WinLeadPlusSyncLogEntity,
} from './domain/winleadplus/entities';
// Domain services
import { CoreClientService } from './domain/winleadplus/services/core-client.service';
import { WinLeadPlusMapperService } from './domain/winleadplus/services/winleadplus-mapper.service';
import { WinLeadPlusSyncService } from './domain/winleadplus/services/winleadplus-sync.service';
import { WinLeadPlusGrpcController } from './domain/winleadplus/winleadplus.grpc-controller';
// Contrats entities (needed by WinLeadPlusSyncService)
import { ContratEntity } from './domain/contrats/entities/contrat.entity';
import { LigneContratEntity } from './domain/contrats/entities/ligne-contrat.entity';
// Infrastructure services
import {
  WinLeadPlusConfigService,
  WinLeadPlusMappingService,
  WinLeadPlusSyncLogService,
} from './infrastructure/persistence/typeorm/repositories/winleadplus';
import { ContratService } from './infrastructure/persistence/typeorm/repositories/contrats';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WinLeadPlusConfigEntity,
      WinLeadPlusMappingEntity,
      WinLeadPlusSyncLogEntity,
      ContratEntity,
      LigneContratEntity,
    ]),
  ],
  controllers: [WinLeadPlusGrpcController],
  providers: [
    WinLeadPlusConfigService,
    WinLeadPlusMappingService,
    WinLeadPlusSyncLogService,
    ContratService,
    WinLeadPlusMapperService,
    CoreClientService,
    WinLeadPlusSyncService,
  ],
  exports: [
    WinLeadPlusConfigService,
    WinLeadPlusMappingService,
    WinLeadPlusSyncLogService,
    ContratService,
    WinLeadPlusMapperService,
    CoreClientService,
    WinLeadPlusSyncService,
  ],
})
export class WinLeadPlusModule {}

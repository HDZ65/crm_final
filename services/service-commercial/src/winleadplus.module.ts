import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContratsModule } from './contrats.module';
import { LigneContratEntity } from './domain/contrats/entities/ligne-contrat.entity';
import { WinLeadPlusGrpcController } from './domain/winleadplus/winleadplus.grpc-controller';
import { WinLeadPlusMapperService } from './domain/winleadplus/services/winleadplus-mapper.service';
import { WinLeadPlusSyncService } from './domain/winleadplus/services/winleadplus-sync.service';

// Domain entities
import {
  WinLeadPlusConfigEntity,
  WinLeadPlusMappingEntity,
  WinLeadPlusSyncLogEntity,
} from './domain/winleadplus/entities';

// Infrastructure services (TypeORM repositories)
import {
  WinLeadPlusConfigService,
  WinLeadPlusMappingService,
  WinLeadPlusSyncLogService,
} from './infrastructure/persistence/typeorm/repositories/winleadplus';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WinLeadPlusConfigEntity,
      WinLeadPlusMappingEntity,
      WinLeadPlusSyncLogEntity,
      LigneContratEntity,
    ]),
    ContratsModule,
  ],
  controllers: [WinLeadPlusGrpcController],
  providers: [
    // TypeORM repository services
    WinLeadPlusConfigService,
    WinLeadPlusMappingService,
    WinLeadPlusSyncLogService,
    WinLeadPlusMapperService,
    WinLeadPlusSyncService,
  ],
  exports: [
    WinLeadPlusConfigService,
    WinLeadPlusMappingService,
    WinLeadPlusSyncLogService,
    WinLeadPlusMapperService,
    WinLeadPlusSyncService,
  ],
})
export class WinLeadPlusModule implements OnModuleInit {
  private readonly logger = new Logger(WinLeadPlusModule.name);

  onModuleInit(): void {
    this.logger.log('WinLeadPlusModule initialized');
  }
}

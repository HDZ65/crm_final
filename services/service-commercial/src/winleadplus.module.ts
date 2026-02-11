import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
    ]),
  ],
  controllers: [],
  providers: [
    // TypeORM repository services
    WinLeadPlusConfigService,
    WinLeadPlusMappingService,
    WinLeadPlusSyncLogService,
  ],
  exports: [
    WinLeadPlusConfigService,
    WinLeadPlusMappingService,
    WinLeadPlusSyncLogService,
  ],
})
export class WinLeadPlusModule {}

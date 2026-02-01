import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CutoffConfigurationEntity } from './entities/cutoff-configuration.entity';
import { SystemDebitConfigurationEntity } from './entities/system-debit-configuration.entity';
import { CompanyDebitConfigurationEntity } from './entities/company-debit-configuration.entity';
import { ClientDebitConfigurationEntity } from './entities/client-debit-configuration.entity';
import { ContractDebitConfigurationEntity } from './entities/contract-debit-configuration.entity';
import { ConfigurationResolverService } from './configuration-resolver.service';
import { ConfigurationService } from './configuration.service';
import { ConfigurationController } from './configuration.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CutoffConfigurationEntity,
      SystemDebitConfigurationEntity,
      CompanyDebitConfigurationEntity,
      ClientDebitConfigurationEntity,
      ContractDebitConfigurationEntity,
    ]),
    forwardRef(() => AuditModule),
  ],
  controllers: [ConfigurationController],
  providers: [ConfigurationResolverService, ConfigurationService],
  exports: [ConfigurationResolverService, ConfigurationService, TypeOrmModule],
})
export class ConfigurationModule {}

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CutoffConfigurationEntity } from './entities/cutoff-configuration.entity.js';
import { SystemDebitConfigurationEntity } from './entities/system-debit-configuration.entity.js';
import { CompanyDebitConfigurationEntity } from './entities/company-debit-configuration.entity.js';
import { ClientDebitConfigurationEntity } from './entities/client-debit-configuration.entity.js';
import { ContractDebitConfigurationEntity } from './entities/contract-debit-configuration.entity.js';
import { ConfigurationResolverService } from './configuration-resolver.service.js';
import { ConfigurationService } from './configuration.service.js';
import { AuditModule } from '../audit/audit.module.js';

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
  providers: [ConfigurationResolverService, ConfigurationService],
  exports: [ConfigurationResolverService, ConfigurationService, TypeOrmModule],
})
export class ConfigurationModule {}

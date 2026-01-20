var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let ConfigurationModule = class ConfigurationModule {
};
ConfigurationModule = __decorate([
    Module({
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
], ConfigurationModule);
export { ConfigurationModule };
//# sourceMappingURL=configuration.module.js.map
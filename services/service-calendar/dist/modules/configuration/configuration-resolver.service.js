var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ConfigurationResolverService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemDebitConfigurationEntity } from './entities/system-debit-configuration.entity.js';
import { CompanyDebitConfigurationEntity } from './entities/company-debit-configuration.entity.js';
import { ClientDebitConfigurationEntity } from './entities/client-debit-configuration.entity.js';
import { ContractDebitConfigurationEntity } from './entities/contract-debit-configuration.entity.js';
export class ConfigurationError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ConfigurationError';
    }
}
let ConfigurationResolverService = ConfigurationResolverService_1 = class ConfigurationResolverService {
    contractConfigRepo;
    clientConfigRepo;
    companyConfigRepo;
    systemConfigRepo;
    logger = new Logger(ConfigurationResolverService_1.name);
    constructor(contractConfigRepo, clientConfigRepo, companyConfigRepo, systemConfigRepo) {
        this.contractConfigRepo = contractConfigRepo;
        this.clientConfigRepo = clientConfigRepo;
        this.companyConfigRepo = companyConfigRepo;
        this.systemConfigRepo = systemConfigRepo;
    }
    async resolve(input) {
        if (input.contratId) {
            const contractConfig = await this.contractConfigRepo.findOne({
                where: {
                    organisationId: input.organisationId,
                    contratId: input.contratId,
                    isActive: true,
                },
            });
            if (contractConfig) {
                this.logger.debug(`Configuration resolved at contract level: ${contractConfig.id}`);
                return this.mapToResolvedConfig(contractConfig, 'contract');
            }
        }
        if (input.clientId) {
            const clientConfig = await this.clientConfigRepo.findOne({
                where: {
                    organisationId: input.organisationId,
                    clientId: input.clientId,
                    isActive: true,
                },
            });
            if (clientConfig) {
                this.logger.debug(`Configuration resolved at client level: ${clientConfig.id}`);
                return this.mapToResolvedConfig(clientConfig, 'client');
            }
        }
        if (input.societeId) {
            const companyConfig = await this.companyConfigRepo.findOne({
                where: {
                    organisationId: input.organisationId,
                    societeId: input.societeId,
                    isActive: true,
                },
            });
            if (companyConfig) {
                this.logger.debug(`Configuration resolved at company level: ${companyConfig.id}`);
                return this.mapToResolvedConfig(companyConfig, 'company');
            }
        }
        const systemConfig = await this.systemConfigRepo.findOne({
            where: {
                organisationId: input.organisationId,
                isActive: true,
            },
        });
        if (systemConfig) {
            this.logger.debug(`Configuration resolved at system level: ${systemConfig.id}`);
            return this.mapSystemToResolvedConfig(systemConfig);
        }
        throw new ConfigurationError('NO_CONFIGURATION_FOUND', `No active debit configuration found for organisation ${input.organisationId}`, {
            organisationId: input.organisationId,
            contratId: input.contratId,
            clientId: input.clientId,
            societeId: input.societeId,
            checkedLevels: ['contract', 'client', 'company', 'system'],
        });
    }
    async getResolutionTrace(input) {
        const results = {
            resolvedLevel: null,
        };
        if (input.contratId) {
            const contractConfig = await this.contractConfigRepo.findOne({
                where: {
                    organisationId: input.organisationId,
                    contratId: input.contratId,
                    isActive: true,
                },
            });
            if (contractConfig) {
                results.contractConfig = contractConfig;
                if (!results.resolvedLevel)
                    results.resolvedLevel = 'contract';
            }
        }
        if (input.clientId) {
            const clientConfig = await this.clientConfigRepo.findOne({
                where: {
                    organisationId: input.organisationId,
                    clientId: input.clientId,
                    isActive: true,
                },
            });
            if (clientConfig) {
                results.clientConfig = clientConfig;
                if (!results.resolvedLevel)
                    results.resolvedLevel = 'client';
            }
        }
        if (input.societeId) {
            const companyConfig = await this.companyConfigRepo.findOne({
                where: {
                    organisationId: input.organisationId,
                    societeId: input.societeId,
                    isActive: true,
                },
            });
            if (companyConfig) {
                results.companyConfig = companyConfig;
                if (!results.resolvedLevel)
                    results.resolvedLevel = 'company';
            }
        }
        const systemConfig = await this.systemConfigRepo.findOne({
            where: {
                organisationId: input.organisationId,
                isActive: true,
            },
        });
        if (systemConfig) {
            results.systemConfig = systemConfig;
            if (!results.resolvedLevel)
                results.resolvedLevel = 'system';
        }
        return results;
    }
    mapToResolvedConfig(config, level) {
        if (!config.holidayZoneId) {
            throw new ConfigurationError('HOLIDAY_ZONE_REQUIRED', `Holiday zone is required but not configured at ${level} level`, { configId: config.id, level });
        }
        return {
            mode: config.mode,
            batch: config.batch ?? undefined,
            fixedDay: config.fixedDay ?? undefined,
            shiftStrategy: config.shiftStrategy,
            holidayZoneId: config.holidayZoneId,
            appliedLevel: level,
            appliedConfigId: config.id,
        };
    }
    mapSystemToResolvedConfig(config) {
        if (!config.holidayZoneId) {
            throw new ConfigurationError('HOLIDAY_ZONE_REQUIRED', 'Holiday zone is required but not configured at system level', { configId: config.id, level: 'system' });
        }
        return {
            mode: config.defaultMode,
            batch: config.defaultBatch ?? undefined,
            fixedDay: config.defaultFixedDay ?? undefined,
            shiftStrategy: config.shiftStrategy,
            holidayZoneId: config.holidayZoneId,
            appliedLevel: 'system',
            appliedConfigId: config.id,
        };
    }
};
ConfigurationResolverService = ConfigurationResolverService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(ContractDebitConfigurationEntity)),
    __param(1, InjectRepository(ClientDebitConfigurationEntity)),
    __param(2, InjectRepository(CompanyDebitConfigurationEntity)),
    __param(3, InjectRepository(SystemDebitConfigurationEntity)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository])
], ConfigurationResolverService);
export { ConfigurationResolverService };
//# sourceMappingURL=configuration-resolver.service.js.map
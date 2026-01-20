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
var ConfigurationService_1;
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemDebitConfigurationEntity } from './entities/system-debit-configuration.entity.js';
import { CompanyDebitConfigurationEntity } from './entities/company-debit-configuration.entity.js';
import { ClientDebitConfigurationEntity } from './entities/client-debit-configuration.entity.js';
import { ContractDebitConfigurationEntity } from './entities/contract-debit-configuration.entity.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditSource } from '../audit/entities/calendar-audit-log.entity.js';
let ConfigurationService = ConfigurationService_1 = class ConfigurationService {
    systemConfigRepo;
    companyConfigRepo;
    clientConfigRepo;
    contractConfigRepo;
    auditService;
    logger = new Logger(ConfigurationService_1.name);
    constructor(systemConfigRepo, companyConfigRepo, clientConfigRepo, contractConfigRepo, auditService) {
        this.systemConfigRepo = systemConfigRepo;
        this.companyConfigRepo = companyConfigRepo;
        this.clientConfigRepo = clientConfigRepo;
        this.contractConfigRepo = contractConfigRepo;
        this.auditService = auditService;
    }
    async getSystemConfig(organisationId) {
        return this.systemConfigRepo.findOne({
            where: { organisationId, isActive: true },
        });
    }
    async updateSystemConfig(organisationId, data, actorUserId) {
        let config = await this.systemConfigRepo.findOne({
            where: { organisationId },
        });
        const beforeState = config ? { ...config } : undefined;
        if (config) {
            Object.assign(config, data);
            config = await this.systemConfigRepo.save(config);
        }
        else {
            config = this.systemConfigRepo.create({
                organisationId,
                ...data,
                isActive: true,
            });
            config = await this.systemConfigRepo.save(config);
        }
        await this.auditService.logConfigurationChange(organisationId, 'system', config.id, beforeState ? 'UPDATE' : 'CREATE', actorUserId, AuditSource.API, beforeState, config);
        return config;
    }
    async createCompanyConfig(organisationId, societeId, data, actorUserId) {
        const config = this.companyConfigRepo.create({
            organisationId,
            societeId,
            ...data,
            isActive: true,
        });
        const saved = await this.companyConfigRepo.save(config);
        await this.auditService.logConfigurationChange(organisationId, 'company', saved.id, 'CREATE', actorUserId, AuditSource.API, undefined, saved);
        return saved;
    }
    async updateCompanyConfig(id, data, actorUserId) {
        const config = await this.companyConfigRepo.findOne({ where: { id } });
        if (!config) {
            throw new NotFoundException(`Company config ${id} not found`);
        }
        const beforeState = { ...config };
        Object.assign(config, data);
        const saved = await this.companyConfigRepo.save(config);
        await this.auditService.logConfigurationChange(config.organisationId, 'company', id, 'UPDATE', actorUserId, AuditSource.API, beforeState, saved);
        return saved;
    }
    async getCompanyConfig(id) {
        return this.companyConfigRepo.findOne({ where: { id } });
    }
    async listCompanyConfigs(organisationId, societeId, pagination) {
        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 50;
        const skip = (page - 1) * limit;
        const where = { organisationId, isActive: true };
        if (societeId)
            where.societeId = societeId;
        const [items, total] = await this.companyConfigRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async deleteCompanyConfig(id, actorUserId) {
        const config = await this.companyConfigRepo.findOne({ where: { id } });
        if (!config) {
            throw new NotFoundException(`Company config ${id} not found`);
        }
        const beforeState = { ...config };
        config.isActive = false;
        await this.companyConfigRepo.save(config);
        await this.auditService.logConfigurationChange(config.organisationId, 'company', id, 'DELETE', actorUserId, AuditSource.API, beforeState, undefined);
    }
    async createClientConfig(organisationId, clientId, data, actorUserId) {
        const config = this.clientConfigRepo.create({
            organisationId,
            clientId,
            ...data,
            isActive: true,
        });
        const saved = await this.clientConfigRepo.save(config);
        await this.auditService.logConfigurationChange(organisationId, 'client', saved.id, 'CREATE', actorUserId, AuditSource.API, undefined, saved);
        return saved;
    }
    async updateClientConfig(id, data, actorUserId) {
        const config = await this.clientConfigRepo.findOne({ where: { id } });
        if (!config) {
            throw new NotFoundException(`Client config ${id} not found`);
        }
        const beforeState = { ...config };
        Object.assign(config, data);
        const saved = await this.clientConfigRepo.save(config);
        await this.auditService.logConfigurationChange(config.organisationId, 'client', id, 'UPDATE', actorUserId, AuditSource.API, beforeState, saved);
        return saved;
    }
    async getClientConfig(id) {
        return this.clientConfigRepo.findOne({ where: { id } });
    }
    async listClientConfigs(organisationId, clientId, pagination) {
        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 50;
        const skip = (page - 1) * limit;
        const where = { organisationId, isActive: true };
        if (clientId)
            where.clientId = clientId;
        const [items, total] = await this.clientConfigRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async deleteClientConfig(id, actorUserId) {
        const config = await this.clientConfigRepo.findOne({ where: { id } });
        if (!config) {
            throw new NotFoundException(`Client config ${id} not found`);
        }
        const beforeState = { ...config };
        config.isActive = false;
        await this.clientConfigRepo.save(config);
        await this.auditService.logConfigurationChange(config.organisationId, 'client', id, 'DELETE', actorUserId, AuditSource.API, beforeState, undefined);
    }
    async createContractConfig(organisationId, contratId, data, actorUserId) {
        const config = this.contractConfigRepo.create({
            organisationId,
            contratId,
            ...data,
            isActive: true,
        });
        const saved = await this.contractConfigRepo.save(config);
        await this.auditService.logConfigurationChange(organisationId, 'contract', saved.id, 'CREATE', actorUserId, AuditSource.API, undefined, saved);
        return saved;
    }
    async updateContractConfig(id, data, actorUserId) {
        const config = await this.contractConfigRepo.findOne({ where: { id } });
        if (!config) {
            throw new NotFoundException(`Contract config ${id} not found`);
        }
        const beforeState = { ...config };
        Object.assign(config, data);
        const saved = await this.contractConfigRepo.save(config);
        await this.auditService.logConfigurationChange(config.organisationId, 'contract', id, 'UPDATE', actorUserId, AuditSource.API, beforeState, saved);
        return saved;
    }
    async getContractConfig(id) {
        return this.contractConfigRepo.findOne({ where: { id } });
    }
    async listContractConfigs(organisationId, contratId, pagination) {
        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 50;
        const skip = (page - 1) * limit;
        const where = { organisationId, isActive: true };
        if (contratId)
            where.contratId = contratId;
        const [items, total] = await this.contractConfigRepo.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async deleteContractConfig(id, actorUserId) {
        const config = await this.contractConfigRepo.findOne({ where: { id } });
        if (!config) {
            throw new NotFoundException(`Contract config ${id} not found`);
        }
        const beforeState = { ...config };
        config.isActive = false;
        await this.contractConfigRepo.save(config);
        await this.auditService.logConfigurationChange(config.organisationId, 'contract', id, 'DELETE', actorUserId, AuditSource.API, beforeState, undefined);
    }
};
ConfigurationService = ConfigurationService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(SystemDebitConfigurationEntity)),
    __param(1, InjectRepository(CompanyDebitConfigurationEntity)),
    __param(2, InjectRepository(ClientDebitConfigurationEntity)),
    __param(3, InjectRepository(ContractDebitConfigurationEntity)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        AuditService])
], ConfigurationService);
export { ConfigurationService };
//# sourceMappingURL=configuration.service.js.map
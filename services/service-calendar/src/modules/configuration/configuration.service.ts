import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SystemDebitConfigurationEntity, DebitDateMode, DebitBatch, DateShiftStrategy } from './entities/system-debit-configuration.entity.js';
import { CompanyDebitConfigurationEntity } from './entities/company-debit-configuration.entity.js';
import { ClientDebitConfigurationEntity } from './entities/client-debit-configuration.entity.js';
import { ContractDebitConfigurationEntity } from './entities/contract-debit-configuration.entity.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditSource } from '../audit/entities/calendar-audit-log.entity.js';

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  constructor(
    @InjectRepository(SystemDebitConfigurationEntity)
    private readonly systemConfigRepo: Repository<SystemDebitConfigurationEntity>,
    @InjectRepository(CompanyDebitConfigurationEntity)
    private readonly companyConfigRepo: Repository<CompanyDebitConfigurationEntity>,
    @InjectRepository(ClientDebitConfigurationEntity)
    private readonly clientConfigRepo: Repository<ClientDebitConfigurationEntity>,
    @InjectRepository(ContractDebitConfigurationEntity)
    private readonly contractConfigRepo: Repository<ContractDebitConfigurationEntity>,
    private readonly auditService: AuditService,
  ) {}

  async getSystemConfig(organisationId: string): Promise<SystemDebitConfigurationEntity | null> {
    return this.systemConfigRepo.findOne({
      where: { organisationId, isActive: true },
    });
  }

  async updateSystemConfig(
    organisationId: string,
    data: {
      defaultMode: DebitDateMode;
      defaultBatch?: DebitBatch;
      defaultFixedDay?: number;
      shiftStrategy: DateShiftStrategy;
      holidayZoneId?: string;
      cutoffConfigId?: string;
    },
    actorUserId: string,
  ): Promise<SystemDebitConfigurationEntity> {
    let config = await this.systemConfigRepo.findOne({
      where: { organisationId },
    });

    const beforeState = config ? { ...config } : undefined;

    if (config) {
      Object.assign(config, data);
      config = await this.systemConfigRepo.save(config);
    } else {
      config = this.systemConfigRepo.create({
        organisationId,
        ...data,
        isActive: true,
      });
      config = await this.systemConfigRepo.save(config);
    }

    await this.auditService.logConfigurationChange(
      organisationId,
      'system',
      config.id,
      beforeState ? 'UPDATE' : 'CREATE',
      actorUserId,
      AuditSource.API,
      beforeState as Record<string, unknown>,
      config as unknown as Record<string, unknown>,
    );

    return config;
  }

  async createCompanyConfig(
    organisationId: string,
    societeId: string,
    data: {
      mode: DebitDateMode;
      batch?: DebitBatch;
      fixedDay?: number;
      shiftStrategy: DateShiftStrategy;
      holidayZoneId?: string;
      cutoffConfigId?: string;
    },
    actorUserId: string,
  ): Promise<CompanyDebitConfigurationEntity> {
    const config = this.companyConfigRepo.create({
      organisationId,
      societeId,
      ...data,
      isActive: true,
    });

    const saved = await this.companyConfigRepo.save(config);

    await this.auditService.logConfigurationChange(
      organisationId,
      'company',
      saved.id,
      'CREATE',
      actorUserId,
      AuditSource.API,
      undefined,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async updateCompanyConfig(
    id: string,
    data: Partial<{
      mode: DebitDateMode;
      batch: DebitBatch;
      fixedDay: number;
      shiftStrategy: DateShiftStrategy;
      holidayZoneId: string;
      cutoffConfigId: string;
      isActive: boolean;
    }>,
    actorUserId: string,
  ): Promise<CompanyDebitConfigurationEntity> {
    const config = await this.companyConfigRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Company config ${id} not found`);
    }

    const beforeState = { ...config };
    Object.assign(config, data);
    const saved = await this.companyConfigRepo.save(config);

    await this.auditService.logConfigurationChange(
      config.organisationId,
      'company',
      id,
      'UPDATE',
      actorUserId,
      AuditSource.API,
      beforeState as unknown as Record<string, unknown>,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async getCompanyConfig(id: string): Promise<CompanyDebitConfigurationEntity | null> {
    return this.companyConfigRepo.findOne({ where: { id } });
  }

  async listCompanyConfigs(
    organisationId: string,
    societeId?: string,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<CompanyDebitConfigurationEntity>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organisationId, isActive: true };
    if (societeId) where.societeId = societeId;

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

  async deleteCompanyConfig(id: string, actorUserId: string): Promise<void> {
    const config = await this.companyConfigRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Company config ${id} not found`);
    }

    const beforeState = { ...config };
    config.isActive = false;
    await this.companyConfigRepo.save(config);

    await this.auditService.logConfigurationChange(
      config.organisationId,
      'company',
      id,
      'DELETE',
      actorUserId,
      AuditSource.API,
      beforeState as unknown as Record<string, unknown>,
      undefined,
    );
  }

  async createClientConfig(
    organisationId: string,
    clientId: string,
    data: {
      mode: DebitDateMode;
      batch?: DebitBatch;
      fixedDay?: number;
      shiftStrategy: DateShiftStrategy;
      holidayZoneId?: string;
    },
    actorUserId: string,
  ): Promise<ClientDebitConfigurationEntity> {
    const config = this.clientConfigRepo.create({
      organisationId,
      clientId,
      ...data,
      isActive: true,
    });

    const saved = await this.clientConfigRepo.save(config);

    await this.auditService.logConfigurationChange(
      organisationId,
      'client',
      saved.id,
      'CREATE',
      actorUserId,
      AuditSource.API,
      undefined,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async updateClientConfig(
    id: string,
    data: Partial<{
      mode: DebitDateMode;
      batch: DebitBatch;
      fixedDay: number;
      shiftStrategy: DateShiftStrategy;
      holidayZoneId: string;
      isActive: boolean;
    }>,
    actorUserId: string,
  ): Promise<ClientDebitConfigurationEntity> {
    const config = await this.clientConfigRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Client config ${id} not found`);
    }

    const beforeState = { ...config };
    Object.assign(config, data);
    const saved = await this.clientConfigRepo.save(config);

    await this.auditService.logConfigurationChange(
      config.organisationId,
      'client',
      id,
      'UPDATE',
      actorUserId,
      AuditSource.API,
      beforeState as unknown as Record<string, unknown>,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async getClientConfig(id: string): Promise<ClientDebitConfigurationEntity | null> {
    return this.clientConfigRepo.findOne({ where: { id } });
  }

  async listClientConfigs(
    organisationId: string,
    clientId?: string,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<ClientDebitConfigurationEntity>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organisationId, isActive: true };
    if (clientId) where.clientId = clientId;

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

  async deleteClientConfig(id: string, actorUserId: string): Promise<void> {
    const config = await this.clientConfigRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Client config ${id} not found`);
    }

    const beforeState = { ...config };
    config.isActive = false;
    await this.clientConfigRepo.save(config);

    await this.auditService.logConfigurationChange(
      config.organisationId,
      'client',
      id,
      'DELETE',
      actorUserId,
      AuditSource.API,
      beforeState as unknown as Record<string, unknown>,
      undefined,
    );
  }

  async createContractConfig(
    organisationId: string,
    contratId: string,
    data: {
      mode: DebitDateMode;
      batch?: DebitBatch;
      fixedDay?: number;
      shiftStrategy: DateShiftStrategy;
      holidayZoneId?: string;
    },
    actorUserId: string,
  ): Promise<ContractDebitConfigurationEntity> {
    const config = this.contractConfigRepo.create({
      organisationId,
      contratId,
      ...data,
      isActive: true,
    });

    const saved = await this.contractConfigRepo.save(config);

    await this.auditService.logConfigurationChange(
      organisationId,
      'contract',
      saved.id,
      'CREATE',
      actorUserId,
      AuditSource.API,
      undefined,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async updateContractConfig(
    id: string,
    data: Partial<{
      mode: DebitDateMode;
      batch: DebitBatch;
      fixedDay: number;
      shiftStrategy: DateShiftStrategy;
      holidayZoneId: string;
      isActive: boolean;
    }>,
    actorUserId: string,
  ): Promise<ContractDebitConfigurationEntity> {
    const config = await this.contractConfigRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Contract config ${id} not found`);
    }

    const beforeState = { ...config };
    Object.assign(config, data);
    const saved = await this.contractConfigRepo.save(config);

    await this.auditService.logConfigurationChange(
      config.organisationId,
      'contract',
      id,
      'UPDATE',
      actorUserId,
      AuditSource.API,
      beforeState as unknown as Record<string, unknown>,
      saved as unknown as Record<string, unknown>,
    );

    return saved;
  }

  async getContractConfig(id: string): Promise<ContractDebitConfigurationEntity | null> {
    return this.contractConfigRepo.findOne({ where: { id } });
  }

  async listContractConfigs(
    organisationId: string,
    contratId?: string,
    pagination?: PaginationInput,
  ): Promise<PaginatedResult<ContractDebitConfigurationEntity>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organisationId, isActive: true };
    if (contratId) where.contratId = contratId;

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

  async deleteContractConfig(id: string, actorUserId: string): Promise<void> {
    const config = await this.contractConfigRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Contract config ${id} not found`);
    }

    const beforeState = { ...config };
    config.isActive = false;
    await this.contractConfigRepo.save(config);

    await this.auditService.logConfigurationChange(
      config.organisationId,
      'contract',
      id,
      'DELETE',
      actorUserId,
      AuditSource.API,
      beforeState as unknown as Record<string, unknown>,
      undefined,
    );
  }
}

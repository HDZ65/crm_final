import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SystemDebitConfigurationEntity,
  DebitDateMode,
  DebitBatch,
  DateShiftStrategy,
  CompanyDebitConfigurationEntity,
  ClientDebitConfigurationEntity,
  ContractDebitConfigurationEntity,
} from '../../../../../domain/calendar/entities';

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
  ): Promise<SystemDebitConfigurationEntity> {
    let config = await this.systemConfigRepo.findOne({
      where: { organisationId },
    });

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

    return config;
  }

  async getCompanyConfig(societeId: string): Promise<CompanyDebitConfigurationEntity | null> {
    return this.companyConfigRepo.findOne({ where: { societeId, isActive: true } });
  }

  async getClientConfig(clientId: string): Promise<ClientDebitConfigurationEntity | null> {
    return this.clientConfigRepo.findOne({ where: { clientId, isActive: true } });
  }

  async getContractConfig(contratId: string): Promise<ContractDebitConfigurationEntity | null> {
    return this.contractConfigRepo.findOne({ where: { contratId, isActive: true } });
  }

  async getContractConfigById(id: string): Promise<ContractDebitConfigurationEntity | null> {
    return this.contractConfigRepo.findOne({ where: { id } });
  }

  async createContractConfig(data: {
    organisationId: string;
    contratId: string;
    mode: DebitDateMode;
    batch?: DebitBatch;
    fixedDay?: number;
    shiftStrategy: DateShiftStrategy;
    holidayZoneId?: string;
  }): Promise<ContractDebitConfigurationEntity> {
    const config = this.contractConfigRepo.create({
      ...data,
      isActive: true,
    });
    return this.contractConfigRepo.save(config);
  }

  async updateContractConfig(
    id: string,
    data: {
      mode?: DebitDateMode;
      batch?: DebitBatch;
      fixedDay?: number;
      shiftStrategy?: DateShiftStrategy;
      holidayZoneId?: string;
      isActive?: boolean;
    },
  ): Promise<ContractDebitConfigurationEntity> {
    const config = await this.contractConfigRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Contract config ${id} not found`);
    }
    Object.assign(config, data);
    return this.contractConfigRepo.save(config);
  }

  async deleteContractConfig(id: string): Promise<{ success: boolean; message: string }> {
    const config = await this.contractConfigRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Contract config ${id} not found`);
    }
    await this.contractConfigRepo.remove(config);
    return { success: true, message: `Contract config ${id} deleted` };
  }

  async listContractConfigs(
    organisationId: string,
    contratId?: string,
    pagination?: { page: number; limit: number },
  ): Promise<{ configs: ContractDebitConfigurationEntity[]; total: number }> {
    const where: any = { organisationId };
    if (contratId) {
      where.contratId = contratId;
    }
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const [configs, total] = await this.contractConfigRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { configs, total };
  }
}

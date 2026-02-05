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
}

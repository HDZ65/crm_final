import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SystemDebitConfigurationEntity, DebitDateMode, DebitBatch, DateShiftStrategy } from './entities/system-debit-configuration.entity.js';
import { CompanyDebitConfigurationEntity } from './entities/company-debit-configuration.entity.js';
import { ClientDebitConfigurationEntity } from './entities/client-debit-configuration.entity.js';
import { ContractDebitConfigurationEntity } from './entities/contract-debit-configuration.entity.js';
import type { ResolveConfigurationRequest } from '@proto/calendar/calendar.js';

export type ConfigurationLevel = 'contract' | 'client' | 'company' | 'system';

export interface ResolveConfigInput {
  organisationId: string;
  contratId?: string;
  clientId?: string;
  societeId?: string;
}

export interface ResolvedConfig {
  mode: DebitDateMode;
  batch?: DebitBatch;
  fixedDay?: number;
  shiftStrategy: DateShiftStrategy;
  holidayZoneId: string;
  appliedLevel: ConfigurationLevel;
  appliedConfigId: string;
}

export class ConfigurationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

@Injectable()
export class ConfigurationResolverService {
  private readonly logger = new Logger(ConfigurationResolverService.name);

  constructor(
    @InjectRepository(ContractDebitConfigurationEntity)
    private readonly contractConfigRepo: Repository<ContractDebitConfigurationEntity>,
    @InjectRepository(ClientDebitConfigurationEntity)
    private readonly clientConfigRepo: Repository<ClientDebitConfigurationEntity>,
    @InjectRepository(CompanyDebitConfigurationEntity)
    private readonly companyConfigRepo: Repository<CompanyDebitConfigurationEntity>,
    @InjectRepository(SystemDebitConfigurationEntity)
    private readonly systemConfigRepo: Repository<SystemDebitConfigurationEntity>,
  ) {}

  /**
   * Resolves the debit configuration following priority:
   * Contract > Client > Company > System
   * 
   * @throws ConfigurationError if no configuration is found at any level
   */
  async resolve(input: ResolveConfigInput): Promise<ResolvedConfig> {
    // Level 1: Contract-specific configuration (highest priority)
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

    // Level 2: Client-specific configuration
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

    // Level 3: Company-specific configuration
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

    // Level 4: System default (lowest priority, fallback)
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

    // No configuration found at any level
    throw new ConfigurationError(
      'NO_CONFIGURATION_FOUND',
      `No active debit configuration found for organisation ${input.organisationId}`,
      {
        organisationId: input.organisationId,
        contratId: input.contratId,
        clientId: input.clientId,
        societeId: input.societeId,
        checkedLevels: ['contract', 'client', 'company', 'system'],
      },
    );
  }

  /**
   * Gets all applicable configurations for debugging/tracing purposes
   */
  async getResolutionTrace(input: ResolveConfigInput): Promise<{
    contractConfig?: ContractDebitConfigurationEntity;
    clientConfig?: ClientDebitConfigurationEntity;
    companyConfig?: CompanyDebitConfigurationEntity;
    systemConfig?: SystemDebitConfigurationEntity;
    resolvedLevel: ConfigurationLevel | null;
  }> {
    const results: {
      contractConfig?: ContractDebitConfigurationEntity;
      clientConfig?: ClientDebitConfigurationEntity;
      companyConfig?: CompanyDebitConfigurationEntity;
      systemConfig?: SystemDebitConfigurationEntity;
      resolvedLevel: ConfigurationLevel | null;
    } = {
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
        if (!results.resolvedLevel) results.resolvedLevel = 'contract';
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
        if (!results.resolvedLevel) results.resolvedLevel = 'client';
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
        if (!results.resolvedLevel) results.resolvedLevel = 'company';
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
      if (!results.resolvedLevel) results.resolvedLevel = 'system';
    }

    return results;
  }

  private mapToResolvedConfig(
    config: ContractDebitConfigurationEntity | ClientDebitConfigurationEntity | CompanyDebitConfigurationEntity,
    level: 'contract' | 'client' | 'company',
  ): ResolvedConfig {
    if (!config.holidayZoneId) {
      throw new ConfigurationError(
        'HOLIDAY_ZONE_REQUIRED',
        `Holiday zone is required but not configured at ${level} level`,
        { configId: config.id, level },
      );
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

  private mapSystemToResolvedConfig(config: SystemDebitConfigurationEntity): ResolvedConfig {
    if (!config.holidayZoneId) {
      throw new ConfigurationError(
        'HOLIDAY_ZONE_REQUIRED',
        'Holiday zone is required but not configured at system level',
        { configId: config.id, level: 'system' },
      );
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
}

import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ConfigurationService } from '../../persistence/typeorm/repositories/calendar/configuration.service';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from '../../../domain/calendar/entities';
import {
  ConfigurationLevel,
  DateShiftStrategy as ProtoDateShiftStrategy,
  DebitBatch as ProtoDebitBatch,
  DebitDateMode as ProtoDebitDateMode,
  GetSystemConfigRequest,
  UpdateSystemConfigRequest,
  CreateContractConfigRequest,
  UpdateContractConfigRequest,
  GetContractConfigRequest,
  DeleteContractConfigRequest,
  ListContractConfigsRequest,
  ResolveConfigurationRequest,
} from '@proto/calendar';

@Controller()
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @GrpcMethod('CalendarConfigurationService', 'GetSystemConfig')
  async getSystemConfig(data: GetSystemConfigRequest) {
    return this.configurationService.getSystemConfig(data.organisation_id);
  }

  @GrpcMethod('CalendarConfigurationService', 'UpdateSystemConfig')
  async updateSystemConfig(data: UpdateSystemConfigRequest) {
    return this.configurationService.updateSystemConfig(data.organisation_id, {
      defaultMode: this.toDomainDebitDateMode(data.default_mode),
      defaultBatch: this.toDomainDebitBatch(data.default_batch),
      defaultFixedDay: data.default_fixed_day,
      shiftStrategy: this.toDomainDateShiftStrategy(data.shift_strategy),
      holidayZoneId: data.holiday_zone_id || undefined,
      cutoffConfigId: data.cutoff_config_id || undefined,
    });
  }

  @GrpcMethod('DebitConfigurationService', 'CreateContractConfig')
  async createContractConfig(data: CreateContractConfigRequest) {
    const config = await this.configurationService.createContractConfig({
      organisationId: data.organisation_id,
      contratId: data.contrat_id,
      mode: this.toDomainDebitDateMode(data.mode),
      batch: this.toDomainDebitBatch(data.batch),
      fixedDay: data.fixed_day || undefined,
      shiftStrategy: this.toDomainDateShiftStrategy(data.shift_strategy),
      holidayZoneId: data.holiday_zone_id || undefined,
    });
    return this.toProtoContractConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'UpdateContractConfig')
  async updateContractConfig(data: UpdateContractConfigRequest) {
    const config = await this.configurationService.updateContractConfig(data.id, {
      mode: this.toDomainDebitDateMode(data.mode),
      batch: this.toDomainDebitBatch(data.batch),
      fixedDay: data.fixed_day || undefined,
      shiftStrategy: this.toDomainDateShiftStrategy(data.shift_strategy),
      holidayZoneId: data.holiday_zone_id || undefined,
      isActive: data.is_active,
    });
    return this.toProtoContractConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'GetContractConfig')
  async getContractConfig(data: GetContractConfigRequest) {
    const config = await this.configurationService.getContractConfigById(data.id);
    if (!config) {
      throw new Error(`Contract config ${data.id} not found`);
    }
    return this.toProtoContractConfig(config);
  }

  @GrpcMethod('DebitConfigurationService', 'DeleteContractConfig')
  async deleteContractConfig(data: DeleteContractConfigRequest) {
    return this.configurationService.deleteContractConfig(data.id);
  }

  @GrpcMethod('DebitConfigurationService', 'ListContractConfigs')
  async listContractConfigs(data: ListContractConfigsRequest) {
    const { configs, total } = await this.configurationService.listContractConfigs(
      data.organisation_id,
      data.contrat_id || undefined,
      data.pagination ? { page: data.pagination.page, limit: data.pagination.limit } : undefined,
    );
    const page = data.pagination?.page || 1;
    const limit = data.pagination?.limit || 20;
    return {
      configs: configs.map((c) => this.toProtoContractConfig(c)),
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  @GrpcMethod('DebitConfigurationService', 'ResolveConfiguration')
  async resolveConfiguration(data: ResolveConfigurationRequest) {
    const contractConfig = data.contrat_id
      ? await this.configurationService.getContractConfig(data.contrat_id)
      : null;

    if (contractConfig) {
      return {
        applied_level: ConfigurationLevel.CONFIGURATION_LEVEL_CONTRACT,
        applied_config_id: contractConfig.id,
        mode: this.toProtoDebitDateMode(contractConfig.mode),
        batch: this.toProtoDebitBatch(contractConfig.batch),
        fixed_day: contractConfig.fixedDay || 0,
        shift_strategy: this.toProtoDateShiftStrategy(contractConfig.shiftStrategy),
        holiday_zone_id: contractConfig.holidayZoneId || '',
        cutoff_config_id: '',
      };
    }

    return {
      applied_level: ConfigurationLevel.CONFIGURATION_LEVEL_UNSPECIFIED,
      applied_config_id: '',
      mode: ProtoDebitDateMode.DEBIT_DATE_MODE_UNSPECIFIED,
      batch: ProtoDebitBatch.DEBIT_BATCH_UNSPECIFIED,
      fixed_day: 0,
      shift_strategy: ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_UNSPECIFIED,
      holiday_zone_id: '',
      cutoff_config_id: '',
    };
  }

  private toProtoContractConfig(config: any) {
    return {
      id: config.id,
      organisation_id: config.organisationId,
      contrat_id: config.contratId,
      mode: this.toProtoDebitDateMode(config.mode),
      batch: this.toProtoDebitBatch(config.batch),
      fixed_day: config.fixedDay || 0,
      shift_strategy: this.toProtoDateShiftStrategy(config.shiftStrategy),
      holiday_zone_id: config.holidayZoneId || '',
      is_active: config.isActive,
      created_at: config.createdAt?.toISOString?.() || '',
      updated_at: config.updatedAt?.toISOString?.() || '',
    };
  }

  private toProtoDebitDateMode(mode: DebitDateMode): ProtoDebitDateMode {
    switch (mode) {
      case DebitDateMode.FIXED_DAY:
        return ProtoDebitDateMode.DEBIT_DATE_MODE_FIXED_DAY;
      case DebitDateMode.BATCH:
        return ProtoDebitDateMode.DEBIT_DATE_MODE_BATCH;
      default:
        return ProtoDebitDateMode.DEBIT_DATE_MODE_UNSPECIFIED;
    }
  }

  private toProtoDebitBatch(batch: DebitBatch | undefined | null): ProtoDebitBatch {
    switch (batch) {
      case DebitBatch.L1:
        return ProtoDebitBatch.DEBIT_BATCH_L1;
      case DebitBatch.L2:
        return ProtoDebitBatch.DEBIT_BATCH_L2;
      case DebitBatch.L3:
        return ProtoDebitBatch.DEBIT_BATCH_L3;
      case DebitBatch.L4:
        return ProtoDebitBatch.DEBIT_BATCH_L4;
      default:
        return ProtoDebitBatch.DEBIT_BATCH_UNSPECIFIED;
    }
  }

  private toProtoDateShiftStrategy(strategy: DateShiftStrategy): ProtoDateShiftStrategy {
    switch (strategy) {
      case DateShiftStrategy.NEXT_BUSINESS_DAY:
        return ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_NEXT_BUSINESS_DAY;
      case DateShiftStrategy.PREVIOUS_BUSINESS_DAY:
        return ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_PREVIOUS_BUSINESS_DAY;
      case DateShiftStrategy.NEXT_WEEK_SAME_DAY:
        return ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_NEXT_WEEK_SAME_DAY;
      default:
        return ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_UNSPECIFIED;
    }
  }

  private toDomainDebitDateMode(mode: ProtoDebitDateMode): DebitDateMode {
    switch (mode) {
      case ProtoDebitDateMode.DEBIT_DATE_MODE_FIXED_DAY:
        return DebitDateMode.FIXED_DAY;
      case ProtoDebitDateMode.DEBIT_DATE_MODE_BATCH:
      default:
        return DebitDateMode.BATCH;
    }
  }

  private toDomainDebitBatch(batch: ProtoDebitBatch): DebitBatch | undefined {
    switch (batch) {
      case ProtoDebitBatch.DEBIT_BATCH_L1:
        return DebitBatch.L1;
      case ProtoDebitBatch.DEBIT_BATCH_L2:
        return DebitBatch.L2;
      case ProtoDebitBatch.DEBIT_BATCH_L3:
        return DebitBatch.L3;
      case ProtoDebitBatch.DEBIT_BATCH_L4:
        return DebitBatch.L4;
      default:
        return undefined;
    }
  }

  private toDomainDateShiftStrategy(strategy: ProtoDateShiftStrategy): DateShiftStrategy {
    switch (strategy) {
      case ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_PREVIOUS_BUSINESS_DAY:
        return DateShiftStrategy.PREVIOUS_BUSINESS_DAY;
      case ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_NEXT_WEEK_SAME_DAY:
        return DateShiftStrategy.NEXT_WEEK_SAME_DAY;
      case ProtoDateShiftStrategy.DATE_SHIFT_STRATEGY_NEXT_BUSINESS_DAY:
      default:
        return DateShiftStrategy.NEXT_BUSINESS_DAY;
    }
  }
}

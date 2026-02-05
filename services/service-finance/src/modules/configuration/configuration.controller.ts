import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

import { ConfigurationService } from './configuration.service';
import { ConfigurationResolverService } from './configuration-resolver.service';
import { DebitDateMode, DebitBatch, DateShiftStrategy } from './entities/system-debit-configuration.entity';

const protoToMode = (n: number): DebitDateMode =>
  n === 2 ? DebitDateMode.FIXED_DAY : DebitDateMode.BATCH;

const protoToBatch = (n: number): DebitBatch | undefined => {
  const map: Record<number, DebitBatch> = { 1: DebitBatch.L1, 2: DebitBatch.L2, 3: DebitBatch.L3, 4: DebitBatch.L4 };
  return map[n];
};

const protoToShiftStrategy = (n: number): DateShiftStrategy => {
  const map: Record<number, DateShiftStrategy> = {
    1: DateShiftStrategy.NEXT_BUSINESS_DAY,
    2: DateShiftStrategy.PREVIOUS_BUSINESS_DAY,
    3: DateShiftStrategy.NEXT_WEEK_SAME_DAY,
  };
  return map[n] ?? DateShiftStrategy.NEXT_BUSINESS_DAY;
};

@Controller()
export class ConfigurationController {
  constructor(
    private readonly configService: ConfigurationService,
    private readonly configResolver: ConfigurationResolverService,
  ) {}

  @GrpcMethod('DebitConfigurationService', 'ResolveConfiguration')
  async resolveConfiguration(req: {
    organisationId: string;
    contratId?: string;
    clientId?: string;
    societeId?: string;
  }) {
    try {
      const resolved = await this.configResolver.resolve({
        organisationId: req.organisationId,
        contratId: req.contratId,
        clientId: req.clientId,
        societeId: req.societeId,
      });
      return resolved;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'GetSystemConfig')
  async getSystemConfig(req: { organisationId: string }) {
    try {
      const config = await this.configService.getSystemConfig(req.organisationId);
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'UpdateSystemConfig')
  async updateSystemConfig(req: {
    organisationId: string;
    defaultMode: number;
    defaultBatch: number;
    defaultFixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
    cutoffConfigId: string;
  }) {
    try {
      const config = await this.configService.updateSystemConfig(
        req.organisationId,
        {
          defaultMode: protoToMode(req.defaultMode),
          defaultBatch: req.defaultBatch ? protoToBatch(req.defaultBatch) : undefined,
          defaultFixedDay: req.defaultFixedDay || undefined,
          shiftStrategy: protoToShiftStrategy(req.shiftStrategy),
          holidayZoneId: req.holidayZoneId || undefined,
          cutoffConfigId: req.cutoffConfigId || undefined,
        },
        'system',
      );
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'CreateCompanyConfig')
  async createCompanyConfig(req: {
    organisationId: string;
    societeId: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
    cutoffConfigId: string;
  }) {
    try {
      const config = await this.configService.createCompanyConfig(
        req.organisationId,
        req.societeId,
        {
          mode: protoToMode(req.mode),
          batch: req.batch ? protoToBatch(req.batch) : undefined,
          fixedDay: req.fixedDay || undefined,
          shiftStrategy: protoToShiftStrategy(req.shiftStrategy),
          holidayZoneId: req.holidayZoneId || undefined,
          cutoffConfigId: req.cutoffConfigId || undefined,
        },
        'system',
      );
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'UpdateCompanyConfig')
  async updateCompanyConfig(req: {
    id: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
    cutoffConfigId: string;
    isActive: boolean;
  }) {
    try {
      const config = await this.configService.updateCompanyConfig(
        req.id,
        {
          mode: protoToMode(req.mode),
          batch: req.batch ? protoToBatch(req.batch) : undefined,
          fixedDay: req.fixedDay || undefined,
          shiftStrategy: protoToShiftStrategy(req.shiftStrategy),
          holidayZoneId: req.holidayZoneId || undefined,
          cutoffConfigId: req.cutoffConfigId || undefined,
          isActive: req.isActive,
        },
        'system',
      );
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'GetCompanyConfig')
  async getCompanyConfig(req: { id: string }) {
    try {
      const config = await this.configService.getCompanyConfig(req.id);
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'ListCompanyConfigs')
  async listCompanyConfigs(req: {
    organisationId: string;
    societeId?: string;
    pagination?: { page: number; limit: number };
  }) {
    try {
      const result = await this.configService.listCompanyConfigs(
        req.organisationId,
        req.societeId,
        req.pagination,
      );
      return { configs: result.items, pagination: result };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'DeleteCompanyConfig')
  async deleteCompanyConfig(req: { id: string }) {
    try {
      await this.configService.deleteCompanyConfig(req.id, 'system');
      return { success: true, message: 'Company configuration deleted' };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'CreateClientConfig')
  async createClientConfig(req: {
    organisationId: string;
    clientId: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
  }) {
    try {
      const config = await this.configService.createClientConfig(
        req.organisationId,
        req.clientId,
        {
          mode: protoToMode(req.mode),
          batch: req.batch ? protoToBatch(req.batch) : undefined,
          fixedDay: req.fixedDay || undefined,
          shiftStrategy: protoToShiftStrategy(req.shiftStrategy),
          holidayZoneId: req.holidayZoneId || undefined,
        },
        'system',
      );
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'UpdateClientConfig')
  async updateClientConfig(req: {
    id: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
    isActive: boolean;
  }) {
    try {
      const config = await this.configService.updateClientConfig(
        req.id,
        {
          mode: protoToMode(req.mode),
          batch: req.batch ? protoToBatch(req.batch) : undefined,
          fixedDay: req.fixedDay || undefined,
          shiftStrategy: protoToShiftStrategy(req.shiftStrategy),
          holidayZoneId: req.holidayZoneId || undefined,
          isActive: req.isActive,
        },
        'system',
      );
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'GetClientConfig')
  async getClientConfig(req: { id: string }) {
    try {
      const config = await this.configService.getClientConfig(req.id);
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'ListClientConfigs')
  async listClientConfigs(req: {
    organisationId: string;
    clientId?: string;
    pagination?: { page: number; limit: number };
  }) {
    try {
      const result = await this.configService.listClientConfigs(
        req.organisationId,
        req.clientId,
        req.pagination,
      );
      return { configs: result.items, pagination: result };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'DeleteClientConfig')
  async deleteClientConfig(req: { id: string }) {
    try {
      await this.configService.deleteClientConfig(req.id, 'system');
      return { success: true, message: 'Client configuration deleted' };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'CreateContractConfig')
  async createContractConfig(req: {
    organisationId: string;
    contratId: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
  }) {
    try {
      const config = await this.configService.createContractConfig(
        req.organisationId,
        req.contratId,
        {
          mode: protoToMode(req.mode),
          batch: req.batch ? protoToBatch(req.batch) : undefined,
          fixedDay: req.fixedDay || undefined,
          shiftStrategy: protoToShiftStrategy(req.shiftStrategy),
          holidayZoneId: req.holidayZoneId || undefined,
        },
        'system',
      );
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'UpdateContractConfig')
  async updateContractConfig(req: {
    id: string;
    mode: number;
    batch: number;
    fixedDay: number;
    shiftStrategy: number;
    holidayZoneId: string;
    isActive: boolean;
  }) {
    try {
      const config = await this.configService.updateContractConfig(
        req.id,
        {
          mode: protoToMode(req.mode),
          batch: req.batch ? protoToBatch(req.batch) : undefined,
          fixedDay: req.fixedDay || undefined,
          shiftStrategy: protoToShiftStrategy(req.shiftStrategy),
          holidayZoneId: req.holidayZoneId || undefined,
          isActive: req.isActive,
        },
        'system',
      );
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'GetContractConfig')
  async getContractConfig(req: { id: string }) {
    try {
      const config = await this.configService.getContractConfig(req.id);
      return config;
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'ListContractConfigs')
  async listContractConfigs(req: {
    organisationId: string;
    contratId?: string;
    pagination?: { page: number; limit: number };
  }) {
    try {
      const result = await this.configService.listContractConfigs(
        req.organisationId,
        req.contratId,
        req.pagination,
      );
      return { configs: result.items, pagination: result };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }

  @GrpcMethod('DebitConfigurationService', 'DeleteContractConfig')
  async deleteContractConfig(req: { id: string }) {
    try {
      await this.configService.deleteContractConfig(req.id, 'system');
      return { success: true, message: 'Contract configuration deleted' };
    } catch (e: unknown) {
      throw new RpcException({ code: status.INTERNAL, message: e instanceof Error ? e.message : String(e) });
    }
  }
}

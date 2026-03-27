/**
 * Calendar gRPC Client
 *
 * Cross-service client to call service-finance's DebitConfigurationService
 * for contract debit date configuration (jour de prélèvement).
 *
 * Pattern: same as PaymentServiceGrpcClient in subscription-charge.service.ts
 */

import { credentials, type ServiceError } from '@grpc/grpc-js';
import { getServiceUrl, loadGrpcPackage } from '@crm/shared-kernel';
import { Logger } from '@nestjs/common';

// ─── gRPC contract types (mirror proto messages) ───────────────────────────

interface ContractDebitConfigurationGrpc {
  id: string;
  organisation_id: string;
  contrat_id: string;
  mode: string;
  batch: string;
  fixed_day: number;
  shift_strategy: string;
  holiday_zone_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ListContractConfigsGrpcRequest {
  organisation_id: string;
  contrat_id: string;
  pagination?: { page: number; limit: number };
}

interface ListContractConfigsGrpcResponse {
  configs: ContractDebitConfigurationGrpc[];
  pagination?: { total: number; page: number; limit: number; total_pages: number };
}

interface CreateContractConfigGrpcRequest {
  organisation_id: string;
  contrat_id: string;
  mode: string;
  batch: string;
  fixed_day: number;
  shift_strategy: string;
  holiday_zone_id: string;
}

interface UpdateContractConfigGrpcRequest {
  id: string;
  mode: string;
  batch: string;
  fixed_day: number;
  shift_strategy: string;
  holiday_zone_id: string;
  is_active: boolean;
}

interface DebitConfigurationServiceGrpcContract {
  ListContractConfigs(
    request: ListContractConfigsGrpcRequest,
    callback: (error: ServiceError | null, response?: ListContractConfigsGrpcResponse) => void,
  ): void;
  CreateContractConfig(
    request: CreateContractConfigGrpcRequest,
    callback: (error: ServiceError | null, response?: ContractDebitConfigurationGrpc) => void,
  ): void;
  UpdateContractConfig(
    request: UpdateContractConfigGrpcRequest,
    callback: (error: ServiceError | null, response?: ContractDebitConfigurationGrpc) => void,
  ): void;
}

// ─── Date calculation utility ──────────────────────────────────────────────

/**
 * Calculate the next debit date for a given fixed day of month.
 * Simple logic: if today < fixedDay → this month, else → next month.
 */
export function calculateNextDebitDate(fixedDay: number): string {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  if (currentDay < fixedDay) {
    return new Date(currentYear, currentMonth, fixedDay).toISOString().split('T')[0];
  } else {
    return new Date(currentYear, currentMonth + 1, fixedDay).toISOString().split('T')[0];
  }
}

// ─── URL resolution ────────────────────────────────────────────────────────

function resolveCalendarGrpcUrl(): string {
  return (
    process.env.CALENDAR_GRPC_URL ||
    process.env.FINANCE_GRPC_URL ||
    getServiceUrl('calendar')
  );
}

// ─── Client class ──────────────────────────────────────────────────────────

export class CalendarGrpcClient {
  private readonly logger = new Logger(CalendarGrpcClient.name);
  private readonly client: DebitConfigurationServiceGrpcContract;

  constructor(url: string = resolveCalendarGrpcUrl()) {
    const grpcPackage = loadGrpcPackage('calendar');
    const DebitConfigServiceConstructor = grpcPackage?.calendar?.DebitConfigurationService;

    if (!DebitConfigServiceConstructor) {
      throw new Error(
        'DebitConfigurationService gRPC constructor not found in calendar proto package',
      );
    }

    this.client = new DebitConfigServiceConstructor(url, credentials.createInsecure());
  }

  /**
   * Get contract debit config by organisation + contrat ID.
   * Uses ListContractConfigs (not GetContractConfig which takes config ID).
   * Returns first match or null.
   */
  async getContractConfig(
    organisationId: string,
    contratId: string,
  ): Promise<ContractDebitConfigurationGrpc | null> {
    try {
      const response = await new Promise<ListContractConfigsGrpcResponse>((resolve, reject) => {
        this.client.ListContractConfigs(
          {
            organisation_id: organisationId,
            contrat_id: contratId,
            pagination: { page: 1, limit: 1 },
          },
          (error, payload) => {
            if (error) {
              reject(error);
              return;
            }
            if (!payload) {
              reject(new Error('ListContractConfigs returned an empty response'));
              return;
            }
            resolve(payload);
          },
        );
      });

      const configs = response.configs ?? [];
      return configs.length > 0 ? configs[0] : null;
    } catch (error) {
      this.logger.warn(
        `Failed to get contract config for contrat ${contratId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Create a contract debit config with FIXED_DAY mode.
   */
  async createContractConfig(input: {
    organisationId: string;
    contratId: string;
    fixedDay: number;
  }): Promise<ContractDebitConfigurationGrpc> {
    const request: CreateContractConfigGrpcRequest = {
      organisation_id: input.organisationId,
      contrat_id: input.contratId,
      mode: 'DEBIT_DATE_MODE_FIXED_DAY',
      batch: 'DEBIT_BATCH_UNSPECIFIED',
      fixed_day: input.fixedDay,
      shift_strategy: 'DATE_SHIFT_STRATEGY_NEXT_BUSINESS_DAY',
      holiday_zone_id: '',
    };

    return new Promise<ContractDebitConfigurationGrpc>((resolve, reject) => {
      this.client.CreateContractConfig(request, (error, payload) => {
        if (error) {
          reject(error);
          return;
        }
        if (!payload) {
          reject(new Error('CreateContractConfig returned an empty response'));
          return;
        }
        resolve(payload);
      });
    });
  }

  /**
   * Update an existing contract debit config's fixed day.
   */
  async updateContractConfig(
    id: string,
    fixedDay: number,
  ): Promise<ContractDebitConfigurationGrpc> {
    const request: UpdateContractConfigGrpcRequest = {
      id,
      mode: 'DEBIT_DATE_MODE_FIXED_DAY',
      batch: 'DEBIT_BATCH_UNSPECIFIED',
      fixed_day: fixedDay,
      shift_strategy: 'DATE_SHIFT_STRATEGY_NEXT_BUSINESS_DAY',
      holiday_zone_id: '',
      is_active: true,
    };

    return new Promise<ContractDebitConfigurationGrpc>((resolve, reject) => {
      this.client.UpdateContractConfig(request, (error, payload) => {
        if (error) {
          reject(error);
          return;
        }
        if (!payload) {
          reject(new Error('UpdateContractConfig returned an empty response'));
          return;
        }
        resolve(payload);
      });
    });
  }
}

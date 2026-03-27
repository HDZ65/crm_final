import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { CfastClientPushService } from '../../../domain/cfast/services/cfast-client-push.service';
import { CfastContractPushService } from '../../../domain/cfast/services/cfast-contract-push.service';
import { CfastSubscriptionPushService } from '../../../domain/cfast/services/cfast-subscription-push.service';
import { CfastInvoiceSyncSchedulerService } from '../../scheduling/cfast-invoice-sync-scheduler.service';
import { CfastConfigService } from '../../persistence/typeorm/repositories/cfast/cfast-config.service';
import { CfastEntityMappingService } from '../../persistence/typeorm/repositories/cfast/cfast-entity-mapping.service';

// Helper: read proto fields in both camelCase and snake_case (keepCase:true sends snake_case)
function readProtoField(data: Record<string, unknown>, camel: string, snake: string): string | undefined {
  const val = data[camel] ?? data[snake];
  return typeof val === 'string' ? val : undefined;
}

@Controller()
export class CfastPushController {
  private readonly logger = new Logger(CfastPushController.name);

  constructor(
    private readonly cfastClientPushService: CfastClientPushService,
    private readonly cfastContractPushService: CfastContractPushService,
    private readonly cfastSubscriptionPushService: CfastSubscriptionPushService,
    private readonly cfastInvoiceSyncSchedulerService: CfastInvoiceSyncSchedulerService,
    private readonly cfastConfigService: CfastConfigService,
    private readonly cfastEntityMappingService: CfastEntityMappingService,
  ) {}

  @GrpcMethod('CfastPushService', 'PushClientToCfast')
  async pushClientToCfast(data: Record<string, unknown>) {
    const organisationId = readProtoField(data, 'organisationId', 'organisation_id');
    const clientId = readProtoField(data, 'clientId', 'client_id');
    if (!organisationId || !clientId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id and client_id are required',
      });
    }

    try {
      const result = await this.cfastClientPushService.pushClient(organisationId as string, clientId as string);
      return {
        cfast_customer_id: result.cfastCustomerId,
        success: true,
        error_message: '',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`PushClientToCfast failed: ${message}`);
      return {
        cfast_customer_id: '',
        success: false,
        error_message: message,
      };
    }
  }

  @GrpcMethod('CfastPushService', 'PushContractToCfast')
  async pushContractToCfast(data: Record<string, unknown>) {
    const organisationId = readProtoField(data, 'organisationId', 'organisation_id');
    const contratId = readProtoField(data, 'contratId', 'contrat_id');
    if (!organisationId || !contratId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id and contrat_id are required',
      });
    }

    try {
      const result = await this.cfastContractPushService.pushContract(organisationId as string, contratId as string);
      return {
        cfast_contract_id: result.cfastContractId,
        success: true,
        error_message: '',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`PushContractToCfast failed: ${message}`);
      return {
        cfast_contract_id: '',
        success: false,
        error_message: message,
      };
    }
  }

  @GrpcMethod('CfastPushService', 'AssignSubscriptionInCfast')
  async assignSubscriptionInCfast(data: Record<string, unknown>) {
    const organisationId = readProtoField(data, 'organisationId', 'organisation_id');
    const contratId = readProtoField(data, 'contratId', 'contrat_id');
    if (!organisationId || !contratId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id and contrat_id are required',
      });
    }

    try {
      const result = await this.cfastSubscriptionPushService.assignSubscription(organisationId as string, contratId as string);
      return {
        cfast_service_id: result.cfastServiceId,
        success: true,
        error_message: '',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`AssignSubscriptionInCfast failed: ${message}`);
      return {
        cfast_service_id: '',
        success: false,
        error_message: message,
      };
    }
  }

  @GrpcMethod('CfastPushService', 'SyncUnpaidInvoices')
  async syncUnpaidInvoices(data: Record<string, unknown>) {
    const organisationId = readProtoField(data, 'organisationId', 'organisation_id');
    if (!organisationId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    try {
      await this.cfastInvoiceSyncSchedulerService.syncOrganisation(organisationId as string);
      return {
        success: true,
        message: 'Unpaid invoice sync completed successfully',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`SyncUnpaidInvoices failed: ${message}`);
      return {
        success: false,
        message: `Sync failed: ${message}`,
      };
    }
  }

  @GrpcMethod('CfastPushService', 'GetCfastSyncStatus')
  async getCfastSyncStatus(data: Record<string, unknown>) {
    const organisationId = readProtoField(data, 'organisationId', 'organisation_id');
    if (!organisationId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    try {
      const config = await this.cfastConfigService.findByOrganisationId(organisationId as string);
      if (!config) {
        return {
          last_sync_at: '',
          last_imported_count: 0,
          sync_error: 'Configuration not found',
          is_connected: false,
        };
      }

      return {
        last_sync_at: config.lastSyncAt?.toISOString() ?? '',
        last_imported_count: config.lastImportedCount ?? 0,
        sync_error: config.syncError ?? '',
        is_connected: config.active,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`GetCfastSyncStatus failed: ${message}`);
      throw new RpcException({ code: status.INTERNAL, message });
    }
  }

  @GrpcMethod('CfastPushService', 'GetCfastEntityMappings')
  async getCfastEntityMappings(data: Record<string, unknown>) {
    const organisationId = readProtoField(data, 'organisationId', 'organisation_id');
    if (!organisationId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    try {
      const mappings = await this.cfastEntityMappingService.findAllByOrg(organisationId as string);
      return {
        mappings: mappings.map((m) => ({
          crm_entity_type: m.crmEntityType,
          crm_entity_id: m.crmEntityId,
          cfast_entity_type: m.cfastEntityType,
          cfast_entity_id: m.cfastEntityId,
          metadata_json: JSON.stringify(m.metadata ?? {}),
        })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`GetCfastEntityMappings failed: ${message}`);
      throw new RpcException({ code: status.INTERNAL, message });
    }
  }
}

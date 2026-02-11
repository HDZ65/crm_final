import { status } from '@grpc/grpc-js';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import {
  WinLeadPlusSyncService,
  type SaveWinLeadPlusConfigInput,
} from './services/winleadplus-sync.service';
import { WinLeadPlusSyncStatus } from './entities/winleadplus-sync-log.entity';

interface SyncProspectsRequest {
  organisation_id: string;
  dry_run?: boolean;
}

interface GetSyncStatusRequest {
  organisation_id: string;
}

interface ListWinLeadPlusSyncLogsRequest {
  organisation_id: string;
  limit?: number;
}

interface TestConnectionRequest {
  organisation_id: string;
  api_endpoint?: string;
}

interface GetWinLeadPlusConfigRequest {
  organisation_id: string;
}

interface UpdateWinLeadPlusConfigRequest {
  id: string;
  api_endpoint?: string;
  enabled?: boolean;
  sync_interval_minutes?: number;
}

interface RpcMetadata {
  get?: (key: string) => unknown[];
}

@Controller()
export class WinLeadPlusGrpcController {
  private readonly logger = new Logger(WinLeadPlusGrpcController.name);

  constructor(private readonly syncService: WinLeadPlusSyncService) {}

  @GrpcMethod('WinLeadPlusSyncService', 'SyncProspects')
  async syncProspects(data: SyncProspectsRequest, metadata?: RpcMetadata) {
    if (!data.organisation_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    const token = this.extractBearerToken(metadata);
    const syncLog = await this.syncService.syncProspects(
      data.organisation_id,
      Boolean(data.dry_run),
      { token },
    );

    return {
      success: syncLog.status !== WinLeadPlusSyncStatus.FAILED,
      sync_log: this.mapSyncLog(syncLog),
    };
  }

  @GrpcMethod('WinLeadPlusSyncService', 'GetSyncStatus')
  async getSyncStatus(data: GetSyncStatusRequest) {
    if (!data.organisation_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    const syncStatus = await this.syncService.getSyncStatus(data.organisation_id);
    return {
      is_syncing: syncStatus.isSyncing,
      current_sync_id: syncStatus.currentSyncId,
      last_sync_at: syncStatus.lastSyncAt,
    };
  }

  @GrpcMethod('WinLeadPlusSyncService', 'GetSyncLogs')
  async getSyncLogs(data: ListWinLeadPlusSyncLogsRequest) {
    if (!data.organisation_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    const logs = await this.syncService.getSyncLogs(data.organisation_id, data.limit);
    return {
      logs: logs.map((log) => this.mapSyncLog(log)),
    };
  }

  @GrpcMethod('WinLeadPlusSyncService', 'TestConnection')
  async testConnection(data: TestConnectionRequest, metadata?: RpcMetadata) {
    if (!data.organisation_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    const token = this.extractBearerToken(metadata);
    return this.syncService.testConnection(data.organisation_id, {
      token,
      apiEndpoint: data.api_endpoint,
    });
  }

  @GrpcMethod('WinLeadPlusSyncService', 'GetConfig')
  async getConfig(data: GetWinLeadPlusConfigRequest) {
    if (!data.organisation_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    const config = await this.syncService.getConfig(data.organisation_id);
    return this.mapConfig(config);
  }

  @GrpcMethod('WinLeadPlusSyncService', 'HasConfig')
  async hasConfig(data: GetWinLeadPlusConfigRequest) {
    if (!data.organisation_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'organisation_id is required',
      });
    }

    const hasConfig = await this.syncService.hasConfig(data.organisation_id);
    return { enabled: hasConfig };
  }

  @GrpcMethod('WinLeadPlusSyncService', 'SaveConfig')
  async saveConfig(data: UpdateWinLeadPlusConfigRequest) {
    if (!data.id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'id is required',
      });
    }

    const input: SaveWinLeadPlusConfigInput = {
      id: data.id,
      apiEndpoint: data.api_endpoint,
      enabled: data.enabled,
      syncIntervalMinutes: data.sync_interval_minutes,
    };

    const config = await this.syncService.saveConfig(input);
    return this.mapConfig(config);
  }

  private mapSyncLog(log: {
    id: string;
    organisationId: string;
    startedAt: Date;
    finishedAt: Date | null;
    status: string;
    totalProspects: number;
    created: number;
    updated: number;
    skipped: number;
    errors: Record<string, unknown>[];
  }) {
    return {
      id: log.id,
      organisation_id: log.organisationId,
      started_at: log.startedAt.toISOString(),
      finished_at: log.finishedAt ? log.finishedAt.toISOString() : undefined,
      status: log.status,
      total_prospects: log.totalProspects,
      created: log.created,
      updated: log.updated,
      skipped: log.skipped,
      errors: (Array.isArray(log.errors) ? log.errors : []).map((entry) =>
        typeof entry.message === 'string' ? entry.message : JSON.stringify(entry),
      ),
    };
  }

  private mapConfig(config: {
    id: string;
    organisationId: string;
    apiEndpoint: string;
    enabled: boolean;
    syncIntervalMinutes: number;
    lastSyncAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: config.id,
      organisation_id: config.organisationId,
      api_endpoint: config.apiEndpoint,
      enabled: config.enabled,
      sync_interval_minutes: config.syncIntervalMinutes,
      last_sync_at: config.lastSyncAt ? config.lastSyncAt.toISOString() : undefined,
      created_at: config.createdAt.toISOString(),
      updated_at: config.updatedAt.toISOString(),
    };
  }

  private extractBearerToken(metadata?: RpcMetadata): string {
    if (!metadata || typeof metadata.get !== 'function') {
      return '';
    }

    const values = metadata.get('authorization');
    if (!Array.isArray(values) || values.length === 0) {
      return '';
    }

    const raw = values[0];
    const header = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw || '');
    const normalized = header.trim();

    if (!normalized) {
      return '';
    }

    if (/^Bearer\s+/i.test(normalized)) {
      return normalized.replace(/^Bearer\s+/i, '').trim();
    }

    return normalized;
  }
}

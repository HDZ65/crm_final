import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface CfastConfigServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByOrganisation(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  TestConnection(data: Record<string, unknown>): Observable<unknown>;
}

export interface CfastImportServiceClient {
  ImportInvoices(data: Record<string, unknown>): Observable<unknown>;
  GetImportStatus(data: Record<string, unknown>): Observable<unknown>;
}

export interface CfastPushServiceClient {
  PushClientToCfast(data: Record<string, unknown>): Observable<unknown>;
  PushContractToCfast(data: Record<string, unknown>): Observable<unknown>;
  AssignSubscriptionInCfast(data: Record<string, unknown>): Observable<unknown>;
  SyncUnpaidInvoices(data: Record<string, unknown>): Observable<unknown>;
  GetCfastSyncStatus(data: Record<string, unknown>): Observable<unknown>;
  GetCfastEntityMappings(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class CfastGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(CfastGrpcClient.name);
  private cfastConfigService: CfastConfigServiceClient;
  private cfastImportService: CfastImportServiceClient;
  private cfastPushService: CfastPushServiceClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.cfastConfigService =
      this.client.getService<CfastConfigServiceClient>('CfastConfigService');
    this.cfastImportService =
      this.client.getService<CfastImportServiceClient>('CfastImportService');
    this.cfastPushService = this.client.getService<CfastPushServiceClient>('CfastPushService');
  }

  createCfastConfig(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.cfastConfigService.Create(data), this.logger, 'CfastConfigService', 'Create');
  }

  updateCfastConfig(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.cfastConfigService.Update(data), this.logger, 'CfastConfigService', 'Update');
  }

  getCfastConfig(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.cfastConfigService.Get(data), this.logger, 'CfastConfigService', 'Get');
  }

  getCfastConfigByOrganisation(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.cfastConfigService.GetByOrganisation(data),
      this.logger,
      'CfastConfigService',
      'GetByOrganisation',
    );
  }

  deleteCfastConfig(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.cfastConfigService.Delete(data), this.logger, 'CfastConfigService', 'Delete');
  }

  testCfastConnection(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.cfastConfigService.TestConnection(data),
      this.logger,
      'CfastConfigService',
      'TestConnection',
    );
  }

  importInvoices(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.cfastImportService.ImportInvoices(data), this.logger, 'CfastImportService', 'ImportInvoices');
  }

  getImportStatus(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.cfastImportService.GetImportStatus(data),
      this.logger,
      'CfastImportService',
      'GetImportStatus',
    );
  }

  pushClientToCfast(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.cfastPushService.PushClientToCfast(data),
      this.logger,
      'CfastPushService',
      'PushClientToCfast',
    );
  }

  pushContractToCfast(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.cfastPushService.PushContractToCfast(data),
      this.logger,
      'CfastPushService',
      'PushContractToCfast',
    );
  }

  assignSubscriptionInCfast(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.cfastPushService.AssignSubscriptionInCfast(data),
      this.logger,
      'CfastPushService',
      'AssignSubscriptionInCfast',
    );
  }

  syncUnpaidInvoices(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.cfastPushService.SyncUnpaidInvoices(data),
      this.logger,
      'CfastPushService',
      'SyncUnpaidInvoices',
    );
  }

  getCfastSyncStatus(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.cfastPushService.GetCfastSyncStatus(data),
      this.logger,
      'CfastPushService',
      'GetCfastSyncStatus',
    );
  }

  getCfastEntityMappings(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.cfastPushService.GetCfastEntityMappings(data),
      this.logger,
      'CfastPushService',
      'GetCfastEntityMappings',
    );
  }
}

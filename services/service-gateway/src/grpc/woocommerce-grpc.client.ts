import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface WooCommerceWebhookServiceClient {
  ProcessWebhook(data: Record<string, unknown>): Observable<unknown>;
  ListWebhookEvents(data: Record<string, unknown>): Observable<unknown>;
  GetWebhookEvent(data: Record<string, unknown>): Observable<unknown>;
  RetryWebhookEvent(data: Record<string, unknown>): Observable<unknown>;
}

export interface WooCommerceMappingServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByExternalId(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
}

export interface WooCommerceConfigServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetByOrganisation(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  TestConnection(data: Record<string, unknown>): Observable<unknown>;
  ListByOrganisation(data: Record<string, unknown>): Observable<unknown>;
}

// ============================================================================
// GRPC CLIENT
// ============================================================================

@Injectable()
export class WoocommerceGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(WoocommerceGrpcClient.name);
  private webhookService: WooCommerceWebhookServiceClient;
  private mappingService: WooCommerceMappingServiceClient;
  private configService: WooCommerceConfigServiceClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.webhookService =
      this.client.getService<WooCommerceWebhookServiceClient>('WooCommerceWebhookService');
    this.mappingService =
      this.client.getService<WooCommerceMappingServiceClient>('WooCommerceMappingService');
    this.configService =
      this.client.getService<WooCommerceConfigServiceClient>('WooCommerceConfigService');
  }

  // ==================== WEBHOOK SERVICE ====================

  processWebhook(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.webhookService.ProcessWebhook(data),
      this.logger,
      'WooCommerceWebhookService',
      'ProcessWebhook',
    );
  }

  listWebhookEvents(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.webhookService.ListWebhookEvents(data),
      this.logger,
      'WooCommerceWebhookService',
      'ListWebhookEvents',
    );
  }

  getWebhookEvent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.webhookService.GetWebhookEvent(data),
      this.logger,
      'WooCommerceWebhookService',
      'GetWebhookEvent',
    );
  }

  retryWebhookEvent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.webhookService.RetryWebhookEvent(data),
      this.logger,
      'WooCommerceWebhookService',
      'RetryWebhookEvent',
    );
  }

  // ==================== MAPPING SERVICE ====================

  createMapping(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.mappingService.Create(data),
      this.logger,
      'WooCommerceMappingService',
      'Create',
    );
  }

  updateMapping(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.mappingService.Update(data),
      this.logger,
      'WooCommerceMappingService',
      'Update',
    );
  }

  getMapping(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.mappingService.Get(data),
      this.logger,
      'WooCommerceMappingService',
      'Get',
    );
  }

  getMappingByExternalId(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.mappingService.GetByExternalId(data),
      this.logger,
      'WooCommerceMappingService',
      'GetByExternalId',
    );
  }

  listMappings(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.mappingService.List(data),
      this.logger,
      'WooCommerceMappingService',
      'List',
    );
  }

  deleteMapping(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.mappingService.Delete(data),
      this.logger,
      'WooCommerceMappingService',
      'Delete',
    );
  }

  // ==================== CONFIG SERVICE ====================

  createConfig(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.configService.Create(data),
      this.logger,
      'WooCommerceConfigService',
      'Create',
    );
  }

  updateConfig(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.configService.Update(data),
      this.logger,
      'WooCommerceConfigService',
      'Update',
    );
  }

  getConfig(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.configService.Get(data),
      this.logger,
      'WooCommerceConfigService',
      'Get',
    );
  }

  getConfigByOrganisation(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.configService.GetByOrganisation(data),
      this.logger,
      'WooCommerceConfigService',
      'GetByOrganisation',
    );
  }

  deleteConfig(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.configService.Delete(data),
      this.logger,
      'WooCommerceConfigService',
      'Delete',
    );
  }

  testConnection(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.configService.TestConnection(data),
      this.logger,
      'WooCommerceConfigService',
      'TestConnection',
    );
  }

  listConfigsByOrganisation(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(
      this.configService.ListByOrganisation(data),
      this.logger,
      'WooCommerceConfigService',
      'ListByOrganisation',
    );
  }
}

/**
 * WooCommerce Service gRPC Client
 * Includes: WooCommerceWebhook, WooCommerceMapping, WooCommerceConfig
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  WooCommerceWebhookServiceService,
  WooCommerceMappingServiceService,
  WooCommerceConfigServiceService,
  type WooCommerceWebhookEvent,
  type ProcessWebhookRequest,
  type ProcessWebhookResponse,
  type ListWebhookEventsRequest,
  type ListWebhookEventsResponse,
  type GetWebhookEventRequest,
  type RetryWebhookEventRequest,
  type WooCommerceMapping,
  type CreateWooCommerceMappingRequest,
  type UpdateWooCommerceMappingRequest,
  type GetWooCommerceMappingRequest,
  type GetWooCommerceMappingByExternalIdRequest,
  type ListWooCommerceMappingRequest,
  type ListWooCommerceMappingResponse,
  type DeleteWooCommerceMappingRequest,
  type WooCommerceConfig,
  type CreateWooCommerceConfigRequest,
  type UpdateWooCommerceConfigRequest,
  type GetWooCommerceConfigRequest,
  type GetWooCommerceConfigByOrganisationRequest,
  type DeleteWooCommerceConfigRequest,
  type TestWooCommerceConnectionRequest,
  type TestWooCommerceConnectionResponse,
  type DeleteResponse as WooCommerceDeleteResponse,
} from "@proto/woocommerce/woocommerce";

// ===== Singleton instances =====
let webhookInstance: GrpcClient | null = null;
let mappingInstance: GrpcClient | null = null;
let configInstance: GrpcClient | null = null;

// ===== Client factories =====

function getWebhookClient(): GrpcClient {
  if (!webhookInstance) {
    webhookInstance = makeClient(
      WooCommerceWebhookServiceService,
      "WooCommerceWebhookService",
      SERVICES.woocommerce,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return webhookInstance;
}

function getMappingClient(): GrpcClient {
  if (!mappingInstance) {
    mappingInstance = makeClient(
      WooCommerceMappingServiceService,
      "WooCommerceMappingService",
      SERVICES.woocommerce,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return mappingInstance;
}

function getConfigClient(): GrpcClient {
  if (!configInstance) {
    configInstance = makeClient(
      WooCommerceConfigServiceService,
      "WooCommerceConfigService",
      SERVICES.woocommerce,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return configInstance;
}

// ===== Exported client objects =====

export const woocommerceWebhooks = {
  processWebhook: (request: ProcessWebhookRequest): Promise<ProcessWebhookResponse> =>
    promisify<ProcessWebhookRequest, ProcessWebhookResponse>(
      getWebhookClient(),
      "processWebhook"
    )(request),

  listEvents: (request: ListWebhookEventsRequest): Promise<ListWebhookEventsResponse> =>
    promisify<ListWebhookEventsRequest, ListWebhookEventsResponse>(
      getWebhookClient(),
      "listWebhookEvents"
    )(request),

  getEvent: (request: GetWebhookEventRequest): Promise<WooCommerceWebhookEvent> =>
    promisify<GetWebhookEventRequest, WooCommerceWebhookEvent>(
      getWebhookClient(),
      "getWebhookEvent"
    )(request),

  retryEvent: (request: RetryWebhookEventRequest): Promise<ProcessWebhookResponse> =>
    promisify<RetryWebhookEventRequest, ProcessWebhookResponse>(
      getWebhookClient(),
      "retryWebhookEvent"
    )(request),
};

export const woocommerceMappings = {
  create: (request: CreateWooCommerceMappingRequest): Promise<WooCommerceMapping> =>
    promisify<CreateWooCommerceMappingRequest, WooCommerceMapping>(
      getMappingClient(),
      "create"
    )(request),

  update: (request: UpdateWooCommerceMappingRequest): Promise<WooCommerceMapping> =>
    promisify<UpdateWooCommerceMappingRequest, WooCommerceMapping>(
      getMappingClient(),
      "update"
    )(request),

  get: (request: GetWooCommerceMappingRequest): Promise<WooCommerceMapping> =>
    promisify<GetWooCommerceMappingRequest, WooCommerceMapping>(
      getMappingClient(),
      "get"
    )(request),

  getByExternalId: (request: GetWooCommerceMappingByExternalIdRequest): Promise<WooCommerceMapping> =>
    promisify<GetWooCommerceMappingByExternalIdRequest, WooCommerceMapping>(
      getMappingClient(),
      "getByExternalId"
    )(request),

  list: (request: ListWooCommerceMappingRequest): Promise<ListWooCommerceMappingResponse> =>
    promisify<ListWooCommerceMappingRequest, ListWooCommerceMappingResponse>(
      getMappingClient(),
      "list"
    )(request),

  delete: (request: DeleteWooCommerceMappingRequest): Promise<WooCommerceDeleteResponse> =>
    promisify<DeleteWooCommerceMappingRequest, WooCommerceDeleteResponse>(
      getMappingClient(),
      "delete"
    )(request),
};

export const woocommerceConfig = {
  create: (request: CreateWooCommerceConfigRequest): Promise<WooCommerceConfig> =>
    promisify<CreateWooCommerceConfigRequest, WooCommerceConfig>(
      getConfigClient(),
      "create"
    )(request),

  update: (request: UpdateWooCommerceConfigRequest): Promise<WooCommerceConfig> =>
    promisify<UpdateWooCommerceConfigRequest, WooCommerceConfig>(
      getConfigClient(),
      "update"
    )(request),

  get: (request: GetWooCommerceConfigRequest): Promise<WooCommerceConfig> =>
    promisify<GetWooCommerceConfigRequest, WooCommerceConfig>(
      getConfigClient(),
      "get"
    )(request),

  getByOrganisation: (request: GetWooCommerceConfigByOrganisationRequest): Promise<WooCommerceConfig> =>
    promisify<GetWooCommerceConfigByOrganisationRequest, WooCommerceConfig>(
      getConfigClient(),
      "getByOrganisation"
    )(request),

  delete: (request: DeleteWooCommerceConfigRequest): Promise<WooCommerceDeleteResponse> =>
    promisify<DeleteWooCommerceConfigRequest, WooCommerceDeleteResponse>(
      getConfigClient(),
      "delete"
    )(request),

  testConnection: (request: TestWooCommerceConnectionRequest): Promise<TestWooCommerceConnectionResponse> =>
    promisify<TestWooCommerceConnectionRequest, TestWooCommerceConnectionResponse>(
      getConfigClient(),
      "testConnection"
    )(request),
};

// Re-export types for convenience
export type {
  WooCommerceWebhookEvent,
  ProcessWebhookRequest,
  ProcessWebhookResponse,
  ListWebhookEventsRequest,
  ListWebhookEventsResponse,
  WooCommerceMapping,
  CreateWooCommerceMappingRequest,
  UpdateWooCommerceMappingRequest,
  ListWooCommerceMappingRequest,
  ListWooCommerceMappingResponse,
  WooCommerceConfig,
  CreateWooCommerceConfigRequest,
  UpdateWooCommerceConfigRequest,
  TestWooCommerceConnectionResponse,
  WooCommerceDeleteResponse,
};

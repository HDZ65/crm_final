/**
 * CFAST Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  CfastConfigServiceService,
  CfastImportServiceService,
  CfastPushServiceService,
  type CfastConfig,
  type CreateCfastConfigRequest,
  type UpdateCfastConfigRequest,
  type GetCfastConfigByOrganisationRequest,
  type DeleteCfastConfigRequest,
  type TestCfastConnectionRequest,
  type TestCfastConnectionResponse,
  type ImportInvoicesRequest,
  type ImportInvoicesResponse,
  type DeleteResponse,
  type PushClientRequest,
  type PushClientResponse,
  type PushContractRequest,
  type PushContractResponse,
  type AssignSubscriptionRequest,
  type AssignSubscriptionResponse,
  type SyncUnpaidInvoicesRequest,
  type SyncUnpaidInvoicesResponse,
  type GetSyncStatusRequest as CfastGetSyncStatusRequest,
  type GetSyncStatusResponse as CfastGetSyncStatusResponse,
  type GetEntityMappingsRequest,
  type GetEntityMappingsResponse,
} from "@proto/cfast/cfast";

// CFAST Config Service Client
let cfastConfigInstance: GrpcClient | null = null;

function getCfastConfigClient(): GrpcClient {
  if (!cfastConfigInstance) {
    cfastConfigInstance = makeClient(
      CfastConfigServiceService,
      "CfastConfigService",
      SERVICES.commerciaux,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return cfastConfigInstance;
}

export const cfastConfig = {
  create: (request: CreateCfastConfigRequest): Promise<CfastConfig> =>
    promisify<CreateCfastConfigRequest, CfastConfig>(
      getCfastConfigClient(),
      "create"
    )(request),

  update: (request: UpdateCfastConfigRequest): Promise<CfastConfig> =>
    promisify<UpdateCfastConfigRequest, CfastConfig>(
      getCfastConfigClient(),
      "update"
    )(request),

  getByOrganisation: (
    request: GetCfastConfigByOrganisationRequest
  ): Promise<CfastConfig> =>
    promisify<GetCfastConfigByOrganisationRequest, CfastConfig>(
      getCfastConfigClient(),
      "getByOrganisation"
    )(request),

  delete: (request: DeleteCfastConfigRequest): Promise<DeleteResponse> =>
    promisify<DeleteCfastConfigRequest, DeleteResponse>(
      getCfastConfigClient(),
      "delete"
    )(request),

  testConnection: (
    request: TestCfastConnectionRequest
  ): Promise<TestCfastConnectionResponse> =>
    promisify<TestCfastConnectionRequest, TestCfastConnectionResponse>(
      getCfastConfigClient(),
      "testConnection"
    )(request),
};

// CFAST Import Service Client
let cfastImportInstance: GrpcClient | null = null;

function getCfastImportClient(): GrpcClient {
  if (!cfastImportInstance) {
    cfastImportInstance = makeClient(
      CfastImportServiceService,
      "CfastImportService",
      SERVICES.commerciaux,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return cfastImportInstance;
}

export const cfastImport = {
  importInvoices: (
    request: ImportInvoicesRequest
  ): Promise<ImportInvoicesResponse> =>
    promisify<ImportInvoicesRequest, ImportInvoicesResponse>(
      getCfastImportClient(),
      "importInvoices"
    )(request),
};

// CFAST Push Service Client
let cfastPushInstance: GrpcClient | null = null;

function getCfastPushClient(): GrpcClient {
  if (!cfastPushInstance) {
    cfastPushInstance = makeClient(
      CfastPushServiceService,
      "CfastPushService",
      SERVICES.commerciaux,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return cfastPushInstance;
}

export const cfastPush = {
  pushClientToCfast: (
    request: PushClientRequest
  ): Promise<PushClientResponse> =>
    promisify<PushClientRequest, PushClientResponse>(
      getCfastPushClient(),
      "pushClientToCfast"
    )(request),

  pushContractToCfast: (
    request: PushContractRequest
  ): Promise<PushContractResponse> =>
    promisify<PushContractRequest, PushContractResponse>(
      getCfastPushClient(),
      "pushContractToCfast"
    )(request),

  assignSubscriptionInCfast: (
    request: AssignSubscriptionRequest
  ): Promise<AssignSubscriptionResponse> =>
    promisify<AssignSubscriptionRequest, AssignSubscriptionResponse>(
      getCfastPushClient(),
      "assignSubscriptionInCfast"
    )(request),

  syncUnpaidInvoices: (
    request: SyncUnpaidInvoicesRequest
  ): Promise<SyncUnpaidInvoicesResponse> =>
    promisify<SyncUnpaidInvoicesRequest, SyncUnpaidInvoicesResponse>(
      getCfastPushClient(),
      "syncUnpaidInvoices"
    )(request),

  getCfastSyncStatus: (
    request: CfastGetSyncStatusRequest
  ): Promise<CfastGetSyncStatusResponse> =>
    promisify<CfastGetSyncStatusRequest, CfastGetSyncStatusResponse>(
      getCfastPushClient(),
      "getCfastSyncStatus"
    )(request),

  getCfastEntityMappings: (
    request: GetEntityMappingsRequest
  ): Promise<GetEntityMappingsResponse> =>
    promisify<GetEntityMappingsRequest, GetEntityMappingsResponse>(
      getCfastPushClient(),
      "getCfastEntityMappings"
    )(request),
};

// Re-export types for convenience
export type {
  CfastConfig,
  CreateCfastConfigRequest,
  UpdateCfastConfigRequest,
  TestCfastConnectionResponse,
  ImportInvoicesResponse,
  PushClientResponse,
  PushContractResponse,
  AssignSubscriptionResponse,
  SyncUnpaidInvoicesResponse,
  GetEntityMappingsResponse,
};

// Re-export with prefixed names to avoid conflicts with winleadplus
export type CfastSyncStatusResponse = CfastGetSyncStatusResponse;

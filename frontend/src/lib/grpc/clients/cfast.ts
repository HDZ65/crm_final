/**
 * CFAST Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  CfastConfigServiceService,
  CfastImportServiceService,
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

// Re-export types for convenience
export type {
  CfastConfig,
  CreateCfastConfigRequest,
  UpdateCfastConfigRequest,
  TestCfastConnectionResponse,
  ImportInvoicesResponse,
};

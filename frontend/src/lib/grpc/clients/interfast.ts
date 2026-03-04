/**
 * InterFast Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import {
  credentials,
  SERVICES,
  promisify,
  makeClient,
  GrpcClient,
} from "./config";
import {
  InterfastConfigServiceService,
  type InterfastConfig,
  type CreateInterfastConfigRequest,
  type UpdateInterfastConfigRequest,
  type GetInterfastConfigByOrganisationRequest,
  type DeleteInterfastConfigRequest,
  type DeleteInterfastResponse,
  type TestInterfastConnectionRequest,
  type TestInterfastConnectionResponse,
  type SaveEnabledRoutesRequest,
  type SaveEnabledRoutesResponse,
  type GetEnabledRoutesRequest,
  type GetEnabledRoutesResponse,
} from "@proto/interfast/interfast";

// InterFast Config Service Client
let interfastConfigInstance: GrpcClient | null = null;

function getInterfastConfigClient(): GrpcClient {
  if (!interfastConfigInstance) {
    interfastConfigInstance = makeClient(
      InterfastConfigServiceService,
      "InterfastConfigService",
      SERVICES.commerciaux, // TODO: update to dedicated service when available
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return interfastConfigInstance;
}

export const interfastConfig = {
  create: (request: CreateInterfastConfigRequest): Promise<InterfastConfig> =>
    promisify<CreateInterfastConfigRequest, InterfastConfig>(
      getInterfastConfigClient(),
      "create"
    )(request),

  update: (request: UpdateInterfastConfigRequest): Promise<InterfastConfig> =>
    promisify<UpdateInterfastConfigRequest, InterfastConfig>(
      getInterfastConfigClient(),
      "update"
    )(request),

  getByOrganisation: (
    request: GetInterfastConfigByOrganisationRequest
  ): Promise<InterfastConfig> =>
    promisify<GetInterfastConfigByOrganisationRequest, InterfastConfig>(
      getInterfastConfigClient(),
      "getByOrganisation"
    )(request),

  delete: (
    request: DeleteInterfastConfigRequest
  ): Promise<DeleteInterfastResponse> =>
    promisify<DeleteInterfastConfigRequest, DeleteInterfastResponse>(
      getInterfastConfigClient(),
      "delete"
    )(request),

  testConnection: (
    request: TestInterfastConnectionRequest
  ): Promise<TestInterfastConnectionResponse> =>
    promisify<TestInterfastConnectionRequest, TestInterfastConnectionResponse>(
      getInterfastConfigClient(),
      "testConnection"
    )(request),

  saveEnabledRoutes: (
    request: SaveEnabledRoutesRequest
  ): Promise<SaveEnabledRoutesResponse> =>
    promisify<SaveEnabledRoutesRequest, SaveEnabledRoutesResponse>(
      getInterfastConfigClient(),
      "saveEnabledRoutes"
    )(request),

  getEnabledRoutes: (
    request: GetEnabledRoutesRequest
  ): Promise<GetEnabledRoutesResponse> =>
    promisify<GetEnabledRoutesRequest, GetEnabledRoutesResponse>(
      getInterfastConfigClient(),
      "getEnabledRoutes"
    )(request),
};

// Re-export types for convenience
export type {
  InterfastConfig,
  CreateInterfastConfigRequest,
  UpdateInterfastConfigRequest,
  TestInterfastConnectionResponse,
  SaveEnabledRoutesResponse,
  GetEnabledRoutesResponse,
};

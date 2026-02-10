/**
 * Wincash Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  WincashSvcService,
  type GetOperationRequest,
  type GetOperationResponse,
  type ListOperationsRequest,
  type ListOperationsResponse,
} from "@proto/services/wincash";

let wincashInstance: GrpcClient | null = null;

function getWincashClient(): GrpcClient {
  if (!wincashInstance) {
    wincashInstance = makeClient(
      WincashSvcService,
      "WincashSvc",
      SERVICES.wincash,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return wincashInstance;
}

export const wincash = {
  getOperation: (request: GetOperationRequest): Promise<GetOperationResponse> =>
    promisify<GetOperationRequest, GetOperationResponse>(
      getWincashClient(),
      "getOperation"
    )(request),

  listOperations: (request: ListOperationsRequest): Promise<ListOperationsResponse> =>
    promisify<ListOperationsRequest, ListOperationsResponse>(
      getWincashClient(),
      "listOperations"
    )(request),
};

// Re-export types for convenience
export type {
  GetOperationRequest,
  GetOperationResponse,
  ListOperationsRequest,
  ListOperationsResponse,
};

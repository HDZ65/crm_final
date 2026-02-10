/**
 * Justi+ Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  JustiPlusSvcService,
  type GetCasRequest,
  type GetCasResponse,
  type ListCasRequest,
  type ListCasResponse,
} from "@proto/services/justi-plus";

let justiPlusInstance: GrpcClient | null = null;

function getJustiPlusClient(): GrpcClient {
  if (!justiPlusInstance) {
    justiPlusInstance = makeClient(
      JustiPlusSvcService,
      "JustiPlusSvc",
      SERVICES.justiPlus,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return justiPlusInstance;
}

export const justiPlus = {
  getCas: (request: GetCasRequest): Promise<GetCasResponse> =>
    promisify<GetCasRequest, GetCasResponse>(
      getJustiPlusClient(),
      "getCas"
    )(request),

  listCas: (request: ListCasRequest): Promise<ListCasResponse> =>
    promisify<ListCasRequest, ListCasResponse>(
      getJustiPlusClient(),
      "listCas"
    )(request),
};

// Re-export types for convenience
export type {
  GetCasRequest,
  GetCasResponse,
  ListCasRequest,
  ListCasResponse,
};

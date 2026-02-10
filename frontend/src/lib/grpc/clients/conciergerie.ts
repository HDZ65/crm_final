/**
 * Conciergerie Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  ConciergerieSvcService,
  type GetDemandeRequest,
  type GetDemandeResponse,
  type ListDemandesRequest,
  type ListDemandesResponse,
  type CreateDemandeRequest,
  type CreateDemandeResponse,
} from "@proto/services/conciergerie";

let conciergerieInstance: GrpcClient | null = null;

function getConciergerieClient(): GrpcClient {
  if (!conciergerieInstance) {
    conciergerieInstance = makeClient(
      ConciergerieSvcService,
      "ConciergerieSvc",
      SERVICES.conciergerie,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return conciergerieInstance;
}

export const conciergerie = {
  getDemande: (request: GetDemandeRequest): Promise<GetDemandeResponse> =>
    promisify<GetDemandeRequest, GetDemandeResponse>(
      getConciergerieClient(),
      "getDemande"
    )(request),

  listDemandes: (request: ListDemandesRequest): Promise<ListDemandesResponse> =>
    promisify<ListDemandesRequest, ListDemandesResponse>(
      getConciergerieClient(),
      "listDemandes"
    )(request),

  createDemande: (request: CreateDemandeRequest): Promise<CreateDemandeResponse> =>
    promisify<CreateDemandeRequest, CreateDemandeResponse>(
      getConciergerieClient(),
      "createDemande"
    )(request),
};

// Re-export types for convenience
export type {
  GetDemandeRequest,
  GetDemandeResponse,
  ListDemandesRequest,
  ListDemandesResponse,
  CreateDemandeRequest,
  CreateDemandeResponse,
};

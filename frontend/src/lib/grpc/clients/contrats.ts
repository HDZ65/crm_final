/**
 * Contrats Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify } from "./config";
import {
  ContratServiceClient,
  type Contrat,
  type CreateContratRequest,
  type UpdateContratRequest,
  type GetContratRequest,
  type ListContratRequest,
  type ListContratResponse,
  type DeleteContratRequest,
  type DeleteResponse as ContratDeleteResponse,
} from "@proto/contrats/contrats";

let contratInstance: ContratServiceClient | null = null;

function getContratClient(): ContratServiceClient {
  if (!contratInstance) {
    contratInstance = new ContratServiceClient(
      SERVICES.contrats,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return contratInstance;
}

export const contrats = {
  create: (request: CreateContratRequest): Promise<Contrat> =>
    promisify<CreateContratRequest, Contrat>(
      getContratClient(),
      "create"
    )(request),

  update: (request: UpdateContratRequest): Promise<Contrat> =>
    promisify<UpdateContratRequest, Contrat>(
      getContratClient(),
      "update"
    )(request),

  get: (request: GetContratRequest): Promise<Contrat> =>
    promisify<GetContratRequest, Contrat>(getContratClient(), "get")(request),

  list: (request: ListContratRequest): Promise<ListContratResponse> =>
    promisify<ListContratRequest, ListContratResponse>(
      getContratClient(),
      "list"
    )(request),

  delete: (request: DeleteContratRequest): Promise<ContratDeleteResponse> =>
    promisify<DeleteContratRequest, ContratDeleteResponse>(
      getContratClient(),
      "delete"
    )(request),
};

// Re-export types for convenience
export type {
  Contrat,
  CreateContratRequest,
  ListContratRequest,
  ListContratResponse,
};

/**
 * Contrats Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  ContratServiceService,
  ContractOrchestrationServiceService,
  type Contrat,
  type CreateContratRequest,
  type UpdateContratRequest,
  type GetContratRequest,
  type ListContratRequest,
  type ListContratResponse,
  type DeleteContratRequest,
  type DeleteResponse as ContratDeleteResponse,
  type OrchestrationRequest,
  type OrchestrationResponse,
} from "@proto/contrats/contrats";

let contratInstance: GrpcClient | null = null;
let orchestrationInstance: GrpcClient | null = null;

function getContratClient(): GrpcClient {
  if (!contratInstance) {
    contratInstance = makeClient(
      ContratServiceService,
      "ContratService",
      SERVICES.contrats,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return contratInstance;
}

function getOrchestrationClient(): GrpcClient {
  if (!orchestrationInstance) {
    orchestrationInstance = makeClient(
      ContractOrchestrationServiceService,
      "ContractOrchestrationService",
      SERVICES.contrats,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return orchestrationInstance;
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

  // Orchestration methods
  activate: (request: OrchestrationRequest): Promise<OrchestrationResponse> =>
    promisify<OrchestrationRequest, OrchestrationResponse>(
      getOrchestrationClient(),
      "activate"
    )(request),

  suspend: (request: OrchestrationRequest): Promise<OrchestrationResponse> =>
    promisify<OrchestrationRequest, OrchestrationResponse>(
      getOrchestrationClient(),
      "suspend"
    )(request),

  terminate: (request: OrchestrationRequest): Promise<OrchestrationResponse> =>
    promisify<OrchestrationRequest, OrchestrationResponse>(
      getOrchestrationClient(),
      "terminate"
    )(request),

  portIn: (request: OrchestrationRequest): Promise<OrchestrationResponse> =>
    promisify<OrchestrationRequest, OrchestrationResponse>(
      getOrchestrationClient(),
      "portIn"
    )(request),
};

// Re-export types for convenience
export type {
  Contrat,
  CreateContratRequest,
  ListContratRequest,
  ListContratResponse,
  OrchestrationRequest,
  OrchestrationResponse,
};

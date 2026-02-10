import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  RegleRelanceServiceService,
  HistoriqueRelanceServiceService,
  RelanceEngineServiceService,
  type RegleRelance,
  type CreateRegleRelanceRequest,
  type UpdateRegleRelanceRequest,
  type GetRegleRelanceRequest,
  type ListReglesRelanceRequest,
  type ListReglesRelanceResponse,
  type DeleteRegleRelanceRequest,
  type DeleteRegleRelanceResponse,
  type ActivateRegleRequest,
  type DeactivateRegleRequest,
  type HistoriqueRelance,
  type ListHistoriquesRelanceRequest,
  type ListHistoriquesRelanceResponse,
  type ExecuteRelancesRequest,
  type ExecuteRelancesResponse,
} from "@proto/relance/relance";

let regleRelanceInstance: GrpcClient | null = null;
let historiqueRelanceInstance: GrpcClient | null = null;
let relanceEngineInstance: GrpcClient | null = null;

function getRegleRelanceClient(): GrpcClient {
  if (!regleRelanceInstance) {
    regleRelanceInstance = makeClient(
      RegleRelanceServiceService,
      "RegleRelanceService",
      SERVICES.relance,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return regleRelanceInstance;
}

function getHistoriqueRelanceClient(): GrpcClient {
  if (!historiqueRelanceInstance) {
    historiqueRelanceInstance = makeClient(
      HistoriqueRelanceServiceService,
      "HistoriqueRelanceService",
      SERVICES.relance,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return historiqueRelanceInstance;
}

function getRelanceEngineClient(): GrpcClient {
  if (!relanceEngineInstance) {
    relanceEngineInstance = makeClient(
      RelanceEngineServiceService,
      "RelanceEngineService",
      SERVICES.relance,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return relanceEngineInstance;
}

export const reglesRelance = {
  create: (request: CreateRegleRelanceRequest): Promise<RegleRelance> =>
    promisify<CreateRegleRelanceRequest, RegleRelance>(
      getRegleRelanceClient(),
      "create"
    )(request),

  update: (request: UpdateRegleRelanceRequest): Promise<RegleRelance> =>
    promisify<UpdateRegleRelanceRequest, RegleRelance>(
      getRegleRelanceClient(),
      "update"
    )(request),

  get: (request: GetRegleRelanceRequest): Promise<RegleRelance> =>
    promisify<GetRegleRelanceRequest, RegleRelance>(
      getRegleRelanceClient(),
      "get"
    )(request),

  list: (request: ListReglesRelanceRequest): Promise<ListReglesRelanceResponse> =>
    promisify<ListReglesRelanceRequest, ListReglesRelanceResponse>(
      getRegleRelanceClient(),
      "list"
    )(request),

  delete: (request: DeleteRegleRelanceRequest): Promise<DeleteRegleRelanceResponse> =>
    promisify<DeleteRegleRelanceRequest, DeleteRegleRelanceResponse>(
      getRegleRelanceClient(),
      "delete"
    )(request),

  activate: (request: ActivateRegleRequest): Promise<RegleRelance> =>
    promisify<ActivateRegleRequest, RegleRelance>(
      getRegleRelanceClient(),
      "activate"
    )(request),

  deactivate: (request: DeactivateRegleRequest): Promise<RegleRelance> =>
    promisify<DeactivateRegleRequest, RegleRelance>(
      getRegleRelanceClient(),
      "deactivate"
    )(request),
};

export const historiqueRelance = {
  list: (request: ListHistoriquesRelanceRequest): Promise<ListHistoriquesRelanceResponse> =>
    promisify<ListHistoriquesRelanceRequest, ListHistoriquesRelanceResponse>(
      getHistoriqueRelanceClient(),
      "list"
    )(request),
};

export const relanceEngine = {
  execute: (request: ExecuteRelancesRequest): Promise<ExecuteRelancesResponse> =>
    promisify<ExecuteRelancesRequest, ExecuteRelancesResponse>(
      getRelanceEngineClient(),
      "executeRelances"
    )(request),
};

export type {
  RegleRelance,
  CreateRegleRelanceRequest,
  UpdateRegleRelanceRequest,
  ListReglesRelanceRequest,
  ListReglesRelanceResponse,
  HistoriqueRelance,
  ListHistoriquesRelanceRequest,
  ListHistoriquesRelanceResponse,
  ExecuteRelancesRequest,
  ExecuteRelancesResponse,
};

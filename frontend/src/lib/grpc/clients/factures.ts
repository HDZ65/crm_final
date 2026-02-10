/**
 * Factures Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  FactureServiceService,
  StatutFactureServiceService,
  type Facture,
  type CreateFactureRequest,
  type UpdateFactureRequest,
  type GetFactureRequest,
  type ListFacturesRequest,
  type ListFacturesResponse,
  type DeleteFactureRequest,
  type DeleteFactureResponse,
  type ValidateFactureRequest,
  type ValidateFactureResponse,
  type FinalizeFactureRequest,
  type StatutFacture,
  type ListStatutsFactureRequest,
  type ListStatutsFactureResponse,
} from "@proto/factures/factures";

// Facture Service Client
let factureInstance: GrpcClient | null = null;

function getFactureClient(): GrpcClient {
  if (!factureInstance) {
    factureInstance = makeClient(
      FactureServiceService,
      "FactureService",
      SERVICES.factures,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return factureInstance;
}

export const factures = {
  create: (request: CreateFactureRequest): Promise<Facture> =>
    promisify<CreateFactureRequest, Facture>(
      getFactureClient(),
      "create"
    )(request),

  update: (request: UpdateFactureRequest): Promise<Facture> =>
    promisify<UpdateFactureRequest, Facture>(
      getFactureClient(),
      "update"
    )(request),

  get: (request: GetFactureRequest): Promise<Facture> =>
    promisify<GetFactureRequest, Facture>(getFactureClient(), "get")(request),

  list: (request: ListFacturesRequest): Promise<ListFacturesResponse> =>
    promisify<ListFacturesRequest, ListFacturesResponse>(
      getFactureClient(),
      "list"
    )(request),

  delete: (request: DeleteFactureRequest): Promise<DeleteFactureResponse> =>
    promisify<DeleteFactureRequest, DeleteFactureResponse>(
      getFactureClient(),
      "delete"
    )(request),

  validate: (request: ValidateFactureRequest): Promise<ValidateFactureResponse> =>
    promisify<ValidateFactureRequest, ValidateFactureResponse>(
      getFactureClient(),
      "validate"
    )(request),

  finalize: (request: FinalizeFactureRequest): Promise<Facture> =>
    promisify<FinalizeFactureRequest, Facture>(
      getFactureClient(),
      "finalize"
    )(request),
};

// Statut Facture Service Client
let statutFactureInstance: GrpcClient | null = null;

function getStatutFactureClient(): GrpcClient {
  if (!statutFactureInstance) {
    statutFactureInstance = makeClient(
      StatutFactureServiceService,
      "StatutFactureService",
      SERVICES.factures,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return statutFactureInstance;
}

export const statutFactures = {
  list: (request: ListStatutsFactureRequest): Promise<ListStatutsFactureResponse> =>
    promisify<ListStatutsFactureRequest, ListStatutsFactureResponse>(
      getStatutFactureClient(),
      "list"
    )(request),
};

// Re-export types for convenience
export type {
  Facture,
  CreateFactureRequest,
  ListFacturesRequest,
  ListFacturesResponse,
  StatutFacture,
  ListStatutsFactureResponse,
};

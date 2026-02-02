/**
 * Factures Service gRPC Client
 */

import { credentials, SERVICES, promisify } from "./config";
import {
  FactureServiceClient,
  StatutFactureServiceClient,
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
let factureInstance: FactureServiceClient | null = null;

function getFactureClient(): FactureServiceClient {
  if (!factureInstance) {
    factureInstance = new FactureServiceClient(
      SERVICES.factures,
      credentials.createInsecure()
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
let statutFactureInstance: StatutFactureServiceClient | null = null;

function getStatutFactureClient(): StatutFactureServiceClient {
  if (!statutFactureInstance) {
    statutFactureInstance = new StatutFactureServiceClient(
      SERVICES.factures,
      credentials.createInsecure()
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

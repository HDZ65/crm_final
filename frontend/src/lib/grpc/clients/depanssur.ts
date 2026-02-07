/**
 * Depanssur gRPC Client
 * Fixed in Wave 3 Task 8 — aligned with standard gRPC client pattern
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  DepanssurServiceService,
  type AbonnementDepanssur,
  type CreateAbonnementRequest,
  type GetAbonnementRequest,
  type GetAbonnementByClientRequest,
  type UpdateAbonnementRequest,
  type ListAbonnementsRequest,
  type ListAbonnementsResponse,
  type CreateDossierRequest,
  type DossierDeclaratif,
  type GetDossierRequest,
  type GetDossierByReferenceRequest,
  type UpdateDossierRequest,
  type ListDossiersRequest,
  type ListDossiersResponse,
  type ListOptionsRequest,
  type ListOptionsResponse,
  type GetCompteurRequest,
  type CompteurPlafond,
} from "@proto/depanssur/depanssur";

let depanssurInstance: GrpcClient | null = null;

function getDepanssurClient(): GrpcClient {
  if (!depanssurInstance) {
    depanssurInstance = makeClient(
      DepanssurServiceService,
      "DepanssurService",
      SERVICES.depanssur,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return depanssurInstance;
}

export const depanssurClient = {
  // ==================== ABONNEMENTS ====================

  createAbonnement: (request: CreateAbonnementRequest): Promise<AbonnementDepanssur> =>
    promisify<CreateAbonnementRequest, AbonnementDepanssur>(
      getDepanssurClient(),
      "createAbonnement"
    )(request),

  getAbonnement: (request: GetAbonnementRequest): Promise<AbonnementDepanssur> =>
    promisify<GetAbonnementRequest, AbonnementDepanssur>(
      getDepanssurClient(),
      "getAbonnement"
    )(request),

  getAbonnementByClient: (request: GetAbonnementByClientRequest): Promise<AbonnementDepanssur> =>
    promisify<GetAbonnementByClientRequest, AbonnementDepanssur>(
      getDepanssurClient(),
      "getAbonnementByClient"
    )(request),

  updateAbonnement: (request: UpdateAbonnementRequest): Promise<AbonnementDepanssur> =>
    promisify<UpdateAbonnementRequest, AbonnementDepanssur>(
      getDepanssurClient(),
      "updateAbonnement"
    )(request),

  listAbonnements: (request: ListAbonnementsRequest): Promise<ListAbonnementsResponse> =>
    promisify<ListAbonnementsRequest, ListAbonnementsResponse>(
      getDepanssurClient(),
      "listAbonnements"
    )(request),

  // ==================== DOSSIERS ====================

  createDossier: (request: CreateDossierRequest): Promise<DossierDeclaratif> =>
    promisify<CreateDossierRequest, DossierDeclaratif>(
      getDepanssurClient(),
      "createDossier"
    )(request),

  getDossier: (request: GetDossierRequest): Promise<DossierDeclaratif> =>
    promisify<GetDossierRequest, DossierDeclaratif>(
      getDepanssurClient(),
      "getDossier"
    )(request),

  getDossierByReference: (request: GetDossierByReferenceRequest): Promise<DossierDeclaratif> =>
    promisify<GetDossierByReferenceRequest, DossierDeclaratif>(
      getDepanssurClient(),
      "getDossierByReference"
    )(request),

  updateDossier: (request: UpdateDossierRequest): Promise<DossierDeclaratif> =>
    promisify<UpdateDossierRequest, DossierDeclaratif>(
      getDepanssurClient(),
      "updateDossier"
    )(request),

  listDossiers: (request: ListDossiersRequest): Promise<ListDossiersResponse> =>
    promisify<ListDossiersRequest, ListDossiersResponse>(
      getDepanssurClient(),
      "listDossiers"
    )(request),

  // ==================== OPTIONS ====================

  listOptions: (request: ListOptionsRequest): Promise<ListOptionsResponse> =>
    promisify<ListOptionsRequest, ListOptionsResponse>(
      getDepanssurClient(),
      "listOptions"
    )(request),

  // ==================== COMPTEURS ====================

  getCurrentCompteur: (request: GetCompteurRequest): Promise<CompteurPlafond> =>
    promisify<GetCompteurRequest, CompteurPlafond>(
      getDepanssurClient(),
      "getCompteur"
    )(request),
};

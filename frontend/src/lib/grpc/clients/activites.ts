import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  TacheServiceService,
  TypeActiviteServiceService,
  ActiviteServiceService,
  EvenementSuiviServiceService,
  type Tache,
  type TacheStats,
  type TacheAlertes,
  type CreateTacheRequest,
  type UpdateTacheRequest,
  type GetTacheRequest,
  type ListTacheRequest,
  type ListTacheByAssigneRequest,
  type ListTacheByClientRequest,
  type ListTacheByContratRequest,
  type ListTacheByFactureRequest,
  type ListTacheEnRetardRequest,
  type GetTacheStatsRequest,
  type GetTacheAlertesRequest,
  type MarquerTacheRequest,
  type ListTacheResponse,
  type DeleteTacheRequest,
  type DeleteResponse as TacheDeleteResponse,
  type TypeActivite,
  type CreateTypeActiviteRequest,
  type UpdateTypeActiviteRequest,
  type GetTypeActiviteRequest,
  type GetTypeActiviteByCodeRequest,
  type ListTypeActiviteRequest,
  type ListTypeActiviteResponse,
  type DeleteTypeActiviteRequest,
  type DeleteResponse as TypeActiviteDeleteResponse,
  type Activite,
  type CreateActiviteRequest,
  type UpdateActiviteRequest,
  type GetActiviteRequest,
  type ListActiviteByClientRequest,
  type ListActiviteByContratRequest,
  type ListActiviteRequest,
  type ListActiviteResponse,
  type DeleteActiviteRequest,
  type DeleteResponse as ActiviteDeleteResponse,
  type EvenementSuivi,
  type CreateEvenementSuiviRequest,
  type UpdateEvenementSuiviRequest,
  type GetEvenementSuiviRequest,
  type ListEvenementByExpeditionRequest,
  type ListEvenementSuiviRequest,
  type ListEvenementSuiviResponse,
  type DeleteEvenementSuiviRequest,
  type DeleteResponse as EvenementSuiviDeleteResponse,
} from "@proto/activites/activites";

let tacheInstance: GrpcClient | null = null;
let typeActiviteInstance: GrpcClient | null = null;
let activiteInstance: GrpcClient | null = null;
let evenementSuiviInstance: GrpcClient | null = null;

function getTacheClient(): GrpcClient {
  if (!tacheInstance) {
    tacheInstance = makeClient(
      TacheServiceService,
      "TacheService",
      SERVICES.activites,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return tacheInstance;
}

function getTypeActiviteClient(): GrpcClient {
  if (!typeActiviteInstance) {
    typeActiviteInstance = makeClient(
      TypeActiviteServiceService,
      "TypeActiviteService",
      SERVICES.activites,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return typeActiviteInstance;
}

function getActiviteClient(): GrpcClient {
  if (!activiteInstance) {
    activiteInstance = makeClient(
      ActiviteServiceService,
      "ActiviteService",
      SERVICES.activites,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return activiteInstance;
}

function getEvenementSuiviClient(): GrpcClient {
  if (!evenementSuiviInstance) {
    evenementSuiviInstance = makeClient(
      EvenementSuiviServiceService,
      "EvenementSuiviService",
      SERVICES.activites,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return evenementSuiviInstance;
}

export const taches = {
  create: (request: CreateTacheRequest): Promise<Tache> =>
    promisify<CreateTacheRequest, Tache>(getTacheClient(), "create")(request),

  update: (request: UpdateTacheRequest): Promise<Tache> =>
    promisify<UpdateTacheRequest, Tache>(getTacheClient(), "update")(request),

  get: (request: GetTacheRequest): Promise<Tache> =>
    promisify<GetTacheRequest, Tache>(getTacheClient(), "get")(request),

  list: (request: ListTacheRequest): Promise<ListTacheResponse> =>
    promisify<ListTacheRequest, ListTacheResponse>(
      getTacheClient(),
      "list"
    )(request),

  listByAssigne: (request: ListTacheByAssigneRequest): Promise<ListTacheResponse> =>
    promisify<ListTacheByAssigneRequest, ListTacheResponse>(
      getTacheClient(),
      "listByAssigne"
    )(request),

  listByClient: (request: ListTacheByClientRequest): Promise<ListTacheResponse> =>
    promisify<ListTacheByClientRequest, ListTacheResponse>(
      getTacheClient(),
      "listByClient"
    )(request),

  listByContrat: (request: ListTacheByContratRequest): Promise<ListTacheResponse> =>
    promisify<ListTacheByContratRequest, ListTacheResponse>(
      getTacheClient(),
      "listByContrat"
    )(request),

  listByFacture: (request: ListTacheByFactureRequest): Promise<ListTacheResponse> =>
    promisify<ListTacheByFactureRequest, ListTacheResponse>(
      getTacheClient(),
      "listByFacture"
    )(request),

  listEnRetard: (request: ListTacheEnRetardRequest): Promise<ListTacheResponse> =>
    promisify<ListTacheEnRetardRequest, ListTacheResponse>(
      getTacheClient(),
      "listEnRetard"
    )(request),

  getStats: (request: GetTacheStatsRequest): Promise<TacheStats> =>
    promisify<GetTacheStatsRequest, TacheStats>(
      getTacheClient(),
      "getStats"
    )(request),

  getAlertes: (request: GetTacheAlertesRequest): Promise<TacheAlertes> =>
    promisify<GetTacheAlertesRequest, TacheAlertes>(
      getTacheClient(),
      "getAlertes"
    )(request),

  marquerEnCours: (request: MarquerTacheRequest): Promise<Tache> =>
    promisify<MarquerTacheRequest, Tache>(
      getTacheClient(),
      "marquerEnCours"
    )(request),

  marquerTerminee: (request: MarquerTacheRequest): Promise<Tache> =>
    promisify<MarquerTacheRequest, Tache>(
      getTacheClient(),
      "marquerTerminee"
    )(request),

  marquerAnnulee: (request: MarquerTacheRequest): Promise<Tache> =>
    promisify<MarquerTacheRequest, Tache>(
      getTacheClient(),
      "marquerAnnulee"
    )(request),

  delete: (request: DeleteTacheRequest): Promise<TacheDeleteResponse> =>
    promisify<DeleteTacheRequest, TacheDeleteResponse>(
      getTacheClient(),
      "delete"
    )(request),
};

export const typesActivite = {
  create: (request: CreateTypeActiviteRequest): Promise<TypeActivite> =>
    promisify<CreateTypeActiviteRequest, TypeActivite>(
      getTypeActiviteClient(),
      "create"
    )(request),

  update: (request: UpdateTypeActiviteRequest): Promise<TypeActivite> =>
    promisify<UpdateTypeActiviteRequest, TypeActivite>(
      getTypeActiviteClient(),
      "update"
    )(request),

  get: (request: GetTypeActiviteRequest): Promise<TypeActivite> =>
    promisify<GetTypeActiviteRequest, TypeActivite>(
      getTypeActiviteClient(),
      "get"
    )(request),

  getByCode: (request: GetTypeActiviteByCodeRequest): Promise<TypeActivite> =>
    promisify<GetTypeActiviteByCodeRequest, TypeActivite>(
      getTypeActiviteClient(),
      "getByCode"
    )(request),

  list: (request: ListTypeActiviteRequest): Promise<ListTypeActiviteResponse> =>
    promisify<ListTypeActiviteRequest, ListTypeActiviteResponse>(
      getTypeActiviteClient(),
      "list"
    )(request),

  delete: (request: DeleteTypeActiviteRequest): Promise<TypeActiviteDeleteResponse> =>
    promisify<DeleteTypeActiviteRequest, TypeActiviteDeleteResponse>(
      getTypeActiviteClient(),
      "delete"
    )(request),
};

export const activites = {
  create: (request: CreateActiviteRequest): Promise<Activite> =>
    promisify<CreateActiviteRequest, Activite>(
      getActiviteClient(),
      "create"
    )(request),

  update: (request: UpdateActiviteRequest): Promise<Activite> =>
    promisify<UpdateActiviteRequest, Activite>(
      getActiviteClient(),
      "update"
    )(request),

  get: (request: GetActiviteRequest): Promise<Activite> =>
    promisify<GetActiviteRequest, Activite>(
      getActiviteClient(),
      "get"
    )(request),

  listByClient: (request: ListActiviteByClientRequest): Promise<ListActiviteResponse> =>
    promisify<ListActiviteByClientRequest, ListActiviteResponse>(
      getActiviteClient(),
      "listByClient"
    )(request),

  listByContrat: (request: ListActiviteByContratRequest): Promise<ListActiviteResponse> =>
    promisify<ListActiviteByContratRequest, ListActiviteResponse>(
      getActiviteClient(),
      "listByContrat"
    )(request),

  list: (request: ListActiviteRequest): Promise<ListActiviteResponse> =>
    promisify<ListActiviteRequest, ListActiviteResponse>(
      getActiviteClient(),
      "list"
    )(request),

  delete: (request: DeleteActiviteRequest): Promise<ActiviteDeleteResponse> =>
    promisify<DeleteActiviteRequest, ActiviteDeleteResponse>(
      getActiviteClient(),
      "delete"
    )(request),
};

export const evenementsSuivi = {
  create: (request: CreateEvenementSuiviRequest): Promise<EvenementSuivi> =>
    promisify<CreateEvenementSuiviRequest, EvenementSuivi>(
      getEvenementSuiviClient(),
      "create"
    )(request),

  update: (request: UpdateEvenementSuiviRequest): Promise<EvenementSuivi> =>
    promisify<UpdateEvenementSuiviRequest, EvenementSuivi>(
      getEvenementSuiviClient(),
      "update"
    )(request),

  get: (request: GetEvenementSuiviRequest): Promise<EvenementSuivi> =>
    promisify<GetEvenementSuiviRequest, EvenementSuivi>(
      getEvenementSuiviClient(),
      "get"
    )(request),

  listByExpedition: (request: ListEvenementByExpeditionRequest): Promise<ListEvenementSuiviResponse> =>
    promisify<ListEvenementByExpeditionRequest, ListEvenementSuiviResponse>(
      getEvenementSuiviClient(),
      "listByExpedition"
    )(request),

  list: (request: ListEvenementSuiviRequest): Promise<ListEvenementSuiviResponse> =>
    promisify<ListEvenementSuiviRequest, ListEvenementSuiviResponse>(
      getEvenementSuiviClient(),
      "list"
    )(request),

  delete: (request: DeleteEvenementSuiviRequest): Promise<EvenementSuiviDeleteResponse> =>
    promisify<DeleteEvenementSuiviRequest, EvenementSuiviDeleteResponse>(
      getEvenementSuiviClient(),
      "delete"
    )(request),
};

export type {
  TypeActivite,
  CreateTypeActiviteRequest,
  UpdateTypeActiviteRequest,
  ListTypeActiviteRequest,
  ListTypeActiviteResponse,
  Activite,
  CreateActiviteRequest,
  UpdateActiviteRequest,
  ListActiviteByClientRequest,
  ListActiviteByContratRequest,
  ListActiviteRequest,
  ListActiviteResponse,
  EvenementSuivi,
  CreateEvenementSuiviRequest,
  UpdateEvenementSuiviRequest,
  ListEvenementByExpeditionRequest,
  ListEvenementSuiviRequest,
  ListEvenementSuiviResponse,
};

/**
 * Documents gRPC Clients: PieceJointe + BoiteMail
 * Proto source: documents/documents.proto
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  PieceJointeServiceService,
  BoiteMailServiceService,
  type PieceJointe,
  type CreatePieceJointeRequest,
  type UpdatePieceJointeRequest,
  type GetPieceJointeRequest,
  type ListPieceJointeRequest,
  type ListPieceJointeByEntiteRequest,
  type ListPieceJointeResponse,
  type DeletePieceJointeRequest,
  type DeleteResponse as DocumentDeleteResponse,
  type BoiteMail,
  type CreateBoiteMailRequest,
  type UpdateBoiteMailRequest,
  type GetBoiteMailRequest,
  type GetBoiteMailByUtilisateurRequest,
  type GetDefaultBoiteMailRequest,
  type ListBoiteMailRequest,
  type ListBoiteMailByUtilisateurRequest,
  type SetDefaultBoiteMailRequest,
  type ActivateBoiteMailRequest,
  type UpdateOAuthTokensRequest,
  type TestConnectionRequest,
  type TestConnectionResponse,
  type DeleteBoiteMailRequest,
  type ListBoiteMailResponse,
} from "@proto/documents/documents";

let pieceJointeInstance: GrpcClient | null = null;
let boiteMailInstance: GrpcClient | null = null;

function getPieceJointeClient(): GrpcClient {
  if (!pieceJointeInstance) {
    pieceJointeInstance = makeClient(
      PieceJointeServiceService,
      "PieceJointeService",
      SERVICES.documents,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return pieceJointeInstance;
}

function getBoiteMailClient(): GrpcClient {
  if (!boiteMailInstance) {
    boiteMailInstance = makeClient(
      BoiteMailServiceService,
      "BoiteMailService",
      SERVICES.documents,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return boiteMailInstance;
}

export const piecesJointes = {
  create: (request: CreatePieceJointeRequest): Promise<PieceJointe> =>
    promisify<CreatePieceJointeRequest, PieceJointe>(
      getPieceJointeClient(),
      "create"
    )(request),

  update: (request: UpdatePieceJointeRequest): Promise<PieceJointe> =>
    promisify<UpdatePieceJointeRequest, PieceJointe>(
      getPieceJointeClient(),
      "update"
    )(request),

  get: (request: GetPieceJointeRequest): Promise<PieceJointe> =>
    promisify<GetPieceJointeRequest, PieceJointe>(
      getPieceJointeClient(),
      "get"
    )(request),

  list: (request: ListPieceJointeRequest): Promise<ListPieceJointeResponse> =>
    promisify<ListPieceJointeRequest, ListPieceJointeResponse>(
      getPieceJointeClient(),
      "list"
    )(request),

  listByEntite: (request: ListPieceJointeByEntiteRequest): Promise<ListPieceJointeResponse> =>
    promisify<ListPieceJointeByEntiteRequest, ListPieceJointeResponse>(
      getPieceJointeClient(),
      "listByEntite"
    )(request),

  delete: (request: DeletePieceJointeRequest): Promise<DocumentDeleteResponse> =>
    promisify<DeletePieceJointeRequest, DocumentDeleteResponse>(
      getPieceJointeClient(),
      "delete"
    )(request),
};

export const boitesMail = {
  create: (request: CreateBoiteMailRequest): Promise<BoiteMail> =>
    promisify<CreateBoiteMailRequest, BoiteMail>(
      getBoiteMailClient(),
      "create"
    )(request),

  update: (request: UpdateBoiteMailRequest): Promise<BoiteMail> =>
    promisify<UpdateBoiteMailRequest, BoiteMail>(
      getBoiteMailClient(),
      "update"
    )(request),

  get: (request: GetBoiteMailRequest): Promise<BoiteMail> =>
    promisify<GetBoiteMailRequest, BoiteMail>(
      getBoiteMailClient(),
      "get"
    )(request),

  getByUtilisateur: (request: GetBoiteMailByUtilisateurRequest): Promise<BoiteMail> =>
    promisify<GetBoiteMailByUtilisateurRequest, BoiteMail>(
      getBoiteMailClient(),
      "getByUtilisateur"
    )(request),

  getDefault: (request: GetDefaultBoiteMailRequest): Promise<BoiteMail> =>
    promisify<GetDefaultBoiteMailRequest, BoiteMail>(
      getBoiteMailClient(),
      "getDefault"
    )(request),

  list: (request: ListBoiteMailRequest): Promise<ListBoiteMailResponse> =>
    promisify<ListBoiteMailRequest, ListBoiteMailResponse>(
      getBoiteMailClient(),
      "list"
    )(request),

  listByUtilisateur: (request: ListBoiteMailByUtilisateurRequest): Promise<ListBoiteMailResponse> =>
    promisify<ListBoiteMailByUtilisateurRequest, ListBoiteMailResponse>(
      getBoiteMailClient(),
      "listByUtilisateur"
    )(request),

  setDefault: (request: SetDefaultBoiteMailRequest): Promise<BoiteMail> =>
    promisify<SetDefaultBoiteMailRequest, BoiteMail>(
      getBoiteMailClient(),
      "setDefault"
    )(request),

  activer: (request: ActivateBoiteMailRequest): Promise<BoiteMail> =>
    promisify<ActivateBoiteMailRequest, BoiteMail>(
      getBoiteMailClient(),
      "activer"
    )(request),

  desactiver: (request: ActivateBoiteMailRequest): Promise<BoiteMail> =>
    promisify<ActivateBoiteMailRequest, BoiteMail>(
      getBoiteMailClient(),
      "desactiver"
    )(request),

  updateOAuthTokens: (request: UpdateOAuthTokensRequest): Promise<BoiteMail> =>
    promisify<UpdateOAuthTokensRequest, BoiteMail>(
      getBoiteMailClient(),
      "updateOAuthTokens"
    )(request),

  testConnection: (request: TestConnectionRequest): Promise<TestConnectionResponse> =>
    promisify<TestConnectionRequest, TestConnectionResponse>(
      getBoiteMailClient(),
      "testConnection"
    )(request),

  delete: (request: DeleteBoiteMailRequest): Promise<DocumentDeleteResponse> =>
    promisify<DeleteBoiteMailRequest, DocumentDeleteResponse>(
      getBoiteMailClient(),
      "delete"
    )(request),
};

export type {
  PieceJointe,
  CreatePieceJointeRequest,
  UpdatePieceJointeRequest,
  ListPieceJointeRequest,
  ListPieceJointeByEntiteRequest,
  ListPieceJointeResponse,
  BoiteMail,
  CreateBoiteMailRequest,
  UpdateBoiteMailRequest,
  GetBoiteMailByUtilisateurRequest,
  GetDefaultBoiteMailRequest,
  ListBoiteMailRequest,
  ListBoiteMailByUtilisateurRequest,
  SetDefaultBoiteMailRequest,
  UpdateOAuthTokensRequest,
  TestConnectionResponse,
  ListBoiteMailResponse,
};

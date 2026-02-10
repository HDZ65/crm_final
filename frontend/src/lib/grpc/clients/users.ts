import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  UtilisateurServiceService,
  MembreCompteServiceService,
  CompteServiceService,
  RoleServiceService,
  type Utilisateur,
  type CreateUtilisateurRequest,
  type UpdateUtilisateurRequest,
  type GetUtilisateurRequest,
  type GetByKeycloakIdRequest,
  type ListUtilisateurRequest,
  type ListUtilisateurResponse,
  type DeleteUtilisateurRequest,
  type DeleteResponse as UserDeleteResponse,
  type MembreCompte,
  type Compte,
  type CompteWithOwner,
  type CreateMembreCompteRequest,
  type UpdateMembreCompteRequest,
  type GetMembreCompteRequest,
  type ListByOrganisationRequest,
  type ListByUtilisateurRequest,
  type ListMembreCompteResponse,
  type DeleteMembreCompteRequest,
  type DeleteResponse as MembreCompteDeleteResponse,
  type CreateCompteWithOwnerRequest,
  type CreateCompteRequest,
  type UpdateCompteRequest,
  type GetCompteRequest,
  type DeleteCompteRequest,
  type Role,
  type GetRoleRequest,
  type ListRoleRequest,
  type ListRoleResponse,
} from "@proto/organisations/users";

let utilisateurInstance: GrpcClient | null = null;
let membreCompteInstance: GrpcClient | null = null;
let compteInstance: GrpcClient | null = null;
let roleInstance: GrpcClient | null = null;

function getUtilisateurClient(): GrpcClient {
  if (!utilisateurInstance) {
    utilisateurInstance = makeClient(
      UtilisateurServiceService,
      "UtilisateurService",
      SERVICES.users,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return utilisateurInstance;
}

function getMembreCompteClient(): GrpcClient {
  if (!membreCompteInstance) {
    membreCompteInstance = makeClient(
      MembreCompteServiceService,
      "MembreCompteService",
      SERVICES.users,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return membreCompteInstance;
}

function getCompteClient(): GrpcClient {
  if (!compteInstance) {
    compteInstance = makeClient(
      CompteServiceService,
      "CompteService",
      SERVICES.users,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return compteInstance;
}

function getRoleClient(): GrpcClient {
  if (!roleInstance) {
    roleInstance = makeClient(
      RoleServiceService,
      "RoleService",
      SERVICES.users,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return roleInstance;
}

export const users = {
  create: (request: CreateUtilisateurRequest): Promise<Utilisateur> =>
    promisify<CreateUtilisateurRequest, Utilisateur>(
      getUtilisateurClient(),
      "create"
    )(request),

  update: (request: UpdateUtilisateurRequest): Promise<Utilisateur> =>
    promisify<UpdateUtilisateurRequest, Utilisateur>(
      getUtilisateurClient(),
      "update"
    )(request),

  get: (request: GetUtilisateurRequest): Promise<Utilisateur> =>
    promisify<GetUtilisateurRequest, Utilisateur>(
      getUtilisateurClient(),
      "get"
    )(request),

  getByKeycloakId: (request: GetByKeycloakIdRequest): Promise<Utilisateur> =>
    promisify<GetByKeycloakIdRequest, Utilisateur>(
      getUtilisateurClient(),
      "getByKeycloakId"
    )(request),

  list: (request: ListUtilisateurRequest): Promise<ListUtilisateurResponse> =>
    promisify<ListUtilisateurRequest, ListUtilisateurResponse>(
      getUtilisateurClient(),
      "list"
    )(request),

  delete: (request: DeleteUtilisateurRequest): Promise<UserDeleteResponse> =>
    promisify<DeleteUtilisateurRequest, UserDeleteResponse>(
      getUtilisateurClient(),
      "delete"
    )(request),
};

export const membresCompte = {
  create: (request: CreateMembreCompteRequest): Promise<MembreCompte> =>
    promisify<CreateMembreCompteRequest, MembreCompte>(
      getMembreCompteClient(),
      "create"
    )(request),

  update: (request: UpdateMembreCompteRequest): Promise<MembreCompte> =>
    promisify<UpdateMembreCompteRequest, MembreCompte>(
      getMembreCompteClient(),
      "update"
    )(request),

  get: (request: GetMembreCompteRequest): Promise<MembreCompte> =>
    promisify<GetMembreCompteRequest, MembreCompte>(
      getMembreCompteClient(),
      "get"
    )(request),

  listByOrganisation: (
    request: ListByOrganisationRequest
  ): Promise<ListMembreCompteResponse> =>
    promisify<ListByOrganisationRequest, ListMembreCompteResponse>(
      getMembreCompteClient(),
      "listByOrganisation"
    )(request),

  listByUtilisateur: (
    request: ListByUtilisateurRequest
  ): Promise<ListMembreCompteResponse> =>
    promisify<ListByUtilisateurRequest, ListMembreCompteResponse>(
      getMembreCompteClient(),
      "listByUtilisateur"
    )(request),

  delete: (request: DeleteMembreCompteRequest): Promise<MembreCompteDeleteResponse> =>
    promisify<DeleteMembreCompteRequest, MembreCompteDeleteResponse>(
      getMembreCompteClient(),
      "delete"
    )(request),
};

export const comptes = {
  create: (request: CreateCompteRequest): Promise<Compte> =>
    promisify<CreateCompteRequest, Compte>(
      getCompteClient(),
      "create"
    )(request),

  createWithOwner: (request: CreateCompteWithOwnerRequest): Promise<CompteWithOwner> =>
    promisify<CreateCompteWithOwnerRequest, CompteWithOwner>(
      getCompteClient(),
      "createWithOwner"
    )(request),

  update: (request: UpdateCompteRequest): Promise<Compte> =>
    promisify<UpdateCompteRequest, Compte>(
      getCompteClient(),
      "update"
    )(request),

  get: (request: GetCompteRequest): Promise<Compte> =>
    promisify<GetCompteRequest, Compte>(
      getCompteClient(),
      "get"
    )(request),

  delete: (request: DeleteCompteRequest): Promise<MembreCompteDeleteResponse> =>
    promisify<DeleteCompteRequest, MembreCompteDeleteResponse>(
      getCompteClient(),
      "delete"
    )(request),
};

export const roles = {
  get: (request: GetRoleRequest): Promise<Role> =>
    promisify<GetRoleRequest, Role>(
      getRoleClient(),
      "get"
    )(request),

  list: (request: ListRoleRequest): Promise<ListRoleResponse> =>
    promisify<ListRoleRequest, ListRoleResponse>(
      getRoleClient(),
      "list"
    )(request),
};

export type {
  Utilisateur,
  CreateUtilisateurRequest,
  ListUtilisateurRequest,
  ListUtilisateurResponse,
  MembreCompte,
  CreateMembreCompteRequest,
  UpdateMembreCompteRequest,
  ListByOrganisationRequest,
  ListMembreCompteResponse,
  Role,
  GetRoleRequest,
  ListRoleRequest,
  ListRoleResponse,
};

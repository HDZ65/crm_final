import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify } from "./config";
import {
  SocieteServiceClient,
  OrganisationServiceClient,
  RolePartenaireServiceClient,
  MembrePartenaireServiceClient,
  InvitationCompteServiceClient,
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
  type Societe,
  type CreateSocieteRequest,
  type UpdateSocieteRequest,
  type GetSocieteRequest,
  type ListSocieteByOrganisationRequest,
  type ListSocieteResponse,
  type DeleteSocieteRequest,
  type DeleteResponse as SocieteDeleteResponse,
  type Organisation,
  type CreateOrganisationRequest,
  type UpdateOrganisationRequest,
  type GetOrganisationRequest,
  type DeleteOrganisationRequest,
  type ListOrganisationRequest,
  type ListOrganisationResponse,
  type DeleteResponse as OrganisationDeleteResponse,
  type RolePartenaire,
  type CreateRolePartenaireRequest,
  type UpdateRolePartenaireRequest,
  type GetRolePartenaireRequest,
  type ListRolePartenaireRequest,
  type ListRolePartenaireResponse,
  type DeleteRolePartenaireRequest,
  type DeleteResponse as RolePartenaireDeleteResponse,
  type MembrePartenaire,
  type CreateMembrePartenaireRequest,
  type UpdateMembrePartenaireRequest,
  type GetMembrePartenaireRequest,
  type ListMembreByPartenaireRequest,
  type ListMembreByUtilisateurRequest,
  type ListMembrePartenaireResponse,
  type DeleteMembrePartenaireRequest,
  type DeleteResponse as MembrePartenaireDeleteResponse,
  type InvitationCompte,
  type GetInvitationCompteRequest,
  type GetInvitationByTokenRequest,
  type ListInvitationByOrganisationRequest,
  type ListInvitationCompteResponse,
  type AcceptInvitationRequest as AcceptInvitationCompteRequest,
  type RejectInvitationRequest as RejectInvitationCompteRequest,
  type ExpireInvitationRequest,
  type DeleteInvitationCompteRequest,
  type DeleteResponse as InvitationCompteDeleteResponse,
} from "@proto/organisations/organisations";

let societeInstance: SocieteServiceClient | null = null;
let organisationInstance: OrganisationServiceClient | null = null;
let rolePartenaireInstance: RolePartenaireServiceClient | null = null;
let membrePartenaireInstance: MembrePartenaireServiceClient | null = null;
let invitationCompteInstance: InvitationCompteServiceClient | null = null;

function getSocieteClient(): SocieteServiceClient {
  if (!societeInstance) {
    societeInstance = new SocieteServiceClient(
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return societeInstance;
}

function getOrganisationClient(): OrganisationServiceClient {
  if (!organisationInstance) {
    organisationInstance = new OrganisationServiceClient(
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return organisationInstance;
}

function getRolePartenaireClient(): RolePartenaireServiceClient {
  if (!rolePartenaireInstance) {
    rolePartenaireInstance = new RolePartenaireServiceClient(
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return rolePartenaireInstance;
}

function getMembrePartenaireClient(): MembrePartenaireServiceClient {
  if (!membrePartenaireInstance) {
    membrePartenaireInstance = new MembrePartenaireServiceClient(
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return membrePartenaireInstance;
}

function getInvitationCompteClient(): InvitationCompteServiceClient {
  if (!invitationCompteInstance) {
    invitationCompteInstance = new InvitationCompteServiceClient(
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return invitationCompteInstance;
}

export const societes = {
  create: (request: CreateSocieteRequest): Promise<Societe> =>
    promisify<CreateSocieteRequest, Societe>(
      getSocieteClient(),
      "create"
    )(request),

  get: (request: GetSocieteRequest): Promise<Societe> =>
    promisify<GetSocieteRequest, Societe>(getSocieteClient(), "get")(request),

  listByOrganisation: (request: ListSocieteByOrganisationRequest): Promise<ListSocieteResponse> =>
    promisify<ListSocieteByOrganisationRequest, ListSocieteResponse>(
      getSocieteClient(),
      "listByOrganisation"
    )(request),

  update: (request: UpdateSocieteRequest): Promise<Societe> =>
    promisify<UpdateSocieteRequest, Societe>(
      getSocieteClient(),
      "update"
    )(request),

  delete: (request: DeleteSocieteRequest): Promise<SocieteDeleteResponse> =>
    promisify<DeleteSocieteRequest, SocieteDeleteResponse>(
      getSocieteClient(),
      "delete"
    )(request),
};

export const organisations = {
  create: (request: CreateOrganisationRequest): Promise<Organisation> =>
    promisify<CreateOrganisationRequest, Organisation>(
      getOrganisationClient(),
      "create"
    )(request),

  update: (request: UpdateOrganisationRequest): Promise<Organisation> =>
    promisify<UpdateOrganisationRequest, Organisation>(
      getOrganisationClient(),
      "update"
    )(request),

  get: (request: GetOrganisationRequest): Promise<Organisation> =>
    promisify<GetOrganisationRequest, Organisation>(
      getOrganisationClient(),
      "get"
    )(request),

  list: (request: ListOrganisationRequest): Promise<ListOrganisationResponse> =>
    promisify<ListOrganisationRequest, ListOrganisationResponse>(
      getOrganisationClient(),
      "list"
    )(request),

  delete: (request: DeleteOrganisationRequest): Promise<OrganisationDeleteResponse> =>
    promisify<DeleteOrganisationRequest, OrganisationDeleteResponse>(
      getOrganisationClient(),
      "delete"
    )(request),
};

export const rolesPartenaire = {
  create: (request: CreateRolePartenaireRequest): Promise<RolePartenaire> =>
    promisify<CreateRolePartenaireRequest, RolePartenaire>(
      getRolePartenaireClient(),
      "create"
    )(request),

  get: (request: GetRolePartenaireRequest): Promise<RolePartenaire> =>
    promisify<GetRolePartenaireRequest, RolePartenaire>(
      getRolePartenaireClient(),
      "get"
    )(request),

  list: (request: ListRolePartenaireRequest): Promise<ListRolePartenaireResponse> =>
    promisify<ListRolePartenaireRequest, ListRolePartenaireResponse>(
      getRolePartenaireClient(),
      "list"
    )(request),

  update: (request: UpdateRolePartenaireRequest): Promise<RolePartenaire> =>
    promisify<UpdateRolePartenaireRequest, RolePartenaire>(
      getRolePartenaireClient(),
      "update"
    )(request),

  delete: (request: DeleteRolePartenaireRequest): Promise<RolePartenaireDeleteResponse> =>
    promisify<DeleteRolePartenaireRequest, RolePartenaireDeleteResponse>(
      getRolePartenaireClient(),
      "delete"
    )(request),
};

export const membresPartenaire = {
  create: (request: CreateMembrePartenaireRequest): Promise<MembrePartenaire> =>
    promisify<CreateMembrePartenaireRequest, MembrePartenaire>(
      getMembrePartenaireClient(),
      "create"
    )(request),

  get: (request: GetMembrePartenaireRequest): Promise<MembrePartenaire> =>
    promisify<GetMembrePartenaireRequest, MembrePartenaire>(
      getMembrePartenaireClient(),
      "get"
    )(request),

  listByPartenaire: (
    request: ListMembreByPartenaireRequest
  ): Promise<ListMembrePartenaireResponse> =>
    promisify<ListMembreByPartenaireRequest, ListMembrePartenaireResponse>(
      getMembrePartenaireClient(),
      "listByPartenaire"
    )(request),

  listByUtilisateur: (
    request: ListMembreByUtilisateurRequest
  ): Promise<ListMembrePartenaireResponse> =>
    promisify<ListMembreByUtilisateurRequest, ListMembrePartenaireResponse>(
      getMembrePartenaireClient(),
      "listByUtilisateur"
    )(request),

  update: (request: UpdateMembrePartenaireRequest): Promise<MembrePartenaire> =>
    promisify<UpdateMembrePartenaireRequest, MembrePartenaire>(
      getMembrePartenaireClient(),
      "update"
    )(request),

  delete: (request: DeleteMembrePartenaireRequest): Promise<MembrePartenaireDeleteResponse> =>
    promisify<DeleteMembrePartenaireRequest, MembrePartenaireDeleteResponse>(
      getMembrePartenaireClient(),
      "delete"
    )(request),
};

export const invitationsCompte = {
  create: (request: CreateInvitationCompteRequest): Promise<InvitationCompte> =>
    promisify<CreateInvitationCompteRequest, InvitationCompte>(
      getInvitationCompteClient(),
      "create"
    )(request),

  get: (request: GetInvitationCompteRequest): Promise<InvitationCompte> =>
    promisify<GetInvitationCompteRequest, InvitationCompte>(
      getInvitationCompteClient(),
      "get"
    )(request),

  getByToken: (request: GetInvitationByTokenRequest): Promise<InvitationCompte> =>
    promisify<GetInvitationByTokenRequest, InvitationCompte>(
      getInvitationCompteClient(),
      "getByToken"
    )(request),

  listByOrganisation: (
    request: ListInvitationByOrganisationRequest
  ): Promise<ListInvitationCompteResponse> =>
    promisify<ListInvitationByOrganisationRequest, ListInvitationCompteResponse>(
      getInvitationCompteClient(),
      "listByOrganisation"
    )(request),

  update: (request: UpdateInvitationCompteRequest): Promise<InvitationCompte> =>
    promisify<UpdateInvitationCompteRequest, InvitationCompte>(
      getInvitationCompteClient(),
      "update"
    )(request),

  accept: (request: AcceptInvitationCompteRequest): Promise<InvitationCompte> =>
    promisify<AcceptInvitationCompteRequest, InvitationCompte>(
      getInvitationCompteClient(),
      "accept"
    )(request),

  reject: (request: RejectInvitationCompteRequest): Promise<InvitationCompte> =>
    promisify<RejectInvitationCompteRequest, InvitationCompte>(
      getInvitationCompteClient(),
      "reject"
    )(request),

  expire: (request: ExpireInvitationRequest): Promise<InvitationCompte> =>
    promisify<ExpireInvitationRequest, InvitationCompte>(
      getInvitationCompteClient(),
      "expire"
    )(request),

  delete: (request: DeleteInvitationCompteRequest): Promise<InvitationCompteDeleteResponse> =>
    promisify<DeleteInvitationCompteRequest, InvitationCompteDeleteResponse>(
      getInvitationCompteClient(),
      "delete"
    )(request),
};

export type {
  Organisation,
  GetOrganisationRequest,
  ListOrganisationRequest,
  ListOrganisationResponse,
  RolePartenaire,
  CreateRolePartenaireRequest,
  UpdateRolePartenaireRequest,
  ListRolePartenaireRequest,
  ListRolePartenaireResponse,
  MembrePartenaire,
  CreateMembrePartenaireRequest,
  UpdateMembrePartenaireRequest,
  ListMembreByPartenaireRequest,
  ListMembreByUtilisateurRequest,
  ListMembrePartenaireResponse,
  InvitationCompte,
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
  ListInvitationByOrganisationRequest,
  ListInvitationCompteResponse,
};

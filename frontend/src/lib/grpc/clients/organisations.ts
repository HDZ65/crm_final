import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  SocieteServiceService,
  OrganisationServiceService,
  RolePartenaireServiceService,
  MembrePartenaireServiceService,
  InvitationCompteServiceService,
  PartenaireMarqueBlancheServiceService,
  ThemeMarqueServiceService,
  StatutPartenaireServiceService,
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
  // PartenaireMarqueBlanche
  type PartenaireMarqueBlanche,
  type CreatePartenaireRequest,
  type UpdatePartenaireRequest,
  type GetPartenaireRequest,
  type ListPartenaireRequest,
  type ListPartenaireResponse,
  type DeletePartenaireRequest,
  // ThemeMarque
  type ThemeMarque,
  type CreateThemeMarqueRequest,
  type UpdateThemeMarqueRequest,
  type GetThemeMarqueRequest,
  type ListThemeMarqueRequest,
  type ListThemeMarqueResponse,
  type DeleteThemeMarqueRequest,
  // StatutPartenaire
  type StatutPartenaire,
  type CreateStatutPartenaireRequest,
  type UpdateStatutPartenaireRequest,
  type GetStatutPartenaireRequest,
  type GetStatutPartenaireByCodeRequest,
  type ListStatutPartenaireRequest,
  type ListStatutPartenaireResponse,
  type DeleteStatutPartenaireRequest,
} from "@proto/organisations/organisations";

let societeInstance: GrpcClient | null = null;
let organisationInstance: GrpcClient | null = null;
let rolePartenaireInstance: GrpcClient | null = null;
let membrePartenaireInstance: GrpcClient | null = null;
let invitationCompteInstance: GrpcClient | null = null;
let partenaireMarqueBlancheInstance: GrpcClient | null = null;
let themeMarqueInstance: GrpcClient | null = null;
let statutPartenaireInstance: GrpcClient | null = null;

function getSocieteClient(): GrpcClient {
  if (!societeInstance) {
    societeInstance = makeClient(
      SocieteServiceService,
      "SocieteService",
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return societeInstance;
}

function getOrganisationClient(): GrpcClient {
  if (!organisationInstance) {
    organisationInstance = makeClient(
      OrganisationServiceService,
      "OrganisationService",
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return organisationInstance;
}

function getRolePartenaireClient(): GrpcClient {
  if (!rolePartenaireInstance) {
    rolePartenaireInstance = makeClient(
      RolePartenaireServiceService,
      "RolePartenaireService",
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return rolePartenaireInstance;
}

function getMembrePartenaireClient(): GrpcClient {
  if (!membrePartenaireInstance) {
    membrePartenaireInstance = makeClient(
      MembrePartenaireServiceService,
      "MembrePartenaireService",
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return membrePartenaireInstance;
}

function getInvitationCompteClient(): GrpcClient {
  if (!invitationCompteInstance) {
    invitationCompteInstance = makeClient(
      InvitationCompteServiceService,
      "InvitationCompteService",
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return invitationCompteInstance;
}

function getPartenaireMarqueBlancheClient(): GrpcClient {
  if (!partenaireMarqueBlancheInstance) {
    partenaireMarqueBlancheInstance = makeClient(
      PartenaireMarqueBlancheServiceService,
      "PartenaireMarqueBlancheService",
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return partenaireMarqueBlancheInstance;
}

function getThemeMarqueClient(): GrpcClient {
  if (!themeMarqueInstance) {
    themeMarqueInstance = makeClient(
      ThemeMarqueServiceService,
      "ThemeMarqueService",
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return themeMarqueInstance;
}

function getStatutPartenaireClient(): GrpcClient {
  if (!statutPartenaireInstance) {
    statutPartenaireInstance = makeClient(
      StatutPartenaireServiceService,
      "StatutPartenaireService",
      SERVICES.organisations,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return statutPartenaireInstance;
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

export const partenairesMarqueBlanche = {
  create: (request: CreatePartenaireRequest): Promise<PartenaireMarqueBlanche> =>
    promisify<CreatePartenaireRequest, PartenaireMarqueBlanche>(
      getPartenaireMarqueBlancheClient(),
      "create"
    )(request),

  update: (request: UpdatePartenaireRequest): Promise<PartenaireMarqueBlanche> =>
    promisify<UpdatePartenaireRequest, PartenaireMarqueBlanche>(
      getPartenaireMarqueBlancheClient(),
      "update"
    )(request),

  get: (request: GetPartenaireRequest): Promise<PartenaireMarqueBlanche> =>
    promisify<GetPartenaireRequest, PartenaireMarqueBlanche>(
      getPartenaireMarqueBlancheClient(),
      "get"
    )(request),

  list: (request: ListPartenaireRequest): Promise<ListPartenaireResponse> =>
    promisify<ListPartenaireRequest, ListPartenaireResponse>(
      getPartenaireMarqueBlancheClient(),
      "list"
    )(request),

  delete: (request: DeletePartenaireRequest): Promise<OrganisationDeleteResponse> =>
    promisify<DeletePartenaireRequest, OrganisationDeleteResponse>(
      getPartenaireMarqueBlancheClient(),
      "delete"
    )(request),
};

export const themesMarque = {
  create: (request: CreateThemeMarqueRequest): Promise<ThemeMarque> =>
    promisify<CreateThemeMarqueRequest, ThemeMarque>(
      getThemeMarqueClient(),
      "create"
    )(request),

  update: (request: UpdateThemeMarqueRequest): Promise<ThemeMarque> =>
    promisify<UpdateThemeMarqueRequest, ThemeMarque>(
      getThemeMarqueClient(),
      "update"
    )(request),

  get: (request: GetThemeMarqueRequest): Promise<ThemeMarque> =>
    promisify<GetThemeMarqueRequest, ThemeMarque>(
      getThemeMarqueClient(),
      "get"
    )(request),

  list: (request: ListThemeMarqueRequest): Promise<ListThemeMarqueResponse> =>
    promisify<ListThemeMarqueRequest, ListThemeMarqueResponse>(
      getThemeMarqueClient(),
      "list"
    )(request),

  delete: (request: DeleteThemeMarqueRequest): Promise<OrganisationDeleteResponse> =>
    promisify<DeleteThemeMarqueRequest, OrganisationDeleteResponse>(
      getThemeMarqueClient(),
      "delete"
    )(request),
};

export const statutsPartenaire = {
  create: (request: CreateStatutPartenaireRequest): Promise<StatutPartenaire> =>
    promisify<CreateStatutPartenaireRequest, StatutPartenaire>(
      getStatutPartenaireClient(),
      "create"
    )(request),

  update: (request: UpdateStatutPartenaireRequest): Promise<StatutPartenaire> =>
    promisify<UpdateStatutPartenaireRequest, StatutPartenaire>(
      getStatutPartenaireClient(),
      "update"
    )(request),

  get: (request: GetStatutPartenaireRequest): Promise<StatutPartenaire> =>
    promisify<GetStatutPartenaireRequest, StatutPartenaire>(
      getStatutPartenaireClient(),
      "get"
    )(request),

  getByCode: (request: GetStatutPartenaireByCodeRequest): Promise<StatutPartenaire> =>
    promisify<GetStatutPartenaireByCodeRequest, StatutPartenaire>(
      getStatutPartenaireClient(),
      "getByCode"
    )(request),

  list: (request: ListStatutPartenaireRequest): Promise<ListStatutPartenaireResponse> =>
    promisify<ListStatutPartenaireRequest, ListStatutPartenaireResponse>(
      getStatutPartenaireClient(),
      "list"
    )(request),

  delete: (request: DeleteStatutPartenaireRequest): Promise<OrganisationDeleteResponse> =>
    promisify<DeleteStatutPartenaireRequest, OrganisationDeleteResponse>(
      getStatutPartenaireClient(),
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
  // PartenaireMarqueBlanche
  PartenaireMarqueBlanche,
  CreatePartenaireRequest,
  UpdatePartenaireRequest,
  ListPartenaireRequest,
  ListPartenaireResponse,
  // ThemeMarque
  ThemeMarque,
  CreateThemeMarqueRequest,
  UpdateThemeMarqueRequest,
  ListThemeMarqueRequest,
  ListThemeMarqueResponse,
  // StatutPartenaire
  StatutPartenaire,
  CreateStatutPartenaireRequest,
  UpdateStatutPartenaireRequest,
  GetStatutPartenaireByCodeRequest,
  ListStatutPartenaireRequest,
  ListStatutPartenaireResponse,
};

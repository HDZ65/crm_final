/**
 * Client Service gRPC Client
 * Includes base client + 9 sub-entity services
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";

// ===== ClientBase imports =====
import {
  ClientBaseServiceService,
  type ClientBase,
  type CreateClientBaseRequest,
  type UpdateClientBaseRequest,
  type GetClientBaseRequest,
  type ListClientsBaseRequest,
  type ListClientsBaseResponse,
  type DeleteClientBaseRequest,
  type DeleteResponse as ClientDeleteResponse,
  type SearchClientRequest,
  type SearchClientResponse,
  // Adresse
  AdresseServiceService,
  type Adresse,
  type CreateAdresseRequest,
  type UpdateAdresseRequest,
  type GetAdresseRequest,
  type ListAdressesRequest,
  type ListAdressesResponse,
  type DeleteAdresseRequest,
  // ClientEntreprise
  ClientEntrepriseServiceService,
  type ClientEntreprise,
  type CreateClientEntrepriseRequest,
  type UpdateClientEntrepriseRequest,
  type GetClientEntrepriseRequest,
  type ListClientsEntrepriseRequest,
  type ListClientsEntrepriseResponse,
  type DeleteClientEntrepriseRequest,
  // ClientPartenaire
  ClientPartenaireServiceService,
  type ClientPartenaire,
  type CreateClientPartenaireRequest,
  type UpdateClientPartenaireRequest,
  type GetClientPartenaireRequest,
  type ListClientsPartenaireRequest,
  type ListClientsPartenaireResponse,
  type DeleteClientPartenaireRequest,
  // StatutClient (from clients.proto)
  StatutClientServiceService,
  type StatutClient,
  type CreateStatutClientRequest,
  type UpdateStatutClientRequest,
  type GetStatutClientRequest,
  type GetStatutClientByCodeRequest,
  type ListStatutsClientRequest,
  type ListStatutsClientResponse,
  type DeleteStatutClientRequest,
} from "@proto/clients/clients";

// ===== Referentiel imports (5 sub-entities) =====
import {
  // ConditionPaiement
  ConditionPaiementServiceService,
  type ConditionPaiement,
  type CreateConditionPaiementRequest,
  type UpdateConditionPaiementRequest,
  type GetConditionPaiementRequest,
  type GetConditionPaiementByCodeRequest,
  type ListConditionPaiementRequest,
  type ListConditionPaiementResponse,
  type DeleteConditionPaiementRequest,
  // EmissionFacture
  EmissionFactureServiceService,
  type EmissionFacture,
  type CreateEmissionFactureRequest,
  type UpdateEmissionFactureRequest,
  type GetEmissionFactureRequest,
  type GetEmissionFactureByCodeRequest,
  type ListEmissionFactureRequest,
  type ListEmissionFactureResponse,
  type DeleteEmissionFactureRequest,
  // FacturationPar
  FacturationParServiceService,
  type FacturationPar,
  type CreateFacturationParRequest,
  type UpdateFacturationParRequest,
  type GetFacturationParRequest,
  type GetFacturationParByCodeRequest,
  type ListFacturationParRequest,
  type ListFacturationParResponse,
  type DeleteFacturationParRequest,
  // PeriodeFacturation
  PeriodeFacturationServiceService,
  type PeriodeFacturation,
  type CreatePeriodeFacturationRequest,
  type UpdatePeriodeFacturationRequest,
  type GetPeriodeFacturationRequest,
  type GetPeriodeFacturationByCodeRequest,
  type ListPeriodeFacturationRequest,
  type ListPeriodeFacturationResponse,
  type DeletePeriodeFacturationRequest,
  // TransporteurCompte
  TransporteurCompteServiceService,
  type TransporteurCompte,
  type CreateTransporteurCompteRequest,
  type UpdateTransporteurCompteRequest,
  type GetTransporteurCompteRequest,
  type ListTransporteurByOrganisationRequest,
  type ListTransporteurCompteRequest,
  type ListTransporteurCompteResponse,
  type ActivateTransporteurRequest,
  type DeleteTransporteurCompteRequest,
  type DeleteResponse as ReferentielDeleteResponse,
} from "@proto/referentiel/referentiel";

// ===== Singleton instances =====
let clientBaseInstance: GrpcClient | null = null;
let adresseInstance: GrpcClient | null = null;
let clientEntrepriseInstance: GrpcClient | null = null;
let clientPartenaireInstance: GrpcClient | null = null;
let statutClientInstance: GrpcClient | null = null;
let conditionPaiementInstance: GrpcClient | null = null;
let emissionFactureInstance: GrpcClient | null = null;
let facturationParInstance: GrpcClient | null = null;
let periodeFacturationInstance: GrpcClient | null = null;
let transporteurCompteInstance: GrpcClient | null = null;

// ===== Client factories =====

function getClientBaseClient(): GrpcClient {
  if (!clientBaseInstance) {
    clientBaseInstance = makeClient(
      ClientBaseServiceService,
      "ClientBaseService",
      SERVICES.clients,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return clientBaseInstance;
}

function getAdresseClient(): GrpcClient {
  if (!adresseInstance) {
    adresseInstance = makeClient(
      AdresseServiceService,
      "AdresseService",
      SERVICES.clients,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return adresseInstance;
}

function getClientEntrepriseClient(): GrpcClient {
  if (!clientEntrepriseInstance) {
    clientEntrepriseInstance = makeClient(
      ClientEntrepriseServiceService,
      "ClientEntrepriseService",
      SERVICES.clients,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return clientEntrepriseInstance;
}

function getClientPartenaireClient(): GrpcClient {
  if (!clientPartenaireInstance) {
    clientPartenaireInstance = makeClient(
      ClientPartenaireServiceService,
      "ClientPartenaireService",
      SERVICES.clients,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return clientPartenaireInstance;
}

function getStatutClientClient(): GrpcClient {
  if (!statutClientInstance) {
    statutClientInstance = makeClient(
      StatutClientServiceService,
      "StatutClientService",
      SERVICES.clients,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return statutClientInstance;
}

function getConditionPaiementClient(): GrpcClient {
  if (!conditionPaiementInstance) {
    conditionPaiementInstance = makeClient(
      ConditionPaiementServiceService,
      "ConditionPaiementService",
      SERVICES.referentiel,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return conditionPaiementInstance;
}

function getEmissionFactureClient(): GrpcClient {
  if (!emissionFactureInstance) {
    emissionFactureInstance = makeClient(
      EmissionFactureServiceService,
      "EmissionFactureService",
      SERVICES.referentiel,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return emissionFactureInstance;
}

function getFacturationParClient(): GrpcClient {
  if (!facturationParInstance) {
    facturationParInstance = makeClient(
      FacturationParServiceService,
      "FacturationParService",
      SERVICES.referentiel,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return facturationParInstance;
}

function getPeriodeFacturationClient(): GrpcClient {
  if (!periodeFacturationInstance) {
    periodeFacturationInstance = makeClient(
      PeriodeFacturationServiceService,
      "PeriodeFacturationService",
      SERVICES.referentiel,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return periodeFacturationInstance;
}

function getTransporteurCompteClient(): GrpcClient {
  if (!transporteurCompteInstance) {
    transporteurCompteInstance = makeClient(
      TransporteurCompteServiceService,
      "TransporteurCompteService",
      SERVICES.referentiel,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return transporteurCompteInstance;
}

// ===== Exported client objects =====

export const clients = {
  create: (request: CreateClientBaseRequest): Promise<ClientBase> =>
    promisify<CreateClientBaseRequest, ClientBase>(
      getClientBaseClient(),
      "create"
    )(request),

  update: (request: UpdateClientBaseRequest): Promise<ClientBase> =>
    promisify<UpdateClientBaseRequest, ClientBase>(
      getClientBaseClient(),
      "update"
    )(request),

  get: (request: GetClientBaseRequest): Promise<ClientBase> =>
    promisify<GetClientBaseRequest, ClientBase>(
      getClientBaseClient(),
      "get"
    )(request),

  list: (request: ListClientsBaseRequest): Promise<ListClientsBaseResponse> =>
    promisify<ListClientsBaseRequest, ListClientsBaseResponse>(
      getClientBaseClient(),
      "list"
    )(request),

  delete: (request: DeleteClientBaseRequest): Promise<ClientDeleteResponse> =>
    promisify<DeleteClientBaseRequest, ClientDeleteResponse>(
      getClientBaseClient(),
      "delete"
    )(request),

  search: (request: SearchClientRequest): Promise<SearchClientResponse> =>
    promisify<SearchClientRequest, SearchClientResponse>(
      getClientBaseClient(),
      "search"
    )(request),
};

export const adresses = {
  create: (request: CreateAdresseRequest): Promise<Adresse> =>
    promisify<CreateAdresseRequest, Adresse>(
      getAdresseClient(),
      "create"
    )(request),

  update: (request: UpdateAdresseRequest): Promise<Adresse> =>
    promisify<UpdateAdresseRequest, Adresse>(
      getAdresseClient(),
      "update"
    )(request),

  get: (request: GetAdresseRequest): Promise<Adresse> =>
    promisify<GetAdresseRequest, Adresse>(
      getAdresseClient(),
      "get"
    )(request),

  listByClient: (request: ListAdressesRequest): Promise<ListAdressesResponse> =>
    promisify<ListAdressesRequest, ListAdressesResponse>(
      getAdresseClient(),
      "listByClient"
    )(request),

  delete: (request: DeleteAdresseRequest): Promise<ClientDeleteResponse> =>
    promisify<DeleteAdresseRequest, ClientDeleteResponse>(
      getAdresseClient(),
      "delete"
    )(request),
};

export const clientEntreprise = {
  create: (request: CreateClientEntrepriseRequest): Promise<ClientEntreprise> =>
    promisify<CreateClientEntrepriseRequest, ClientEntreprise>(
      getClientEntrepriseClient(),
      "create"
    )(request),

  update: (request: UpdateClientEntrepriseRequest): Promise<ClientEntreprise> =>
    promisify<UpdateClientEntrepriseRequest, ClientEntreprise>(
      getClientEntrepriseClient(),
      "update"
    )(request),

  get: (request: GetClientEntrepriseRequest): Promise<ClientEntreprise> =>
    promisify<GetClientEntrepriseRequest, ClientEntreprise>(
      getClientEntrepriseClient(),
      "get"
    )(request),

  list: (request: ListClientsEntrepriseRequest): Promise<ListClientsEntrepriseResponse> =>
    promisify<ListClientsEntrepriseRequest, ListClientsEntrepriseResponse>(
      getClientEntrepriseClient(),
      "list"
    )(request),

  delete: (request: DeleteClientEntrepriseRequest): Promise<ClientDeleteResponse> =>
    promisify<DeleteClientEntrepriseRequest, ClientDeleteResponse>(
      getClientEntrepriseClient(),
      "delete"
    )(request),
};

export const clientPartenaire = {
  create: (request: CreateClientPartenaireRequest): Promise<ClientPartenaire> =>
    promisify<CreateClientPartenaireRequest, ClientPartenaire>(
      getClientPartenaireClient(),
      "create"
    )(request),

  update: (request: UpdateClientPartenaireRequest): Promise<ClientPartenaire> =>
    promisify<UpdateClientPartenaireRequest, ClientPartenaire>(
      getClientPartenaireClient(),
      "update"
    )(request),

  get: (request: GetClientPartenaireRequest): Promise<ClientPartenaire> =>
    promisify<GetClientPartenaireRequest, ClientPartenaire>(
      getClientPartenaireClient(),
      "get"
    )(request),

  list: (request: ListClientsPartenaireRequest): Promise<ListClientsPartenaireResponse> =>
    promisify<ListClientsPartenaireRequest, ListClientsPartenaireResponse>(
      getClientPartenaireClient(),
      "list"
    )(request),

  delete: (request: DeleteClientPartenaireRequest): Promise<ClientDeleteResponse> =>
    promisify<DeleteClientPartenaireRequest, ClientDeleteResponse>(
      getClientPartenaireClient(),
      "delete"
    )(request),
};

export const statutClient = {
  create: (request: CreateStatutClientRequest): Promise<StatutClient> =>
    promisify<CreateStatutClientRequest, StatutClient>(
      getStatutClientClient(),
      "create"
    )(request),

  update: (request: UpdateStatutClientRequest): Promise<StatutClient> =>
    promisify<UpdateStatutClientRequest, StatutClient>(
      getStatutClientClient(),
      "update"
    )(request),

  get: (request: GetStatutClientRequest): Promise<StatutClient> =>
    promisify<GetStatutClientRequest, StatutClient>(
      getStatutClientClient(),
      "get"
    )(request),

  getByCode: (request: GetStatutClientByCodeRequest): Promise<StatutClient> =>
    promisify<GetStatutClientByCodeRequest, StatutClient>(
      getStatutClientClient(),
      "getByCode"
    )(request),

  list: (request: ListStatutsClientRequest): Promise<ListStatutsClientResponse> =>
    promisify<ListStatutsClientRequest, ListStatutsClientResponse>(
      getStatutClientClient(),
      "list"
    )(request),

  delete: (request: DeleteStatutClientRequest): Promise<ClientDeleteResponse> =>
    promisify<DeleteStatutClientRequest, ClientDeleteResponse>(
      getStatutClientClient(),
      "delete"
    )(request),
};

export const conditionPaiement = {
  create: (request: CreateConditionPaiementRequest): Promise<ConditionPaiement> =>
    promisify<CreateConditionPaiementRequest, ConditionPaiement>(
      getConditionPaiementClient(),
      "create"
    )(request),

  update: (request: UpdateConditionPaiementRequest): Promise<ConditionPaiement> =>
    promisify<UpdateConditionPaiementRequest, ConditionPaiement>(
      getConditionPaiementClient(),
      "update"
    )(request),

  get: (request: GetConditionPaiementRequest): Promise<ConditionPaiement> =>
    promisify<GetConditionPaiementRequest, ConditionPaiement>(
      getConditionPaiementClient(),
      "get"
    )(request),

  getByCode: (request: GetConditionPaiementByCodeRequest): Promise<ConditionPaiement> =>
    promisify<GetConditionPaiementByCodeRequest, ConditionPaiement>(
      getConditionPaiementClient(),
      "getByCode"
    )(request),

  list: (request: ListConditionPaiementRequest): Promise<ListConditionPaiementResponse> =>
    promisify<ListConditionPaiementRequest, ListConditionPaiementResponse>(
      getConditionPaiementClient(),
      "list"
    )(request),

  delete: (request: DeleteConditionPaiementRequest): Promise<ReferentielDeleteResponse> =>
    promisify<DeleteConditionPaiementRequest, ReferentielDeleteResponse>(
      getConditionPaiementClient(),
      "delete"
    )(request),
};

export const emissionFacture = {
  create: (request: CreateEmissionFactureRequest): Promise<EmissionFacture> =>
    promisify<CreateEmissionFactureRequest, EmissionFacture>(
      getEmissionFactureClient(),
      "create"
    )(request),

  update: (request: UpdateEmissionFactureRequest): Promise<EmissionFacture> =>
    promisify<UpdateEmissionFactureRequest, EmissionFacture>(
      getEmissionFactureClient(),
      "update"
    )(request),

  get: (request: GetEmissionFactureRequest): Promise<EmissionFacture> =>
    promisify<GetEmissionFactureRequest, EmissionFacture>(
      getEmissionFactureClient(),
      "get"
    )(request),

  getByCode: (request: GetEmissionFactureByCodeRequest): Promise<EmissionFacture> =>
    promisify<GetEmissionFactureByCodeRequest, EmissionFacture>(
      getEmissionFactureClient(),
      "getByCode"
    )(request),

  list: (request: ListEmissionFactureRequest): Promise<ListEmissionFactureResponse> =>
    promisify<ListEmissionFactureRequest, ListEmissionFactureResponse>(
      getEmissionFactureClient(),
      "list"
    )(request),

  delete: (request: DeleteEmissionFactureRequest): Promise<ReferentielDeleteResponse> =>
    promisify<DeleteEmissionFactureRequest, ReferentielDeleteResponse>(
      getEmissionFactureClient(),
      "delete"
    )(request),
};

export const facturationPar = {
  create: (request: CreateFacturationParRequest): Promise<FacturationPar> =>
    promisify<CreateFacturationParRequest, FacturationPar>(
      getFacturationParClient(),
      "create"
    )(request),

  update: (request: UpdateFacturationParRequest): Promise<FacturationPar> =>
    promisify<UpdateFacturationParRequest, FacturationPar>(
      getFacturationParClient(),
      "update"
    )(request),

  get: (request: GetFacturationParRequest): Promise<FacturationPar> =>
    promisify<GetFacturationParRequest, FacturationPar>(
      getFacturationParClient(),
      "get"
    )(request),

  getByCode: (request: GetFacturationParByCodeRequest): Promise<FacturationPar> =>
    promisify<GetFacturationParByCodeRequest, FacturationPar>(
      getFacturationParClient(),
      "getByCode"
    )(request),

  list: (request: ListFacturationParRequest): Promise<ListFacturationParResponse> =>
    promisify<ListFacturationParRequest, ListFacturationParResponse>(
      getFacturationParClient(),
      "list"
    )(request),

  delete: (request: DeleteFacturationParRequest): Promise<ReferentielDeleteResponse> =>
    promisify<DeleteFacturationParRequest, ReferentielDeleteResponse>(
      getFacturationParClient(),
      "delete"
    )(request),
};

export const periodeFacturation = {
  create: (request: CreatePeriodeFacturationRequest): Promise<PeriodeFacturation> =>
    promisify<CreatePeriodeFacturationRequest, PeriodeFacturation>(
      getPeriodeFacturationClient(),
      "create"
    )(request),

  update: (request: UpdatePeriodeFacturationRequest): Promise<PeriodeFacturation> =>
    promisify<UpdatePeriodeFacturationRequest, PeriodeFacturation>(
      getPeriodeFacturationClient(),
      "update"
    )(request),

  get: (request: GetPeriodeFacturationRequest): Promise<PeriodeFacturation> =>
    promisify<GetPeriodeFacturationRequest, PeriodeFacturation>(
      getPeriodeFacturationClient(),
      "get"
    )(request),

  getByCode: (request: GetPeriodeFacturationByCodeRequest): Promise<PeriodeFacturation> =>
    promisify<GetPeriodeFacturationByCodeRequest, PeriodeFacturation>(
      getPeriodeFacturationClient(),
      "getByCode"
    )(request),

  list: (request: ListPeriodeFacturationRequest): Promise<ListPeriodeFacturationResponse> =>
    promisify<ListPeriodeFacturationRequest, ListPeriodeFacturationResponse>(
      getPeriodeFacturationClient(),
      "list"
    )(request),

  delete: (request: DeletePeriodeFacturationRequest): Promise<ReferentielDeleteResponse> =>
    promisify<DeletePeriodeFacturationRequest, ReferentielDeleteResponse>(
      getPeriodeFacturationClient(),
      "delete"
    )(request),
};

export const transporteurCompte = {
  create: (request: CreateTransporteurCompteRequest): Promise<TransporteurCompte> =>
    promisify<CreateTransporteurCompteRequest, TransporteurCompte>(
      getTransporteurCompteClient(),
      "create"
    )(request),

  update: (request: UpdateTransporteurCompteRequest): Promise<TransporteurCompte> =>
    promisify<UpdateTransporteurCompteRequest, TransporteurCompte>(
      getTransporteurCompteClient(),
      "update"
    )(request),

  get: (request: GetTransporteurCompteRequest): Promise<TransporteurCompte> =>
    promisify<GetTransporteurCompteRequest, TransporteurCompte>(
      getTransporteurCompteClient(),
      "get"
    )(request),

  listByOrganisation: (request: ListTransporteurByOrganisationRequest): Promise<ListTransporteurCompteResponse> =>
    promisify<ListTransporteurByOrganisationRequest, ListTransporteurCompteResponse>(
      getTransporteurCompteClient(),
      "listByOrganisation"
    )(request),

  list: (request: ListTransporteurCompteRequest): Promise<ListTransporteurCompteResponse> =>
    promisify<ListTransporteurCompteRequest, ListTransporteurCompteResponse>(
      getTransporteurCompteClient(),
      "list"
    )(request),

  activer: (request: ActivateTransporteurRequest): Promise<TransporteurCompte> =>
    promisify<ActivateTransporteurRequest, TransporteurCompte>(
      getTransporteurCompteClient(),
      "activer"
    )(request),

  desactiver: (request: ActivateTransporteurRequest): Promise<TransporteurCompte> =>
    promisify<ActivateTransporteurRequest, TransporteurCompte>(
      getTransporteurCompteClient(),
      "desactiver"
    )(request),

  delete: (request: DeleteTransporteurCompteRequest): Promise<ReferentielDeleteResponse> =>
    promisify<DeleteTransporteurCompteRequest, ReferentielDeleteResponse>(
      getTransporteurCompteClient(),
      "delete"
    )(request),
};

// Re-export types for convenience
export type {
  // ClientBase
  ClientBase,
  CreateClientBaseRequest,
  UpdateClientBaseRequest,
  ListClientsBaseRequest,
  ListClientsBaseResponse,
  // Adresse
  Adresse,
  CreateAdresseRequest,
  UpdateAdresseRequest,
  ListAdressesRequest,
  ListAdressesResponse,
  // ClientEntreprise
  ClientEntreprise,
  CreateClientEntrepriseRequest,
  UpdateClientEntrepriseRequest,
  ListClientsEntrepriseRequest,
  ListClientsEntrepriseResponse,
  // ClientPartenaire
  ClientPartenaire,
  CreateClientPartenaireRequest,
  UpdateClientPartenaireRequest,
  ListClientsPartenaireRequest,
  ListClientsPartenaireResponse,
  // StatutClient
  StatutClient,
  CreateStatutClientRequest,
  UpdateStatutClientRequest,
  ListStatutsClientRequest,
  ListStatutsClientResponse,
  // ConditionPaiement
  ConditionPaiement,
  CreateConditionPaiementRequest,
  UpdateConditionPaiementRequest,
  ListConditionPaiementRequest,
  ListConditionPaiementResponse,
  // EmissionFacture
  EmissionFacture,
  CreateEmissionFactureRequest,
  UpdateEmissionFactureRequest,
  ListEmissionFactureRequest,
  ListEmissionFactureResponse,
  // FacturationPar
  FacturationPar,
  CreateFacturationParRequest,
  UpdateFacturationParRequest,
  ListFacturationParRequest,
  ListFacturationParResponse,
  // PeriodeFacturation
  PeriodeFacturation,
  CreatePeriodeFacturationRequest,
  UpdatePeriodeFacturationRequest,
  ListPeriodeFacturationRequest,
  ListPeriodeFacturationResponse,
  // TransporteurCompte
  TransporteurCompte,
  CreateTransporteurCompteRequest,
  UpdateTransporteurCompteRequest,
  ListTransporteurCompteRequest,
  ListTransporteurCompteResponse,
};

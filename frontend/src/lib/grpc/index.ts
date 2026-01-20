/**
 * gRPC Client Configuration for Next.js Server Components
 *
 * Ce module fournit des clients gRPC typés pour appeler les microservices
 * depuis les Server Components Next.js.
 *
 * Usage dans un Server Component:
 * ```tsx
 * import { clients } from '@/lib/grpc'
 *
 * export default async function ClientsPage() {
 *   const result = await clients.list({ organisationId: 'org-1' })
 *   return <div>{result.clients.map(c => c.nom)}</div>
 * }
 * ```
 */

import { credentials, type ServiceError } from "@grpc/grpc-js";

// Service endpoints configuration
// Note: Les ports correspondent aux conteneurs Docker des microservices
const SERVICES = {
  activites: process.env.GRPC_ACTIVITES_URL || "localhost:60051",
  clients: process.env.GRPC_CLIENTS_URL || "localhost:60052",
  commerciaux: process.env.GRPC_COMMERCIAUX_URL || "localhost:60053",
  commission: process.env.GRPC_COMMISSION_URL || "localhost:60054",
  contrats: process.env.GRPC_CONTRATS_URL || "localhost:60055",
  dashboard: process.env.GRPC_DASHBOARD_URL || "localhost:60056",
  documents: process.env.GRPC_DOCUMENTS_URL || "localhost:60057",
  email: process.env.GRPC_EMAIL_URL || "localhost:60058",
  factures: process.env.GRPC_FACTURES_URL || "localhost:60059",
  logistics: process.env.GRPC_LOGISTICS_URL || "localhost:60060",
  notifications: process.env.GRPC_NOTIFICATIONS_URL || "localhost:60061",
  organisations: process.env.GRPC_ORGANISATIONS_URL || "localhost:60062", // crm-service-organisations
  payments: process.env.GRPC_PAYMENTS_URL || "localhost:60063", // crm-service-payments
  products: process.env.GRPC_PRODUCTS_URL || "localhost:60064",
  referentiel: process.env.GRPC_REFERENTIEL_URL || "localhost:60065",
  relance: process.env.GRPC_RELANCE_URL || "localhost:60066",
  users: process.env.GRPC_USERS_URL || "localhost:60067", // crm-service-users
} as const;

/**
 * Promisify a gRPC callback-style method
 */
function promisify<TRequest, TResponse>(
  client: unknown,
  method: string
): (request: TRequest) => Promise<TResponse> {
  return (request: TRequest): Promise<TResponse> => {
    return new Promise((resolve, reject) => {
      const fn = (client as Record<string, unknown>)[method] as (
        request: TRequest,
        callback: (error: ServiceError | null, response: TResponse) => void
      ) => void;

      fn.call(client, request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  };
}

// ============================================
// CLIENT SERVICE
// ============================================

import {
  ClientBaseServiceClient,
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
} from "@proto-grpc/clients/clients";

let clientBaseInstance: ClientBaseServiceClient | null = null;

function getClientBaseClient(): ClientBaseServiceClient {
  if (!clientBaseInstance) {
    clientBaseInstance = new ClientBaseServiceClient(
      SERVICES.clients,
      credentials.createInsecure()
    );
  }
  return clientBaseInstance;
}

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

// ============================================
// FACTURES SERVICE
// ============================================

import {
  FactureServiceClient,
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
} from "@proto-grpc/factures/factures";

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

// ============================================
// STATUT FACTURES SERVICE
// ============================================

import {
  StatutFactureServiceClient,
  type StatutFacture,
  type ListStatutsFactureRequest,
  type ListStatutsFactureResponse,
} from "@proto-grpc/factures/factures";

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

// ============================================
// PAYMENTS SERVICE
// ============================================

import {
  PaymentServiceClient,
  type CreateStripeCheckoutSessionRequest,
  type StripeCheckoutSessionResponse,
  type CreateStripePaymentIntentRequest,
  type StripePaymentIntentResponse,
  type CreateGoCardlessPaymentRequest,
  type GoCardlessPaymentResponse,
  type SetupGoCardlessMandateRequest,
  type GoCardlessMandateResponse,
  type CreateScheduleRequest,
  type ScheduleResponse,
  type GetByIdRequest,
} from "@proto-grpc/payments/payment";

let paymentInstance: PaymentServiceClient | null = null;

function getPaymentClient(): PaymentServiceClient {
  if (!paymentInstance) {
    paymentInstance = new PaymentServiceClient(
      SERVICES.payments,
      credentials.createInsecure()
    );
  }
  return paymentInstance;
}

export const payments = {
  // Stripe
  createStripeCheckoutSession: (
    request: CreateStripeCheckoutSessionRequest
  ): Promise<StripeCheckoutSessionResponse> =>
    promisify<CreateStripeCheckoutSessionRequest, StripeCheckoutSessionResponse>(
      getPaymentClient(),
      "createStripeCheckoutSession"
    )(request),

  createStripePaymentIntent: (
    request: CreateStripePaymentIntentRequest
  ): Promise<StripePaymentIntentResponse> =>
    promisify<CreateStripePaymentIntentRequest, StripePaymentIntentResponse>(
      getPaymentClient(),
      "createStripePaymentIntent"
    )(request),

  // GoCardless
  setupGoCardlessMandate: (
    request: SetupGoCardlessMandateRequest
  ): Promise<GoCardlessMandateResponse> =>
    promisify<SetupGoCardlessMandateRequest, GoCardlessMandateResponse>(
      getPaymentClient(),
      "setupGoCardlessMandate"
    )(request),

  createGoCardlessPayment: (
    request: CreateGoCardlessPaymentRequest
  ): Promise<GoCardlessPaymentResponse> =>
    promisify<CreateGoCardlessPaymentRequest, GoCardlessPaymentResponse>(
      getPaymentClient(),
      "createGoCardlessPayment"
    )(request),

  // Schedules
  createSchedule: (request: CreateScheduleRequest): Promise<ScheduleResponse> =>
    promisify<CreateScheduleRequest, ScheduleResponse>(
      getPaymentClient(),
      "createSchedule"
    )(request),

  getSchedule: (request: GetByIdRequest): Promise<ScheduleResponse> =>
    promisify<GetByIdRequest, ScheduleResponse>(
      getPaymentClient(),
      "getSchedule"
    )(request),
};

// ============================================
// CONTRATS SERVICE
// ============================================

import {
  ContratServiceClient,
  type Contrat,
  type CreateContratRequest,
  type UpdateContratRequest,
  type GetContratRequest,
  type ListContratRequest,
  type ListContratResponse,
  type DeleteContratRequest,
  type DeleteResponse as ContratDeleteResponse,
} from "@proto-grpc/contrats/contrats";

let contratInstance: ContratServiceClient | null = null;

function getContratClient(): ContratServiceClient {
  if (!contratInstance) {
    contratInstance = new ContratServiceClient(
      SERVICES.contrats,
      credentials.createInsecure()
    );
  }
  return contratInstance;
}

export const contrats = {
  create: (request: CreateContratRequest): Promise<Contrat> =>
    promisify<CreateContratRequest, Contrat>(
      getContratClient(),
      "create"
    )(request),

  update: (request: UpdateContratRequest): Promise<Contrat> =>
    promisify<UpdateContratRequest, Contrat>(
      getContratClient(),
      "update"
    )(request),

  get: (request: GetContratRequest): Promise<Contrat> =>
    promisify<GetContratRequest, Contrat>(getContratClient(), "get")(request),

  list: (request: ListContratRequest): Promise<ListContratResponse> =>
    promisify<ListContratRequest, ListContratResponse>(
      getContratClient(),
      "list"
    )(request),

  delete: (request: DeleteContratRequest): Promise<ContratDeleteResponse> =>
    promisify<DeleteContratRequest, ContratDeleteResponse>(
      getContratClient(),
      "delete"
    )(request),
};

// ============================================
// DASHBOARD SERVICE
// ============================================

import {
  DashboardKpisServiceClient,
  EvolutionCaServiceClient,
  RepartitionProduitsServiceClient,
  StatsSocietesServiceClient,
  type GetKpisRequest,
  type KpisResponse,
  type GetEvolutionCaRequest,
  type EvolutionCaResponse,
  type GetRepartitionProduitsRequest,
  type RepartitionProduitsResponse,
  type GetStatsSocietesRequest,
  type StatsSocietesResponse,
} from "@proto-grpc/dashboard/dashboard";

let dashboardKpisInstance: DashboardKpisServiceClient | null = null;
let evolutionCaInstance: EvolutionCaServiceClient | null = null;
let repartitionProduitsInstance: RepartitionProduitsServiceClient | null = null;
let statsSocietesInstance: StatsSocietesServiceClient | null = null;

function getDashboardKpisClient(): DashboardKpisServiceClient {
  if (!dashboardKpisInstance) {
    dashboardKpisInstance = new DashboardKpisServiceClient(
      SERVICES.dashboard,
      credentials.createInsecure()
    );
  }
  return dashboardKpisInstance;
}

function getEvolutionCaClient(): EvolutionCaServiceClient {
  if (!evolutionCaInstance) {
    evolutionCaInstance = new EvolutionCaServiceClient(
      SERVICES.dashboard,
      credentials.createInsecure()
    );
  }
  return evolutionCaInstance;
}

function getRepartitionProduitsClient(): RepartitionProduitsServiceClient {
  if (!repartitionProduitsInstance) {
    repartitionProduitsInstance = new RepartitionProduitsServiceClient(
      SERVICES.dashboard,
      credentials.createInsecure()
    );
  }
  return repartitionProduitsInstance;
}

function getStatsSocietesClient(): StatsSocietesServiceClient {
  if (!statsSocietesInstance) {
    statsSocietesInstance = new StatsSocietesServiceClient(
      SERVICES.dashboard,
      credentials.createInsecure()
    );
  }
  return statsSocietesInstance;
}

export const dashboard = {
  getKpis: (request: GetKpisRequest): Promise<KpisResponse> =>
    promisify<GetKpisRequest, KpisResponse>(
      getDashboardKpisClient(),
      "getKpis"
    )(request),

  getEvolutionCa: (request: GetEvolutionCaRequest): Promise<EvolutionCaResponse> =>
    promisify<GetEvolutionCaRequest, EvolutionCaResponse>(
      getEvolutionCaClient(),
      "getEvolutionCa"
    )(request),

  getRepartitionProduits: (
    request: GetRepartitionProduitsRequest
  ): Promise<RepartitionProduitsResponse> =>
    promisify<GetRepartitionProduitsRequest, RepartitionProduitsResponse>(
      getRepartitionProduitsClient(),
      "getRepartitionProduits"
    )(request),

  getStatsSocietes: (
    request: GetStatsSocietesRequest
  ): Promise<StatsSocietesResponse> =>
    promisify<GetStatsSocietesRequest, StatsSocietesResponse>(
      getStatsSocietesClient(),
      "getStatsSocietes"
    )(request),
};

// ============================================
// COMMERCIAL KPIS SERVICE
// ============================================

import {
  KpisCommerciauxServiceClient,
  AlertesServiceClient,
  type GetKpisCommerciauxRequest,
  type KpisCommerciauxResponse,
  type GetAlertesRequest,
  type AlertesResponse,
} from "@proto-grpc/dashboard/dashboard";

let kpisCommerciauxInstance: KpisCommerciauxServiceClient | null = null;

function getKpisCommerciauxClient(): KpisCommerciauxServiceClient {
  if (!kpisCommerciauxInstance) {
    kpisCommerciauxInstance = new KpisCommerciauxServiceClient(
      SERVICES.dashboard,
      credentials.createInsecure()
    );
  }
  return kpisCommerciauxInstance;
}

export const commercialKpis = {
  getKpisCommerciaux: (
    request: GetKpisCommerciauxRequest
  ): Promise<KpisCommerciauxResponse> =>
    promisify<GetKpisCommerciauxRequest, KpisCommerciauxResponse>(
      getKpisCommerciauxClient(),
      "getKpisCommerciaux"
    )(request),
};

// ============================================
// ALERTES SERVICE
// ============================================

let alertesInstance: AlertesServiceClient | null = null;

function getAlertesClient(): AlertesServiceClient {
  if (!alertesInstance) {
    alertesInstance = new AlertesServiceClient(
      SERVICES.dashboard,
      credentials.createInsecure()
    );
  }
  return alertesInstance;
}

export const alertes = {
  getAlertes: (request: GetAlertesRequest): Promise<AlertesResponse> =>
    promisify<GetAlertesRequest, AlertesResponse>(
      getAlertesClient(),
      "getAlertes"
    )(request),
};

// ============================================
// USERS SERVICE
// ============================================

import {
  UtilisateurServiceClient,
  type Utilisateur,
  type CreateUtilisateurRequest,
  type UpdateUtilisateurRequest,
  type GetUtilisateurRequest,
  type GetByKeycloakIdRequest,
  type ListUtilisateurRequest,
  type ListUtilisateurResponse,
  type DeleteUtilisateurRequest,
  type DeleteResponse as UserDeleteResponse,
} from "@proto-grpc/organisations/users";

let utilisateurInstance: UtilisateurServiceClient | null = null;

function getUtilisateurClient(): UtilisateurServiceClient {
  if (!utilisateurInstance) {
    utilisateurInstance = new UtilisateurServiceClient(
      SERVICES.users,
      credentials.createInsecure()
    );
  }
  return utilisateurInstance;
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

// ============================================
// COMMERCIAUX (APPORTEURS) SERVICE
// ============================================

import {
  ApporteurServiceClient,
  type Apporteur,
  type CreateApporteurRequest,
  type UpdateApporteurRequest,
  type GetApporteurRequest,
  type ListApporteurByOrganisationRequest,
  type ListApporteurResponse,
  type ActivateApporteurRequest,
  type DeleteApporteurRequest,
  type DeleteResponse as ApporteurDeleteResponse,
} from "@proto-grpc/commerciaux/commerciaux";

let apporteurInstance: ApporteurServiceClient | null = null;

function getApporteurClient(): ApporteurServiceClient {
  if (!apporteurInstance) {
    apporteurInstance = new ApporteurServiceClient(
      SERVICES.commerciaux,
      credentials.createInsecure()
    );
  }
  return apporteurInstance;
}

export const apporteurs = {
  create: (request: CreateApporteurRequest): Promise<Apporteur> =>
    promisify<CreateApporteurRequest, Apporteur>(
      getApporteurClient(),
      "create"
    )(request),

  update: (request: UpdateApporteurRequest): Promise<Apporteur> =>
    promisify<UpdateApporteurRequest, Apporteur>(
      getApporteurClient(),
      "update"
    )(request),

  get: (request: GetApporteurRequest): Promise<Apporteur> =>
    promisify<GetApporteurRequest, Apporteur>(
      getApporteurClient(),
      "get"
    )(request),

  listByOrganisation: (
    request: ListApporteurByOrganisationRequest
  ): Promise<ListApporteurResponse> =>
    promisify<ListApporteurByOrganisationRequest, ListApporteurResponse>(
      getApporteurClient(),
      "listByOrganisation"
    )(request),

  activer: (request: ActivateApporteurRequest): Promise<Apporteur> =>
    promisify<ActivateApporteurRequest, Apporteur>(
      getApporteurClient(),
      "activer"
    )(request),

  desactiver: (request: ActivateApporteurRequest): Promise<Apporteur> =>
    promisify<ActivateApporteurRequest, Apporteur>(
      getApporteurClient(),
      "desactiver"
    )(request),

  delete: (request: DeleteApporteurRequest): Promise<ApporteurDeleteResponse> =>
    promisify<DeleteApporteurRequest, ApporteurDeleteResponse>(
      getApporteurClient(),
      "delete"
    )(request),
};

// ============================================
// REFERENTIEL - STATUT CLIENT SERVICE
// ============================================

import {
  StatutClientServiceClient,
  type StatutClient,
  type ListStatutClientRequest,
  type ListStatutClientResponse,
} from "@proto-grpc/referentiel/referentiel";

let statutClientInstance: StatutClientServiceClient | null = null;

function getStatutClientClient(): StatutClientServiceClient {
  if (!statutClientInstance) {
    statutClientInstance = new StatutClientServiceClient(
      SERVICES.referentiel,
      credentials.createInsecure()
    );
  }
  return statutClientInstance;
}

export const statutClients = {
  list: (request: ListStatutClientRequest): Promise<ListStatutClientResponse> =>
    promisify<ListStatutClientRequest, ListStatutClientResponse>(
      getStatutClientClient(),
      "list"
    )(request),
};

// ============================================
// LOGISTICS (EXPEDITIONS) SERVICE
// ============================================

import {
  LogisticsServiceClient,
  type ExpeditionResponse,
  type ExpeditionListResponse,
  type GetExpeditionsByClientRequest,
  type GetExpeditionsByOrganisationRequest,
  type CreateExpeditionRequest,
  type UpdateExpeditionRequest,
  type GetByIdRequest as LogisticsGetByIdRequest,
  type DeleteResponse as LogisticsDeleteResponse,
} from "@proto-grpc/logistics/logistics";

let logisticsInstance: LogisticsServiceClient | null = null;

function getLogisticsClient(): LogisticsServiceClient {
  if (!logisticsInstance) {
    logisticsInstance = new LogisticsServiceClient(
      SERVICES.logistics,
      credentials.createInsecure()
    );
  }
  return logisticsInstance;
}

export const logistics = {
  createExpedition: (request: CreateExpeditionRequest): Promise<ExpeditionResponse> =>
    promisify<CreateExpeditionRequest, ExpeditionResponse>(
      getLogisticsClient(),
      "createExpedition"
    )(request),

  getExpedition: (request: LogisticsGetByIdRequest): Promise<ExpeditionResponse> =>
    promisify<LogisticsGetByIdRequest, ExpeditionResponse>(
      getLogisticsClient(),
      "getExpedition"
    )(request),

  getExpeditionsByClient: (
    request: GetExpeditionsByClientRequest
  ): Promise<ExpeditionListResponse> =>
    promisify<GetExpeditionsByClientRequest, ExpeditionListResponse>(
      getLogisticsClient(),
      "getExpeditionsByClient"
    )(request),

  getExpeditionsByOrganisation: (
    request: GetExpeditionsByOrganisationRequest
  ): Promise<ExpeditionListResponse> =>
    promisify<GetExpeditionsByOrganisationRequest, ExpeditionListResponse>(
      getLogisticsClient(),
      "getExpeditionsByOrganisation"
    )(request),

  updateExpedition: (request: UpdateExpeditionRequest): Promise<ExpeditionResponse> =>
    promisify<UpdateExpeditionRequest, ExpeditionResponse>(
      getLogisticsClient(),
      "updateExpedition"
    )(request),

  deleteExpedition: (request: LogisticsGetByIdRequest): Promise<LogisticsDeleteResponse> =>
    promisify<LogisticsGetByIdRequest, LogisticsDeleteResponse>(
      getLogisticsClient(),
      "deleteExpedition"
    )(request),
};

// ============================================
// COMMISSION SERVICE
// ============================================

import {
  CommissionServiceClient,
  type GetByIdRequest as CommissionGetByIdRequest,
  type GetCommissionsRequest,
  type CreateCommissionRequest,
  type UpdateCommissionRequest,
  type CommissionResponse,
  type CommissionListResponse,
  type DeleteResponse as CommissionDeleteResponse,
  // Bordereaux
  type GetBordereauxRequest,
  type CreateBordereauRequest,
  type UpdateBordereauRequest,
  type ValidateBordereauRequest,
  type BordereauResponse,
  type BordereauListResponse,
  type ExportBordereauResponse,
  // Reprises
  type GetReprisesRequest,
  type CreateRepriseRequest,
  type ApplyRepriseRequest,
  type RepriseResponse,
  type RepriseListResponse,
  // Statuts
  type GetStatutsRequest as GetStatutsCommissionRequest,
  type StatutResponse as StatutCommissionResponse,
  type StatutListResponse as StatutCommissionListResponse,
  // Engine
  type CalculerCommissionRequest,
  type CalculerCommissionResponse,
  type GenererBordereauRequest,
  type GenererBordereauResponse,
  type DeclencherRepriseRequest,
  // Barèmes
  type GetBaremesRequest,
  type CreateBaremeRequest,
  type UpdateBaremeRequest,
  type GetBaremeApplicableRequest,
  type BaremeResponse,
  type BaremeListResponse,
  // Paliers
  type GetByBaremeRequest,
  type CreatePalierRequest,
  type UpdatePalierRequest,
  type PalierResponse,
  type PalierListResponse,
} from "@proto-grpc/commission/commission";

let commissionInstance: CommissionServiceClient | null = null;

function getCommissionClient(): CommissionServiceClient {
  if (!commissionInstance) {
    commissionInstance = new CommissionServiceClient(
      SERVICES.commission,
      credentials.createInsecure()
    );
  }
  return commissionInstance;
}

export const commissions = {
  // === Commission CRUD ===
  create: (request: CreateCommissionRequest): Promise<CommissionResponse> =>
    promisify<CreateCommissionRequest, CommissionResponse>(
      getCommissionClient(),
      "createCommission"
    )(request),

  get: (request: CommissionGetByIdRequest): Promise<CommissionResponse> =>
    promisify<CommissionGetByIdRequest, CommissionResponse>(
      getCommissionClient(),
      "getCommission"
    )(request),

  list: (request: GetCommissionsRequest): Promise<CommissionListResponse> =>
    promisify<GetCommissionsRequest, CommissionListResponse>(
      getCommissionClient(),
      "getCommissions"
    )(request),

  update: (request: UpdateCommissionRequest): Promise<CommissionResponse> =>
    promisify<UpdateCommissionRequest, CommissionResponse>(
      getCommissionClient(),
      "updateCommission"
    )(request),

  delete: (request: CommissionGetByIdRequest): Promise<CommissionDeleteResponse> =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(
      getCommissionClient(),
      "deleteCommission"
    )(request),

  // === Statuts ===
  getStatuts: (request: GetStatutsCommissionRequest): Promise<StatutCommissionListResponse> =>
    promisify<GetStatutsCommissionRequest, StatutCommissionListResponse>(
      getCommissionClient(),
      "getStatuts"
    )(request),

  // === Commission Engine ===
  calculer: (request: CalculerCommissionRequest): Promise<CalculerCommissionResponse> =>
    promisify<CalculerCommissionRequest, CalculerCommissionResponse>(
      getCommissionClient(),
      "calculerCommission"
    )(request),

  genererBordereau: (request: GenererBordereauRequest): Promise<GenererBordereauResponse> =>
    promisify<GenererBordereauRequest, GenererBordereauResponse>(
      getCommissionClient(),
      "genererBordereau"
    )(request),

  declencherReprise: (request: DeclencherRepriseRequest): Promise<RepriseResponse> =>
    promisify<DeclencherRepriseRequest, RepriseResponse>(
      getCommissionClient(),
      "declencherReprise"
    )(request),
};

export const bordereaux = {
  create: (request: CreateBordereauRequest): Promise<BordereauResponse> =>
    promisify<CreateBordereauRequest, BordereauResponse>(
      getCommissionClient(),
      "createBordereau"
    )(request),

  get: (request: CommissionGetByIdRequest): Promise<BordereauResponse> =>
    promisify<CommissionGetByIdRequest, BordereauResponse>(
      getCommissionClient(),
      "getBordereau"
    )(request),

  list: (request: GetBordereauxRequest): Promise<BordereauListResponse> =>
    promisify<GetBordereauxRequest, BordereauListResponse>(
      getCommissionClient(),
      "getBordereaux"
    )(request),

  update: (request: UpdateBordereauRequest): Promise<BordereauResponse> =>
    promisify<UpdateBordereauRequest, BordereauResponse>(
      getCommissionClient(),
      "updateBordereau"
    )(request),

  validate: (request: ValidateBordereauRequest): Promise<BordereauResponse> =>
    promisify<ValidateBordereauRequest, BordereauResponse>(
      getCommissionClient(),
      "validateBordereau"
    )(request),

  export: (request: CommissionGetByIdRequest): Promise<ExportBordereauResponse> =>
    promisify<CommissionGetByIdRequest, ExportBordereauResponse>(
      getCommissionClient(),
      "exportBordereau"
    )(request),

  delete: (request: CommissionGetByIdRequest): Promise<CommissionDeleteResponse> =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(
      getCommissionClient(),
      "deleteBordereau"
    )(request),
};

export const reprises = {
  create: (request: CreateRepriseRequest): Promise<RepriseResponse> =>
    promisify<CreateRepriseRequest, RepriseResponse>(
      getCommissionClient(),
      "createReprise"
    )(request),

  get: (request: CommissionGetByIdRequest): Promise<RepriseResponse> =>
    promisify<CommissionGetByIdRequest, RepriseResponse>(
      getCommissionClient(),
      "getReprise"
    )(request),

  list: (request: GetReprisesRequest): Promise<RepriseListResponse> =>
    promisify<GetReprisesRequest, RepriseListResponse>(
      getCommissionClient(),
      "getReprises"
    )(request),

  apply: (request: ApplyRepriseRequest): Promise<RepriseResponse> =>
    promisify<ApplyRepriseRequest, RepriseResponse>(
      getCommissionClient(),
      "applyReprise"
    )(request),

  cancel: (request: CommissionGetByIdRequest): Promise<RepriseResponse> =>
    promisify<CommissionGetByIdRequest, RepriseResponse>(
      getCommissionClient(),
      "cancelReprise"
    )(request),

  delete: (request: CommissionGetByIdRequest): Promise<CommissionDeleteResponse> =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(
      getCommissionClient(),
      "deleteReprise"
    )(request),
};

export const baremes = {
  create: (request: CreateBaremeRequest): Promise<BaremeResponse> =>
    promisify<CreateBaremeRequest, BaremeResponse>(
      getCommissionClient(),
      "createBareme"
    )(request),

  get: (request: CommissionGetByIdRequest): Promise<BaremeResponse> =>
    promisify<CommissionGetByIdRequest, BaremeResponse>(
      getCommissionClient(),
      "getBareme"
    )(request),

  list: (request: GetBaremesRequest): Promise<BaremeListResponse> =>
    promisify<GetBaremesRequest, BaremeListResponse>(
      getCommissionClient(),
      "getBaremes"
    )(request),

  getApplicable: (request: GetBaremeApplicableRequest): Promise<BaremeResponse> =>
    promisify<GetBaremeApplicableRequest, BaremeResponse>(
      getCommissionClient(),
      "getBaremeApplicable"
    )(request),

  update: (request: UpdateBaremeRequest): Promise<BaremeResponse> =>
    promisify<UpdateBaremeRequest, BaremeResponse>(
      getCommissionClient(),
      "updateBareme"
    )(request),

  delete: (request: CommissionGetByIdRequest): Promise<CommissionDeleteResponse> =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(
      getCommissionClient(),
      "deleteBareme"
    )(request),
};

export const paliers = {
  create: (request: CreatePalierRequest): Promise<PalierResponse> =>
    promisify<CreatePalierRequest, PalierResponse>(
      getCommissionClient(),
      "createPalier"
    )(request),

  get: (request: CommissionGetByIdRequest): Promise<PalierResponse> =>
    promisify<CommissionGetByIdRequest, PalierResponse>(
      getCommissionClient(),
      "getPalier"
    )(request),

  listByBareme: (request: GetByBaremeRequest): Promise<PalierListResponse> =>
    promisify<GetByBaremeRequest, PalierListResponse>(
      getCommissionClient(),
      "getPaliersByBareme"
    )(request),

  update: (request: UpdatePalierRequest): Promise<PalierResponse> =>
    promisify<UpdatePalierRequest, PalierResponse>(
      getCommissionClient(),
      "updatePalier"
    )(request),

  delete: (request: CommissionGetByIdRequest): Promise<CommissionDeleteResponse> =>
    promisify<CommissionGetByIdRequest, CommissionDeleteResponse>(
      getCommissionClient(),
      "deletePalier"
    )(request),
};

// ============================================
// PRODUCTS SERVICE (Gammes & Produits)
// ============================================

import {
  GammeServiceClient,
  ProduitServiceClient,
  type Gamme,
  type CreateGammeRequest,
  type UpdateGammeRequest,
  type GetGammeRequest,
  type ListGammesRequest,
  type ListGammesResponse,
  type DeleteGammeRequest,
  type DeleteGammeResponse,
  type Produit,
  type CreateProduitRequest,
  type UpdateProduitRequest,
  type GetProduitRequest,
  type ListProduitsRequest,
  type ListProduitsResponse,
  type DeleteProduitRequest,
  type DeleteProduitResponse,
  type SetPromotionRequest,
  type ClearPromotionRequest,
} from "@proto-grpc/products/products";

let gammeInstance: GammeServiceClient | null = null;
let produitInstance: ProduitServiceClient | null = null;

function getGammeClient(): GammeServiceClient {
  if (!gammeInstance) {
    gammeInstance = new GammeServiceClient(
      SERVICES.products,
      credentials.createInsecure()
    );
  }
  return gammeInstance;
}

function getProduitClient(): ProduitServiceClient {
  if (!produitInstance) {
    produitInstance = new ProduitServiceClient(
      SERVICES.products,
      credentials.createInsecure()
    );
  }
  return produitInstance;
}

export const gammes = {
  create: (request: CreateGammeRequest): Promise<Gamme> =>
    promisify<CreateGammeRequest, Gamme>(getGammeClient(), "create")(request),

  get: (request: GetGammeRequest): Promise<Gamme> =>
    promisify<GetGammeRequest, Gamme>(getGammeClient(), "get")(request),

  list: (request: ListGammesRequest): Promise<ListGammesResponse> =>
    promisify<ListGammesRequest, ListGammesResponse>(
      getGammeClient(),
      "list"
    )(request),

  update: (request: UpdateGammeRequest): Promise<Gamme> =>
    promisify<UpdateGammeRequest, Gamme>(getGammeClient(), "update")(request),

  delete: (request: DeleteGammeRequest): Promise<DeleteGammeResponse> =>
    promisify<DeleteGammeRequest, DeleteGammeResponse>(
      getGammeClient(),
      "delete"
    )(request),
};

export const produits = {
  create: (request: CreateProduitRequest): Promise<Produit> =>
    promisify<CreateProduitRequest, Produit>(
      getProduitClient(),
      "create"
    )(request),

  get: (request: GetProduitRequest): Promise<Produit> =>
    promisify<GetProduitRequest, Produit>(getProduitClient(), "get")(request),

  list: (request: ListProduitsRequest): Promise<ListProduitsResponse> =>
    promisify<ListProduitsRequest, ListProduitsResponse>(
      getProduitClient(),
      "list"
    )(request),

  update: (request: UpdateProduitRequest): Promise<Produit> =>
    promisify<UpdateProduitRequest, Produit>(
      getProduitClient(),
      "update"
    )(request),

  delete: (request: DeleteProduitRequest): Promise<DeleteProduitResponse> =>
    promisify<DeleteProduitRequest, DeleteProduitResponse>(
      getProduitClient(),
      "delete"
    )(request),

  setPromotion: (request: SetPromotionRequest): Promise<Produit> =>
    promisify<SetPromotionRequest, Produit>(
      getProduitClient(),
      "setPromotion"
    )(request),

  clearPromotion: (request: ClearPromotionRequest): Promise<Produit> =>
    promisify<ClearPromotionRequest, Produit>(
      getProduitClient(),
      "clearPromotion"
    )(request),
};

// ============================================
// SOCIETES SERVICE
// ============================================

import {
  SocieteServiceClient,
  type Societe,
  type CreateSocieteRequest,
  type UpdateSocieteRequest,
  type GetSocieteRequest,
  type ListSocieteByOrganisationRequest,
  type ListSocieteResponse,
  type DeleteSocieteRequest,
  type DeleteResponse as SocieteDeleteResponse,
} from "@proto-grpc/organisations/organisations";

let societeInstance: SocieteServiceClient | null = null;

function getSocieteClient(): SocieteServiceClient {
  if (!societeInstance) {
    societeInstance = new SocieteServiceClient(
      SERVICES.organisations,
      credentials.createInsecure()
    );
  }
  return societeInstance;
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

// ============================================
// TACHES SERVICE
// ============================================

import {
  TacheServiceClient,
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
} from "@proto-grpc/activites/activites";

let tacheInstance: TacheServiceClient | null = null;

function getTacheClient(): TacheServiceClient {
  if (!tacheInstance) {
    tacheInstance = new TacheServiceClient(
      SERVICES.activites,
      credentials.createInsecure()
    );
  }
  return tacheInstance;
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

// ============================================
// RELANCE SERVICE (Règles de relance automatiques)
// ============================================

import {
  RegleRelanceServiceClient,
  HistoriqueRelanceServiceClient,
  RelanceEngineServiceClient,
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
} from "@proto-grpc/relance/relance";

let regleRelanceInstance: RegleRelanceServiceClient | null = null;
let historiqueRelanceInstance: HistoriqueRelanceServiceClient | null = null;
let relanceEngineInstance: RelanceEngineServiceClient | null = null;

function getRegleRelanceClient(): RegleRelanceServiceClient {
  if (!regleRelanceInstance) {
    regleRelanceInstance = new RegleRelanceServiceClient(
      SERVICES.relance,
      credentials.createInsecure()
    );
  }
  return regleRelanceInstance;
}

function getHistoriqueRelanceClient(): HistoriqueRelanceServiceClient {
  if (!historiqueRelanceInstance) {
    historiqueRelanceInstance = new HistoriqueRelanceServiceClient(
      SERVICES.relance,
      credentials.createInsecure()
    );
  }
  return historiqueRelanceInstance;
}

function getRelanceEngineClient(): RelanceEngineServiceClient {
  if (!relanceEngineInstance) {
    relanceEngineInstance = new RelanceEngineServiceClient(
      SERVICES.relance,
      credentials.createInsecure()
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

// ============================================
// MEMBRE COMPTE SERVICE
// ============================================

import {
  MembreCompteServiceClient,
  CompteServiceClient,
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
  type SyncKeycloakUserRequest,
} from "@proto-grpc/organisations/users";

let membreCompteInstance: MembreCompteServiceClient | null = null;

function getMembreCompteClient(): MembreCompteServiceClient {
  if (!membreCompteInstance) {
    membreCompteInstance = new MembreCompteServiceClient(
      SERVICES.users,
      credentials.createInsecure()
    );
  }
  return membreCompteInstance;
}

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

// ============================================
// COMPTE SERVICE (Organisation/Compte management)
// ============================================

let compteInstance: CompteServiceClient | null = null;

function getCompteClient(): CompteServiceClient {
  if (!compteInstance) {
    compteInstance = new CompteServiceClient(
      SERVICES.users,
      credentials.createInsecure()
    );
  }
  return compteInstance;
}

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

// ============================================
// NOTIFICATIONS SERVICE
// ============================================

import {
  NotificationServiceClient,
  type NotificationResponse,
  type NotificationListResponse,
  type GetNotificationsByUserRequest,
  type MarkAsReadRequest,
  type MarkAllAsReadRequest,
  type DeleteNotificationRequest,
  type DeleteAllByUserRequest,
  type OperationResponse,
  type UnreadCountResponse,
  type GetUnreadCountRequest,
} from "@proto-grpc/notifications/notifications";

let notificationInstance: NotificationServiceClient | null = null;

function getNotificationClient(): NotificationServiceClient {
  if (!notificationInstance) {
    notificationInstance = new NotificationServiceClient(
      SERVICES.notifications,
      credentials.createInsecure()
    );
  }
  return notificationInstance;
}

export const notifications = {
  getByUser: (request: GetNotificationsByUserRequest): Promise<NotificationListResponse> =>
    promisify<GetNotificationsByUserRequest, NotificationListResponse>(
      getNotificationClient(),
      "getNotificationsByUser"
    )(request),

  getUnreadByUser: (request: GetNotificationsByUserRequest): Promise<NotificationListResponse> =>
    promisify<GetNotificationsByUserRequest, NotificationListResponse>(
      getNotificationClient(),
      "getUnreadNotificationsByUser"
    )(request),

  getCount: (request: GetUnreadCountRequest): Promise<UnreadCountResponse> =>
    promisify<GetUnreadCountRequest, UnreadCountResponse>(
      getNotificationClient(),
      "getUnreadCount"
    )(request),

  markAsRead: (request: MarkAsReadRequest): Promise<OperationResponse> =>
    promisify<MarkAsReadRequest, OperationResponse>(
      getNotificationClient(),
      "markAsRead"
    )(request),

  markAllAsRead: (request: MarkAllAsReadRequest): Promise<OperationResponse> =>
    promisify<MarkAllAsReadRequest, OperationResponse>(
      getNotificationClient(),
      "markAllAsRead"
    )(request),

  delete: (request: DeleteNotificationRequest): Promise<OperationResponse> =>
    promisify<DeleteNotificationRequest, OperationResponse>(
      getNotificationClient(),
      "delete"
    )(request),

  deleteAll: (request: DeleteAllByUserRequest): Promise<OperationResponse> =>
    promisify<DeleteAllByUserRequest, OperationResponse>(
      getNotificationClient(),
      "deleteAllByUser"
    )(request),
};

// ============================================
// ORGANISATIONS SERVICE
// ============================================

import {
  OrganisationServiceClient,
  type Organisation,
  type CreateOrganisationRequest,
  type UpdateOrganisationRequest,
  type GetOrganisationRequest,
  type DeleteOrganisationRequest,
  type ListOrganisationRequest,
  type ListOrganisationResponse,
  type DeleteResponse as OrganisationDeleteResponse,
} from "@proto-grpc/organisations/organisations";

let organisationInstance: OrganisationServiceClient | null = null;

function getOrganisationClient(): OrganisationServiceClient {
  if (!organisationInstance) {
    organisationInstance = new OrganisationServiceClient(
      SERVICES.organisations,
      credentials.createInsecure()
    );
  }
  return organisationInstance;
}

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

// ============================================
// ROLES SERVICE
// ============================================

import {
  RoleServiceClient,
  type Role,
  type GetRoleRequest,
  type ListRoleRequest,
  type ListRoleResponse,
} from "@proto-grpc/organisations/users";

let roleInstance: RoleServiceClient | null = null;

function getRoleClient(): RoleServiceClient {
  if (!roleInstance) {
    roleInstance = new RoleServiceClient(
      SERVICES.users,
      credentials.createInsecure()
    );
  }
  return roleInstance;
}

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

// ============================================
// ROLE PARTENAIRE SERVICE (Organisation Roles)
// ============================================

import {
  RolePartenaireServiceClient,
  type RolePartenaire,
  type CreateRolePartenaireRequest,
  type UpdateRolePartenaireRequest,
  type GetRolePartenaireRequest,
  type ListRolePartenaireRequest,
  type ListRolePartenaireResponse,
  type DeleteRolePartenaireRequest,
  type DeleteResponse as RolePartenaireDeleteResponse,
} from "@proto-grpc/organisations/organisations";

let rolePartenaireInstance: RolePartenaireServiceClient | null = null;

function getRolePartenaireClient(): RolePartenaireServiceClient {
  if (!rolePartenaireInstance) {
    rolePartenaireInstance = new RolePartenaireServiceClient(
      SERVICES.organisations,
      credentials.createInsecure()
    );
  }
  return rolePartenaireInstance;
}

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

// ============================================
// MEMBRE PARTENAIRE SERVICE (Organisation Members)
// ============================================

import {
  MembrePartenaireServiceClient,
  type MembrePartenaire,
  type CreateMembrePartenaireRequest,
  type UpdateMembrePartenaireRequest,
  type GetMembrePartenaireRequest,
  type ListMembreByPartenaireRequest,
  type ListMembreByUtilisateurRequest,
  type ListMembrePartenaireResponse,
  type DeleteMembrePartenaireRequest,
  type DeleteResponse as MembrePartenaireDeleteResponse,
} from "@proto-grpc/organisations/organisations";

let membrePartenaireInstance: MembrePartenaireServiceClient | null = null;

function getMembrePartenaireClient(): MembrePartenaireServiceClient {
  if (!membrePartenaireInstance) {
    membrePartenaireInstance = new MembrePartenaireServiceClient(
      SERVICES.organisations,
      credentials.createInsecure()
    );
  }
  return membrePartenaireInstance;
}

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

// ============================================
// INVITATION COMPTE SERVICE (Organisation Invitations)
// ============================================

import {
  InvitationCompteServiceClient,
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
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
} from "@proto-grpc/organisations/organisations";

let invitationCompteInstance: InvitationCompteServiceClient | null = null;

function getInvitationCompteClient(): InvitationCompteServiceClient {
  if (!invitationCompteInstance) {
    invitationCompteInstance = new InvitationCompteServiceClient(
      SERVICES.organisations,
      credentials.createInsecure()
    );
  }
  return invitationCompteInstance;
}

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

// Re-export types for convenience
export type {
  // Clients
  ClientBase,
  CreateClientBaseRequest,
  UpdateClientBaseRequest,
  ListClientsBaseRequest,
  ListClientsBaseResponse,
  // Factures
  Facture,
  CreateFactureRequest,
  ListFacturesRequest,
  ListFacturesResponse,
  // StatutFacture
  StatutFacture,
  ListStatutsFactureResponse,
  // Contrats
  Contrat,
  CreateContratRequest,
  ListContratRequest,
  ListContratResponse,
  // Users
  Utilisateur,
  CreateUtilisateurRequest,
  ListUtilisateurRequest,
  ListUtilisateurResponse,
  // Apporteurs
  Apporteur,
  CreateApporteurRequest,
  UpdateApporteurRequest,
  ListApporteurByOrganisationRequest,
  ListApporteurResponse,
  // StatutClient
  StatutClient,
  ListStatutClientResponse,
  // Logistics
  ExpeditionResponse,
  ExpeditionListResponse,
  GetExpeditionsByClientRequest,
  // Commissions
  CommissionResponse,
  CommissionListResponse,
  GetCommissionsRequest,
  // Bordereaux
  BordereauResponse,
  BordereauListResponse,
  GetBordereauxRequest,
  ExportBordereauResponse,
  // Reprises
  RepriseResponse,
  RepriseListResponse,
  GetReprisesRequest,
  // Statuts Commission
  StatutCommissionListResponse,
  // Commission Engine
  GenererBordereauRequest,
  GenererBordereauResponse,
  CalculerCommissionRequest,
  CalculerCommissionResponse,
  // Relance
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
  // Membres
  MembreCompte,
  CreateMembreCompteRequest,
  UpdateMembreCompteRequest,
  ListByOrganisationRequest,
  ListMembreCompteResponse,
  // Organisations
  Organisation,
  GetOrganisationRequest,
  ListOrganisationRequest,
  ListOrganisationResponse,
  // Roles
  Role,
  GetRoleRequest,
  ListRoleRequest,
  ListRoleResponse,
  // Role Partenaire
  RolePartenaire,
  CreateRolePartenaireRequest,
  UpdateRolePartenaireRequest,
  ListRolePartenaireRequest,
  ListRolePartenaireResponse,
  // Membre Partenaire
  MembrePartenaire,
  CreateMembrePartenaireRequest,
  UpdateMembrePartenaireRequest,
  ListMembreByPartenaireRequest,
  ListMembreByUtilisateurRequest,
  ListMembrePartenaireResponse,
  // Invitation Compte
  InvitationCompte,
  CreateInvitationCompteRequest,
  UpdateInvitationCompteRequest,
  ListInvitationByOrganisationRequest,
  ListInvitationCompteResponse,
};

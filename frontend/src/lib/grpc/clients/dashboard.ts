import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify } from "./config";
import {
  DashboardKpisServiceClient,
  EvolutionCaServiceClient,
  RepartitionProduitsServiceClient,
  StatsSocietesServiceClient,
  KpisCommerciauxServiceClient,
  AlertesServiceClient,
  type GetKpisRequest,
  type KpisResponse,
  type GetEvolutionCaRequest,
  type EvolutionCaResponse,
  type GetRepartitionProduitsRequest,
  type RepartitionProduitsResponse,
  type GetStatsSocietesRequest,
  type StatsSocietesResponse,
  type GetKpisCommerciauxRequest,
  type KpisCommerciauxResponse,
  type GetAlertesRequest,
  type AlertesResponse,
} from "@proto/dashboard/dashboard";

let dashboardKpisInstance: DashboardKpisServiceClient | null = null;
let evolutionCaInstance: EvolutionCaServiceClient | null = null;
let repartitionProduitsInstance: RepartitionProduitsServiceClient | null = null;
let statsSocietesInstance: StatsSocietesServiceClient | null = null;
let kpisCommerciauxInstance: KpisCommerciauxServiceClient | null = null;
let alertesInstance: AlertesServiceClient | null = null;

function getDashboardKpisClient(): DashboardKpisServiceClient {
  if (!dashboardKpisInstance) {
    dashboardKpisInstance = new DashboardKpisServiceClient(
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return dashboardKpisInstance;
}

function getEvolutionCaClient(): EvolutionCaServiceClient {
  if (!evolutionCaInstance) {
    evolutionCaInstance = new EvolutionCaServiceClient(
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return evolutionCaInstance;
}

function getRepartitionProduitsClient(): RepartitionProduitsServiceClient {
  if (!repartitionProduitsInstance) {
    repartitionProduitsInstance = new RepartitionProduitsServiceClient(
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return repartitionProduitsInstance;
}

function getStatsSocietesClient(): StatsSocietesServiceClient {
  if (!statsSocietesInstance) {
    statsSocietesInstance = new StatsSocietesServiceClient(
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return statsSocietesInstance;
}

function getKpisCommerciauxClient(): KpisCommerciauxServiceClient {
  if (!kpisCommerciauxInstance) {
    kpisCommerciauxInstance = new KpisCommerciauxServiceClient(
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return kpisCommerciauxInstance;
}

function getAlertesClient(): AlertesServiceClient {
  if (!alertesInstance) {
    alertesInstance = new AlertesServiceClient(
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return alertesInstance;
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

export const commercialKpis = {
  getKpisCommerciaux: (
    request: GetKpisCommerciauxRequest
  ): Promise<KpisCommerciauxResponse> =>
    promisify<GetKpisCommerciauxRequest, KpisCommerciauxResponse>(
      getKpisCommerciauxClient(),
      "getKpisCommerciaux"
    )(request),
};

export const alertes = {
  getAlertes: (request: GetAlertesRequest): Promise<AlertesResponse> =>
    promisify<GetAlertesRequest, AlertesResponse>(
      getAlertesClient(),
      "getAlertes"
    )(request),
};

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  DashboardKpisServiceService,
  EvolutionCaServiceService,
  RepartitionProduitsServiceService,
  StatsSocietesServiceService,
  KpisCommerciauxServiceService,
  AlertesServiceService,
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

let dashboardKpisInstance: GrpcClient | null = null;
let evolutionCaInstance: GrpcClient | null = null;
let repartitionProduitsInstance: GrpcClient | null = null;
let statsSocietesInstance: GrpcClient | null = null;
let kpisCommerciauxInstance: GrpcClient | null = null;
let alertesInstance: GrpcClient | null = null;

function getDashboardKpisClient(): GrpcClient {
  if (!dashboardKpisInstance) {
    dashboardKpisInstance = makeClient(
      DashboardKpisServiceService,
      "DashboardKpisService",
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return dashboardKpisInstance;
}

function getEvolutionCaClient(): GrpcClient {
  if (!evolutionCaInstance) {
    evolutionCaInstance = makeClient(
      EvolutionCaServiceService,
      "EvolutionCaService",
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return evolutionCaInstance;
}

function getRepartitionProduitsClient(): GrpcClient {
  if (!repartitionProduitsInstance) {
    repartitionProduitsInstance = makeClient(
      RepartitionProduitsServiceService,
      "RepartitionProduitsService",
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return repartitionProduitsInstance;
}

function getStatsSocietesClient(): GrpcClient {
  if (!statsSocietesInstance) {
    statsSocietesInstance = makeClient(
      StatsSocietesServiceService,
      "StatsSocietesService",
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return statsSocietesInstance;
}

function getKpisCommerciauxClient(): GrpcClient {
  if (!kpisCommerciauxInstance) {
    kpisCommerciauxInstance = makeClient(
      KpisCommerciauxServiceService,
      "KpisCommerciauxService",
      SERVICES.dashboard,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return kpisCommerciauxInstance;
}

function getAlertesClient(): GrpcClient {
  if (!alertesInstance) {
    alertesInstance = makeClient(
      AlertesServiceService,
      "AlertesService",
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

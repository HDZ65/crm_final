import { credentials, SERVICES, promisify } from "./config";
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
} from "@proto/logistics/logistics";

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

export type {
  ExpeditionResponse,
  ExpeditionListResponse,
  GetExpeditionsByClientRequest,
};

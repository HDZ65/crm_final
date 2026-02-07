import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  LogisticsServiceService,
  type ExpeditionResponse,
  type ExpeditionListResponse,
  type GetExpeditionsByClientRequest,
  type GetExpeditionsByOrganisationRequest,
  type CreateExpeditionRequest,
  type UpdateExpeditionRequest,
  type GetByIdRequest as LogisticsGetByIdRequest,
  type DeleteResponse as LogisticsDeleteResponse,
  type GenerateLabelRequest,
  type LabelResponse,
  type TrackShipmentRequest,
  type TrackingResponse,
  type ValidateAddressRequest,
  type AddressValidationResponse,
  type SimulatePricingRequest,
  type PricingResponse,
  type CreateCarrierAccountRequest,
  type CarrierAccountResponse,
  type GetByOrganisationIdRequest,
  type CarrierAccountListResponse,
  type UpdateCarrierAccountRequest,
} from "@proto/logistics/logistics";
import {
  FulfillmentBatchServiceService,
  FulfillmentCutoffConfigServiceService,
  type FulfillmentBatch,
  type CreateFulfillmentBatchRequest,
  type UpdateFulfillmentBatchRequest,
  type ListFulfillmentBatchRequest,
  type ListFulfillmentBatchResponse,
  type LockFulfillmentBatchRequest,
  type DispatchFulfillmentBatchRequest,
  type CompleteFulfillmentBatchRequest,
  type AddFulfillmentBatchLineRequest,
  type RemoveFulfillmentBatchLineRequest,
  type FulfillmentBatchLine,
  type FulfillmentCutoffConfig,
  type CreateFulfillmentCutoffConfigRequest,
  type UpdateFulfillmentCutoffConfigRequest,
  type GetByIdRequest as FulfillmentGetByIdRequest,
  type GetByOrganisationRequest,
  type DeleteResponse as FulfillmentDeleteResponse,
} from "@proto/fulfillment/fulfillment";

let logisticsInstance: GrpcClient | null = null;
let fulfillmentBatchInstance: GrpcClient | null = null;
let fulfillmentCutoffInstance: GrpcClient | null = null;

function getLogisticsClient(): GrpcClient {
  if (!logisticsInstance) {
    logisticsInstance = makeClient(
      LogisticsServiceService,
      "LogisticsService",
      SERVICES.logistics,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return logisticsInstance;
}

function getFulfillmentBatchClient(): GrpcClient {
  if (!fulfillmentBatchInstance) {
    fulfillmentBatchInstance = makeClient(
      FulfillmentBatchServiceService,
      "FulfillmentBatchService",
      SERVICES.logistics,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return fulfillmentBatchInstance;
}

function getFulfillmentCutoffClient(): GrpcClient {
  if (!fulfillmentCutoffInstance) {
    fulfillmentCutoffInstance = makeClient(
      FulfillmentCutoffConfigServiceService,
      "FulfillmentCutoffConfigService",
      SERVICES.logistics,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return fulfillmentCutoffInstance;
}

export const logistics = {
  // ==================== EXPEDITIONS ====================
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

  // ==================== MAILEVA / LABEL & TRACKING ====================
  generateLabel: (request: GenerateLabelRequest): Promise<LabelResponse> =>
    promisify<GenerateLabelRequest, LabelResponse>(
      getLogisticsClient(),
      "generateLabel"
    )(request),

  trackShipment: (request: TrackShipmentRequest): Promise<TrackingResponse> =>
    promisify<TrackShipmentRequest, TrackingResponse>(
      getLogisticsClient(),
      "trackShipment"
    )(request),

  validateAddress: (request: ValidateAddressRequest): Promise<AddressValidationResponse> =>
    promisify<ValidateAddressRequest, AddressValidationResponse>(
      getLogisticsClient(),
      "validateAddress"
    )(request),

  simulatePricing: (request: SimulatePricingRequest): Promise<PricingResponse> =>
    promisify<SimulatePricingRequest, PricingResponse>(
      getLogisticsClient(),
      "simulatePricing"
    )(request),

  // ==================== CARRIER ACCOUNTS ====================
  createCarrierAccount: (request: CreateCarrierAccountRequest): Promise<CarrierAccountResponse> =>
    promisify<CreateCarrierAccountRequest, CarrierAccountResponse>(
      getLogisticsClient(),
      "createCarrierAccount"
    )(request),

  getCarrierAccount: (request: LogisticsGetByIdRequest): Promise<CarrierAccountResponse> =>
    promisify<LogisticsGetByIdRequest, CarrierAccountResponse>(
      getLogisticsClient(),
      "getCarrierAccount"
    )(request),

  getCarrierAccountsByOrganisation: (
    request: GetByOrganisationIdRequest
  ): Promise<CarrierAccountListResponse> =>
    promisify<GetByOrganisationIdRequest, CarrierAccountListResponse>(
      getLogisticsClient(),
      "getCarrierAccountsByOrganisation"
    )(request),

  updateCarrierAccount: (request: UpdateCarrierAccountRequest): Promise<CarrierAccountResponse> =>
    promisify<UpdateCarrierAccountRequest, CarrierAccountResponse>(
      getLogisticsClient(),
      "updateCarrierAccount"
    )(request),

  deleteCarrierAccount: (request: LogisticsGetByIdRequest): Promise<LogisticsDeleteResponse> =>
    promisify<LogisticsGetByIdRequest, LogisticsDeleteResponse>(
      getLogisticsClient(),
      "deleteCarrierAccount"
    )(request),
};

export const fulfillmentBatch = {
  // ==================== FULFILLMENT BATCH ====================
  create: (request: CreateFulfillmentBatchRequest): Promise<FulfillmentBatch> =>
    promisify<CreateFulfillmentBatchRequest, FulfillmentBatch>(
      getFulfillmentBatchClient(),
      "create"
    )(request),

  get: (request: FulfillmentGetByIdRequest): Promise<FulfillmentBatch> =>
    promisify<FulfillmentGetByIdRequest, FulfillmentBatch>(
      getFulfillmentBatchClient(),
      "get"
    )(request),

  list: (request: ListFulfillmentBatchRequest): Promise<ListFulfillmentBatchResponse> =>
    promisify<ListFulfillmentBatchRequest, ListFulfillmentBatchResponse>(
      getFulfillmentBatchClient(),
      "list"
    )(request),

  update: (request: UpdateFulfillmentBatchRequest): Promise<FulfillmentBatch> =>
    promisify<UpdateFulfillmentBatchRequest, FulfillmentBatch>(
      getFulfillmentBatchClient(),
      "update"
    )(request),

  delete: (request: FulfillmentGetByIdRequest): Promise<FulfillmentDeleteResponse> =>
    promisify<FulfillmentGetByIdRequest, FulfillmentDeleteResponse>(
      getFulfillmentBatchClient(),
      "delete"
    )(request),

  lock: (request: LockFulfillmentBatchRequest): Promise<FulfillmentBatch> =>
    promisify<LockFulfillmentBatchRequest, FulfillmentBatch>(
      getFulfillmentBatchClient(),
      "lock"
    )(request),

  dispatch: (request: DispatchFulfillmentBatchRequest): Promise<FulfillmentBatch> =>
    promisify<DispatchFulfillmentBatchRequest, FulfillmentBatch>(
      getFulfillmentBatchClient(),
      "dispatch"
    )(request),

  complete: (request: CompleteFulfillmentBatchRequest): Promise<FulfillmentBatch> =>
    promisify<CompleteFulfillmentBatchRequest, FulfillmentBatch>(
      getFulfillmentBatchClient(),
      "complete"
    )(request),

  addLine: (request: AddFulfillmentBatchLineRequest): Promise<FulfillmentBatchLine> =>
    promisify<AddFulfillmentBatchLineRequest, FulfillmentBatchLine>(
      getFulfillmentBatchClient(),
      "addLine"
    )(request),

  removeLine: (request: RemoveFulfillmentBatchLineRequest): Promise<FulfillmentDeleteResponse> =>
    promisify<RemoveFulfillmentBatchLineRequest, FulfillmentDeleteResponse>(
      getFulfillmentBatchClient(),
      "removeLine"
    )(request),
};

export const fulfillmentCutoff = {
  // ==================== FULFILLMENT CUTOFF CONFIG ====================
  create: (request: CreateFulfillmentCutoffConfigRequest): Promise<FulfillmentCutoffConfig> =>
    promisify<CreateFulfillmentCutoffConfigRequest, FulfillmentCutoffConfig>(
      getFulfillmentCutoffClient(),
      "create"
    )(request),

  get: (request: FulfillmentGetByIdRequest): Promise<FulfillmentCutoffConfig> =>
    promisify<FulfillmentGetByIdRequest, FulfillmentCutoffConfig>(
      getFulfillmentCutoffClient(),
      "get"
    )(request),

  getByOrganisation: (request: GetByOrganisationRequest): Promise<FulfillmentCutoffConfig> =>
    promisify<GetByOrganisationRequest, FulfillmentCutoffConfig>(
      getFulfillmentCutoffClient(),
      "getByOrganisation"
    )(request),

  update: (request: UpdateFulfillmentCutoffConfigRequest): Promise<FulfillmentCutoffConfig> =>
    promisify<UpdateFulfillmentCutoffConfigRequest, FulfillmentCutoffConfig>(
      getFulfillmentCutoffClient(),
      "update"
    )(request),

  delete: (request: FulfillmentGetByIdRequest): Promise<FulfillmentDeleteResponse> =>
    promisify<FulfillmentGetByIdRequest, FulfillmentDeleteResponse>(
      getFulfillmentCutoffClient(),
      "delete"
    )(request),
};

export type {
  // Expeditions
  ExpeditionResponse,
  ExpeditionListResponse,
  GetExpeditionsByClientRequest,
  // Maileva
  GenerateLabelRequest,
  LabelResponse,
  TrackShipmentRequest,
  TrackingResponse,
  ValidateAddressRequest,
  AddressValidationResponse,
  SimulatePricingRequest,
  PricingResponse,
  // Carrier Accounts
  CreateCarrierAccountRequest,
  CarrierAccountResponse,
  CarrierAccountListResponse,
  UpdateCarrierAccountRequest,
  // Fulfillment Batch
  FulfillmentBatch,
  CreateFulfillmentBatchRequest,
  UpdateFulfillmentBatchRequest,
  ListFulfillmentBatchRequest,
  ListFulfillmentBatchResponse,
  FulfillmentBatchLine,
  // Fulfillment Cutoff
  FulfillmentCutoffConfig,
  CreateFulfillmentCutoffConfigRequest,
  UpdateFulfillmentCutoffConfigRequest,
};

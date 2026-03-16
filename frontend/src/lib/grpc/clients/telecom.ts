import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  TelecomProvisioningServiceService,
  type ListProvisioningLifecyclesRequest,
  type ListProvisioningLifecyclesResponse,
  type GetProvisioningLifecycleRequest,
  type GetProvisioningLifecycleResponse,
  type GetProvisioningStatsRequest,
  type GetProvisioningStatsResponse,
  type RetryTransatelActivationRequest,
  type RetryTransatelActivationResponse,
  type RetrySepaMandateRequest,
  type RetrySepaMandateResponse,
  type ForceActiveRequest,
  type ForceActiveResponse,
  type TriggerRetractionDeadlineRequest,
  type TriggerRetractionDeadlineResponse,
  type CancelProvisioningRequest,
  type CancelProvisioningResponse,
  type SuspendLineRequest,
  type SuspendLineResponse,
  type TerminateLineRequest,
  type TerminateLineResponse,
} from "@proto/telecom/telecom";

let telecomInstance: GrpcClient | null = null;

function getTelecomClient(): GrpcClient {
  if (!telecomInstance) {
    telecomInstance = makeClient(
      TelecomProvisioningServiceService,
      "TelecomProvisioningService",
      SERVICES.telecom,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return telecomInstance;
}

export const telecomProvisioning = {
  listProvisioningLifecycles: (
    request: ListProvisioningLifecyclesRequest
  ): Promise<ListProvisioningLifecyclesResponse> =>
    promisify<ListProvisioningLifecyclesRequest, ListProvisioningLifecyclesResponse>(
      getTelecomClient(),
      "listProvisioningLifecycles"
    )(request),
  getProvisioningLifecycle: (
    request: GetProvisioningLifecycleRequest
  ): Promise<GetProvisioningLifecycleResponse> =>
    promisify<GetProvisioningLifecycleRequest, GetProvisioningLifecycleResponse>(
      getTelecomClient(),
      "getProvisioningLifecycle"
    )(request),
  getProvisioningStats: (
    request: GetProvisioningStatsRequest
  ): Promise<GetProvisioningStatsResponse> =>
    promisify<GetProvisioningStatsRequest, GetProvisioningStatsResponse>(
      getTelecomClient(),
      "getProvisioningStats"
    )(request),
  retryTransatelActivation: (
    request: RetryTransatelActivationRequest
  ): Promise<RetryTransatelActivationResponse> =>
    promisify<RetryTransatelActivationRequest, RetryTransatelActivationResponse>(
      getTelecomClient(),
      "retryTransatelActivation"
    )(request),
  retrySepaMandate: (
    request: RetrySepaMandateRequest
  ): Promise<RetrySepaMandateResponse> =>
    promisify<RetrySepaMandateRequest, RetrySepaMandateResponse>(
      getTelecomClient(),
      "retrySepaMandate"
    )(request),
  forceActive: (request: ForceActiveRequest): Promise<ForceActiveResponse> =>
    promisify<ForceActiveRequest, ForceActiveResponse>(
      getTelecomClient(),
      "forceActive"
    )(request),
  triggerRetractionDeadline: (
    request: TriggerRetractionDeadlineRequest
  ): Promise<TriggerRetractionDeadlineResponse> =>
    promisify<TriggerRetractionDeadlineRequest, TriggerRetractionDeadlineResponse>(
      getTelecomClient(),
      "triggerRetractionDeadline"
    )(request),
  cancelProvisioning: (
    request: CancelProvisioningRequest
  ): Promise<CancelProvisioningResponse> =>
    promisify<CancelProvisioningRequest, CancelProvisioningResponse>(
      getTelecomClient(),
      "cancelProvisioning"
    )(request),
  suspendLine: (
    request: SuspendLineRequest
  ): Promise<SuspendLineResponse> =>
    promisify<SuspendLineRequest, SuspendLineResponse>(
      getTelecomClient(),
      "suspendLine"
    )(request),
  terminateLine: (
    request: TerminateLineRequest
  ): Promise<TerminateLineResponse> =>
    promisify<TerminateLineRequest, TerminateLineResponse>(
      getTelecomClient(),
      "terminateLine"
    )(request),
};

export type {
  ListProvisioningLifecyclesRequest,
  ListProvisioningLifecyclesResponse,
  GetProvisioningLifecycleRequest,
  GetProvisioningLifecycleResponse,
  GetProvisioningStatsRequest,
  GetProvisioningStatsResponse,
  RetryTransatelActivationRequest,
  RetryTransatelActivationResponse,
  RetrySepaMandateRequest,
  RetrySepaMandateResponse,
  ForceActiveRequest,
  ForceActiveResponse,
  TriggerRetractionDeadlineRequest,
  TriggerRetractionDeadlineResponse,
  CancelProvisioningRequest,
  CancelProvisioningResponse,
  SuspendLineRequest,
  SuspendLineResponse,
  TerminateLineRequest,
  TerminateLineResponse,
};

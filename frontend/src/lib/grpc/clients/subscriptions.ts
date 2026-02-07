/**
 * Subscriptions Service gRPC Client
 * Includes: SubscriptionPlan, Subscription, SubscriptionPreferenceSchema, SubscriptionPreference
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  SubscriptionPlanServiceService,
  SubscriptionServiceService,
  SubscriptionPreferenceSchemaServiceService,
  SubscriptionPreferenceServiceService,
  type SubscriptionPlan,
  type CreateSubscriptionPlanRequest,
  type UpdateSubscriptionPlanRequest,
  type ListSubscriptionPlanRequest,
  type ListSubscriptionPlanResponse,
  type Subscription,
  type CreateSubscriptionRequest,
  type UpdateSubscriptionRequest,
  type ListSubscriptionRequest,
  type ListSubscriptionResponse,
  type ActivateSubscriptionRequest,
  type PauseSubscriptionRequest,
  type ResumeSubscriptionRequest,
  type CancelSubscriptionRequest,
  type SuspendSubscriptionRequest,
  type ReactivateSubscriptionRequest,
  type ExpireSubscriptionRequest,
  type GetDueForChargeRequest,
  type GetDueForTrialConversionRequest,
  type ListByClientRequest,
  type ListByPlanRequest,
  type PreferenceSchema,
  type CreatePreferenceSchemaRequest,
  type UpdatePreferenceSchemaRequest,
  type ListPreferenceSchemaRequest,
  type ListPreferenceSchemaResponse,
  type Preference,
  type CreatePreferenceRequest,
  type UpdatePreferenceRequest,
  type ListPreferenceRequest,
  type ListPreferenceResponse,
  type GetBySubscriptionRequest,
  type GetByIdRequest,
  type DeleteByIdRequest,
  type DeleteResponse as SubscriptionDeleteResponse,
  type ListByOrganisationRequest,
} from "@proto/subscriptions/subscriptions";

// ===== Singleton instances =====
let subscriptionPlanInstance: GrpcClient | null = null;
let subscriptionInstance: GrpcClient | null = null;
let preferenceSchemaInstance: GrpcClient | null = null;
let preferenceInstance: GrpcClient | null = null;

// ===== Client factories =====

function getSubscriptionPlanClient(): GrpcClient {
  if (!subscriptionPlanInstance) {
    subscriptionPlanInstance = makeClient(
      SubscriptionPlanServiceService,
      "SubscriptionPlanService",
      SERVICES.subscriptions,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return subscriptionPlanInstance;
}

function getSubscriptionClient(): GrpcClient {
  if (!subscriptionInstance) {
    subscriptionInstance = makeClient(
      SubscriptionServiceService,
      "SubscriptionService",
      SERVICES.subscriptions,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return subscriptionInstance;
}

function getPreferenceSchemaClient(): GrpcClient {
  if (!preferenceSchemaInstance) {
    preferenceSchemaInstance = makeClient(
      SubscriptionPreferenceSchemaServiceService,
      "SubscriptionPreferenceSchemaService",
      SERVICES.subscriptions,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return preferenceSchemaInstance;
}

function getPreferenceClient(): GrpcClient {
  if (!preferenceInstance) {
    preferenceInstance = makeClient(
      SubscriptionPreferenceServiceService,
      "SubscriptionPreferenceService",
      SERVICES.subscriptions,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return preferenceInstance;
}

// ===== Exported client objects =====

export const subscriptionPlans = {
  create: (request: CreateSubscriptionPlanRequest): Promise<SubscriptionPlan> =>
    promisify<CreateSubscriptionPlanRequest, SubscriptionPlan>(
      getSubscriptionPlanClient(),
      "create"
    )(request),

  update: (request: UpdateSubscriptionPlanRequest): Promise<SubscriptionPlan> =>
    promisify<UpdateSubscriptionPlanRequest, SubscriptionPlan>(
      getSubscriptionPlanClient(),
      "update"
    )(request),

  get: (request: GetByIdRequest): Promise<SubscriptionPlan> =>
    promisify<GetByIdRequest, SubscriptionPlan>(
      getSubscriptionPlanClient(),
      "get"
    )(request),

  list: (request: ListSubscriptionPlanRequest): Promise<ListSubscriptionPlanResponse> =>
    promisify<ListSubscriptionPlanRequest, ListSubscriptionPlanResponse>(
      getSubscriptionPlanClient(),
      "list"
    )(request),

  delete: (request: DeleteByIdRequest): Promise<SubscriptionDeleteResponse> =>
    promisify<DeleteByIdRequest, SubscriptionDeleteResponse>(
      getSubscriptionPlanClient(),
      "delete"
    )(request),

  listByOrganisation: (request: ListByOrganisationRequest): Promise<ListSubscriptionPlanResponse> =>
    promisify<ListByOrganisationRequest, ListSubscriptionPlanResponse>(
      getSubscriptionPlanClient(),
      "listByOrganisation"
    )(request),
};

export const subscriptions = {
  create: (request: CreateSubscriptionRequest): Promise<Subscription> =>
    promisify<CreateSubscriptionRequest, Subscription>(
      getSubscriptionClient(),
      "create"
    )(request),

  update: (request: UpdateSubscriptionRequest): Promise<Subscription> =>
    promisify<UpdateSubscriptionRequest, Subscription>(
      getSubscriptionClient(),
      "update"
    )(request),

  get: (request: GetByIdRequest): Promise<Subscription> =>
    promisify<GetByIdRequest, Subscription>(
      getSubscriptionClient(),
      "get"
    )(request),

  list: (request: ListSubscriptionRequest): Promise<ListSubscriptionResponse> =>
    promisify<ListSubscriptionRequest, ListSubscriptionResponse>(
      getSubscriptionClient(),
      "list"
    )(request),

  delete: (request: DeleteByIdRequest): Promise<SubscriptionDeleteResponse> =>
    promisify<DeleteByIdRequest, SubscriptionDeleteResponse>(
      getSubscriptionClient(),
      "delete"
    )(request),

  activate: (request: ActivateSubscriptionRequest): Promise<Subscription> =>
    promisify<ActivateSubscriptionRequest, Subscription>(
      getSubscriptionClient(),
      "activate"
    )(request),

  pause: (request: PauseSubscriptionRequest): Promise<Subscription> =>
    promisify<PauseSubscriptionRequest, Subscription>(
      getSubscriptionClient(),
      "pause"
    )(request),

  resume: (request: ResumeSubscriptionRequest): Promise<Subscription> =>
    promisify<ResumeSubscriptionRequest, Subscription>(
      getSubscriptionClient(),
      "resume"
    )(request),

  cancel: (request: CancelSubscriptionRequest): Promise<Subscription> =>
    promisify<CancelSubscriptionRequest, Subscription>(
      getSubscriptionClient(),
      "cancel"
    )(request),

  suspend: (request: SuspendSubscriptionRequest): Promise<Subscription> =>
    promisify<SuspendSubscriptionRequest, Subscription>(
      getSubscriptionClient(),
      "suspend"
    )(request),

  reactivate: (request: ReactivateSubscriptionRequest): Promise<Subscription> =>
    promisify<ReactivateSubscriptionRequest, Subscription>(
      getSubscriptionClient(),
      "reactivate"
    )(request),

  expire: (request: ExpireSubscriptionRequest): Promise<Subscription> =>
    promisify<ExpireSubscriptionRequest, Subscription>(
      getSubscriptionClient(),
      "expire"
    )(request),

  getDueForCharge: (request: GetDueForChargeRequest): Promise<ListSubscriptionResponse> =>
    promisify<GetDueForChargeRequest, ListSubscriptionResponse>(
      getSubscriptionClient(),
      "getDueForCharge"
    )(request),

  getDueForTrialConversion: (request: GetDueForTrialConversionRequest): Promise<ListSubscriptionResponse> =>
    promisify<GetDueForTrialConversionRequest, ListSubscriptionResponse>(
      getSubscriptionClient(),
      "getDueForTrialConversion"
    )(request),

  listByClient: (request: ListByClientRequest): Promise<ListSubscriptionResponse> =>
    promisify<ListByClientRequest, ListSubscriptionResponse>(
      getSubscriptionClient(),
      "listByClient"
    )(request),

  listByPlan: (request: ListByPlanRequest): Promise<ListSubscriptionResponse> =>
    promisify<ListByPlanRequest, ListSubscriptionResponse>(
      getSubscriptionClient(),
      "listByPlan"
    )(request),
};

export const subscriptionPreferenceSchemas = {
  create: (request: CreatePreferenceSchemaRequest): Promise<PreferenceSchema> =>
    promisify<CreatePreferenceSchemaRequest, PreferenceSchema>(
      getPreferenceSchemaClient(),
      "create"
    )(request),

  update: (request: UpdatePreferenceSchemaRequest): Promise<PreferenceSchema> =>
    promisify<UpdatePreferenceSchemaRequest, PreferenceSchema>(
      getPreferenceSchemaClient(),
      "update"
    )(request),

  get: (request: GetByIdRequest): Promise<PreferenceSchema> =>
    promisify<GetByIdRequest, PreferenceSchema>(
      getPreferenceSchemaClient(),
      "get"
    )(request),

  list: (request: ListPreferenceSchemaRequest): Promise<ListPreferenceSchemaResponse> =>
    promisify<ListPreferenceSchemaRequest, ListPreferenceSchemaResponse>(
      getPreferenceSchemaClient(),
      "list"
    )(request),

  delete: (request: DeleteByIdRequest): Promise<SubscriptionDeleteResponse> =>
    promisify<DeleteByIdRequest, SubscriptionDeleteResponse>(
      getPreferenceSchemaClient(),
      "delete"
    )(request),
};

export const subscriptionPreferences = {
  create: (request: CreatePreferenceRequest): Promise<Preference> =>
    promisify<CreatePreferenceRequest, Preference>(
      getPreferenceClient(),
      "create"
    )(request),

  update: (request: UpdatePreferenceRequest): Promise<Preference> =>
    promisify<UpdatePreferenceRequest, Preference>(
      getPreferenceClient(),
      "update"
    )(request),

  get: (request: GetByIdRequest): Promise<Preference> =>
    promisify<GetByIdRequest, Preference>(
      getPreferenceClient(),
      "get"
    )(request),

  list: (request: ListPreferenceRequest): Promise<ListPreferenceResponse> =>
    promisify<ListPreferenceRequest, ListPreferenceResponse>(
      getPreferenceClient(),
      "list"
    )(request),

  delete: (request: DeleteByIdRequest): Promise<SubscriptionDeleteResponse> =>
    promisify<DeleteByIdRequest, SubscriptionDeleteResponse>(
      getPreferenceClient(),
      "delete"
    )(request),

  getBySubscription: (request: GetBySubscriptionRequest): Promise<Preference> =>
    promisify<GetBySubscriptionRequest, Preference>(
      getPreferenceClient(),
      "getBySubscription"
    )(request),
};

// Re-export types for convenience
export type {
  SubscriptionPlan,
  CreateSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest,
  ListSubscriptionPlanRequest,
  ListSubscriptionPlanResponse,
  Subscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  ListSubscriptionRequest,
  ListSubscriptionResponse,
  PreferenceSchema,
  CreatePreferenceSchemaRequest,
  UpdatePreferenceSchemaRequest,
  ListPreferenceSchemaRequest,
  ListPreferenceSchemaResponse,
  Preference,
  CreatePreferenceRequest,
  UpdatePreferenceRequest,
  ListPreferenceRequest,
  ListPreferenceResponse,
  SubscriptionDeleteResponse,
};

/**
 * Payments Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  PaymentServiceService,
  // Stripe
  type CreateStripeCheckoutSessionRequest,
  type StripeCheckoutSessionResponse,
  type CreateStripePaymentIntentRequest,
  type StripePaymentIntentResponse,
  type CreateStripeCustomerRequest,
  type StripeCustomerResponse,
  type CreateStripeSubscriptionRequest,
  type StripeSubscriptionResponse,
  type CreateStripeRefundRequest,
  type StripeRefundResponse,
  // GoCardless
  type CreateGoCardlessPaymentRequest,
  type GoCardlessPaymentResponse,
  type SetupGoCardlessMandateRequest,
  type GoCardlessMandateResponse,
  type GetGoCardlessMandateRequest,
  type CreateGoCardlessSubscriptionRequest,
  type GoCardlessSubscriptionResponse,
  type CancelGoCardlessSubscriptionRequest,
  // Schedules
  type CreateScheduleRequest,
  type ScheduleResponse,
  // Common
  type GetByIdRequest,
  // PSP Accounts
  type GetPSPAccountsRequest,
  type PSPAccountsSummaryResponse,
} from "@proto/payments/payment";

let paymentInstance: GrpcClient | null = null;

function getPaymentClient(): GrpcClient {
  if (!paymentInstance) {
    paymentInstance = makeClient(
      PaymentServiceService,
      "PaymentService",
      SERVICES.payments,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return paymentInstance;
}

export const payments = {
  // ==================== STRIPE ====================

  // Checkout Sessions
  createStripeCheckoutSession: (
    request: CreateStripeCheckoutSessionRequest
  ): Promise<StripeCheckoutSessionResponse> =>
    promisify<CreateStripeCheckoutSessionRequest, StripeCheckoutSessionResponse>(
      getPaymentClient(),
      "createStripeCheckoutSession"
    )(request),

  // Payment Intents
  createStripePaymentIntent: (
    request: CreateStripePaymentIntentRequest
  ): Promise<StripePaymentIntentResponse> =>
    promisify<CreateStripePaymentIntentRequest, StripePaymentIntentResponse>(
      getPaymentClient(),
      "createStripePaymentIntent"
    )(request),

  getStripePaymentIntent: (
    request: GetByIdRequest
  ): Promise<StripePaymentIntentResponse> =>
    promisify<GetByIdRequest, StripePaymentIntentResponse>(
      getPaymentClient(),
      "getStripePaymentIntent"
    )(request),

  cancelStripePaymentIntent: (
    request: GetByIdRequest
  ): Promise<StripePaymentIntentResponse> =>
    promisify<GetByIdRequest, StripePaymentIntentResponse>(
      getPaymentClient(),
      "cancelStripePaymentIntent"
    )(request),

  // Customers
  createStripeCustomer: (
    request: CreateStripeCustomerRequest
  ): Promise<StripeCustomerResponse> =>
    promisify<CreateStripeCustomerRequest, StripeCustomerResponse>(
      getPaymentClient(),
      "createStripeCustomer"
    )(request),

  getStripeCustomer: (
    request: GetByIdRequest
  ): Promise<StripeCustomerResponse> =>
    promisify<GetByIdRequest, StripeCustomerResponse>(
      getPaymentClient(),
      "getStripeCustomer"
    )(request),

  // Subscriptions
  createStripeSubscription: (
    request: CreateStripeSubscriptionRequest
  ): Promise<StripeSubscriptionResponse> =>
    promisify<CreateStripeSubscriptionRequest, StripeSubscriptionResponse>(
      getPaymentClient(),
      "createStripeSubscription"
    )(request),

  getStripeSubscription: (
    request: GetByIdRequest
  ): Promise<StripeSubscriptionResponse> =>
    promisify<GetByIdRequest, StripeSubscriptionResponse>(
      getPaymentClient(),
      "getStripeSubscription"
    )(request),

  cancelStripeSubscription: (
    request: GetByIdRequest
  ): Promise<StripeSubscriptionResponse> =>
    promisify<GetByIdRequest, StripeSubscriptionResponse>(
      getPaymentClient(),
      "cancelStripeSubscription"
    )(request),

  // Refunds
  createStripeRefund: (
    request: CreateStripeRefundRequest
  ): Promise<StripeRefundResponse> =>
    promisify<CreateStripeRefundRequest, StripeRefundResponse>(
      getPaymentClient(),
      "createStripeRefund"
    )(request),

  // ==================== GOCARDLESS ====================

  setupGoCardlessMandate: (
    request: SetupGoCardlessMandateRequest
  ): Promise<GoCardlessMandateResponse> =>
    promisify<SetupGoCardlessMandateRequest, GoCardlessMandateResponse>(
      getPaymentClient(),
      "setupGoCardlessMandate"
    )(request),

  getGoCardlessMandate: (
    request: GetGoCardlessMandateRequest
  ): Promise<GoCardlessMandateResponse> =>
    promisify<GetGoCardlessMandateRequest, GoCardlessMandateResponse>(
      getPaymentClient(),
      "getGoCardlessMandate"
    )(request),

  cancelGoCardlessMandate: (
    request: GetGoCardlessMandateRequest
  ): Promise<GoCardlessMandateResponse> =>
    promisify<GetGoCardlessMandateRequest, GoCardlessMandateResponse>(
      getPaymentClient(),
      "cancelGoCardlessMandate"
    )(request),

  createGoCardlessPayment: (
    request: CreateGoCardlessPaymentRequest
  ): Promise<GoCardlessPaymentResponse> =>
    promisify<CreateGoCardlessPaymentRequest, GoCardlessPaymentResponse>(
      getPaymentClient(),
      "createGoCardlessPayment"
    )(request),

  createGoCardlessSubscription: (
    request: CreateGoCardlessSubscriptionRequest
  ): Promise<GoCardlessSubscriptionResponse> =>
    promisify<CreateGoCardlessSubscriptionRequest, GoCardlessSubscriptionResponse>(
      getPaymentClient(),
      "createGoCardlessSubscription"
    )(request),

  cancelGoCardlessSubscription: (
    request: CancelGoCardlessSubscriptionRequest
  ): Promise<GoCardlessSubscriptionResponse> =>
    promisify<CancelGoCardlessSubscriptionRequest, GoCardlessSubscriptionResponse>(
      getPaymentClient(),
      "cancelGoCardlessSubscription"
    )(request),

  // ==================== SCHEDULES ====================

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

  // ==================== PSP ACCOUNTS ====================

  getPSPAccountsSummary: (
    request: GetPSPAccountsRequest
  ): Promise<PSPAccountsSummaryResponse> =>
    promisify<GetPSPAccountsRequest, PSPAccountsSummaryResponse>(
      getPaymentClient(),
      "getPSPAccountsSummary"
    )(request),
};

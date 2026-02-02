/**
 * Payments Service gRPC Client
 */

import { credentials, SERVICES, promisify } from "./config";
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
} from "@proto/payments/payment";

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

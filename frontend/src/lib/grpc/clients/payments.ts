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
  // Routing
  type CreateRoutingRuleRequest,
  type RoutingRuleResponse,
  type UpdateRoutingRuleRequest,
  type DeleteRoutingRuleRequest,
  type DeleteRoutingRuleResponse,
  type ListRoutingRulesRequest,
  type ListRoutingRulesResponse,
  type TestRoutingRuleRequest,
  type TestRoutingRuleResponse,
  type CreateProviderOverrideRequest,
  type ProviderOverrideResponse,
  type DeleteProviderOverrideRequest,
  type DeleteProviderOverrideResponse,
  type ListProviderOverridesRequest,
  type ListProviderOverridesResponse,
  type CreateReassignmentJobRequest,
  type ReassignmentJobResponse,
  type GetReassignmentJobRequest,
  // Alerts
  type ListAlertsRequest,
  type ListAlertsResponse,
  type AcknowledgeAlertRequest,
  type AlertResponse,
  type GetAlertStatsRequest,
  type AlertStatsResponse,
  // Export
  type CreateExportJobRequest,
  type ExportJobResponse,
  type GetExportJobRequest,
  type ListExportJobsRequest,
  type ListExportJobsResponse,
  type DownloadExportRequest,
  type DownloadExportResponse,
  // Slimpay
  type CreateSlimpayMandateRequest,
  type SlimpayMandateResponse,
  type GetSlimpayMandateRequest,
  type CancelSlimpayMandateRequest,
  type CreateSlimpayPaymentRequest,
  type SlimpayPaymentResponse,
  type GetSlimpayPaymentRequest,
  // MultiSafepay
  type CreateMultiSafepayTransactionRequest,
  type MultiSafepayTransactionResponse,
  type GetMultiSafepayTransactionRequest,
  type RefundMultiSafepayTransactionRequest,
  // Status Mapping
  type ListProviderStatusMappingsRequest,
  type ListProviderStatusMappingsResponse,
  type UpdateProviderStatusMappingRequest,
  type ProviderStatusMappingResponse,
  // Rejection Reasons
  type ListRejectionReasonsRequest,
  type ListRejectionReasonsResponse,
  type CreateRejectionReasonRequest,
  type RejectionReasonResponse,
  type UpdateRejectionReasonRequest,
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

  // ==================== ROUTING ====================

  createRoutingRule: (
    request: CreateRoutingRuleRequest
  ): Promise<RoutingRuleResponse> =>
    promisify<CreateRoutingRuleRequest, RoutingRuleResponse>(
      getPaymentClient(),
      "createRoutingRule"
    )(request),

  updateRoutingRule: (
    request: UpdateRoutingRuleRequest
  ): Promise<RoutingRuleResponse> =>
    promisify<UpdateRoutingRuleRequest, RoutingRuleResponse>(
      getPaymentClient(),
      "updateRoutingRule"
    )(request),

  deleteRoutingRule: (
    request: DeleteRoutingRuleRequest
  ): Promise<DeleteRoutingRuleResponse> =>
    promisify<DeleteRoutingRuleRequest, DeleteRoutingRuleResponse>(
      getPaymentClient(),
      "deleteRoutingRule"
    )(request),

  listRoutingRules: (
    request: ListRoutingRulesRequest
  ): Promise<ListRoutingRulesResponse> =>
    promisify<ListRoutingRulesRequest, ListRoutingRulesResponse>(
      getPaymentClient(),
      "listRoutingRules"
    )(request),

  testRoutingRule: (
    request: TestRoutingRuleRequest
  ): Promise<TestRoutingRuleResponse> =>
    promisify<TestRoutingRuleRequest, TestRoutingRuleResponse>(
      getPaymentClient(),
      "testRoutingRule"
    )(request),

  createProviderOverride: (
    request: CreateProviderOverrideRequest
  ): Promise<ProviderOverrideResponse> =>
    promisify<CreateProviderOverrideRequest, ProviderOverrideResponse>(
      getPaymentClient(),
      "createProviderOverride"
    )(request),

  deleteProviderOverride: (
    request: DeleteProviderOverrideRequest
  ): Promise<DeleteProviderOverrideResponse> =>
    promisify<DeleteProviderOverrideRequest, DeleteProviderOverrideResponse>(
      getPaymentClient(),
      "deleteProviderOverride"
    )(request),

  listProviderOverrides: (
    request: ListProviderOverridesRequest
  ): Promise<ListProviderOverridesResponse> =>
    promisify<ListProviderOverridesRequest, ListProviderOverridesResponse>(
      getPaymentClient(),
      "listProviderOverrides"
    )(request),

  createReassignmentJob: (
    request: CreateReassignmentJobRequest
  ): Promise<ReassignmentJobResponse> =>
    promisify<CreateReassignmentJobRequest, ReassignmentJobResponse>(
      getPaymentClient(),
      "createReassignmentJob"
    )(request),

  getReassignmentJob: (
    request: GetReassignmentJobRequest
  ): Promise<ReassignmentJobResponse> =>
    promisify<GetReassignmentJobRequest, ReassignmentJobResponse>(
      getPaymentClient(),
      "getReassignmentJob"
    )(request),

  // ==================== ALERTS ====================

  listAlerts: (
    request: ListAlertsRequest
  ): Promise<ListAlertsResponse> =>
    promisify<ListAlertsRequest, ListAlertsResponse>(
      getPaymentClient(),
      "listAlerts"
    )(request),

  acknowledgeAlert: (
    request: AcknowledgeAlertRequest
  ): Promise<AlertResponse> =>
    promisify<AcknowledgeAlertRequest, AlertResponse>(
      getPaymentClient(),
      "acknowledgeAlert"
    )(request),

  getAlertStats: (
    request: GetAlertStatsRequest
  ): Promise<AlertStatsResponse> =>
    promisify<GetAlertStatsRequest, AlertStatsResponse>(
      getPaymentClient(),
      "getAlertStats"
    )(request),

  // ==================== EXPORT ====================

  createExportJob: (
    request: CreateExportJobRequest
  ): Promise<ExportJobResponse> =>
    promisify<CreateExportJobRequest, ExportJobResponse>(
      getPaymentClient(),
      "createExportJob"
    )(request),

  getExportJob: (
    request: GetExportJobRequest
  ): Promise<ExportJobResponse> =>
    promisify<GetExportJobRequest, ExportJobResponse>(
      getPaymentClient(),
      "getExportJob"
    )(request),

  listExportJobs: (
    request: ListExportJobsRequest
  ): Promise<ListExportJobsResponse> =>
    promisify<ListExportJobsRequest, ListExportJobsResponse>(
      getPaymentClient(),
      "listExportJobs"
    )(request),

  downloadExport: (
    request: DownloadExportRequest
  ): Promise<DownloadExportResponse> =>
    promisify<DownloadExportRequest, DownloadExportResponse>(
      getPaymentClient(),
      "downloadExport"
    )(request),

  // ==================== SLIMPAY ====================

  createSlimpayMandate: (
    request: CreateSlimpayMandateRequest
  ): Promise<SlimpayMandateResponse> =>
    promisify<CreateSlimpayMandateRequest, SlimpayMandateResponse>(
      getPaymentClient(),
      "createSlimpayMandate"
    )(request),

  getSlimpayMandate: (
    request: GetSlimpayMandateRequest
  ): Promise<SlimpayMandateResponse> =>
    promisify<GetSlimpayMandateRequest, SlimpayMandateResponse>(
      getPaymentClient(),
      "getSlimpayMandate"
    )(request),

  cancelSlimpayMandate: (
    request: CancelSlimpayMandateRequest
  ): Promise<SlimpayMandateResponse> =>
    promisify<CancelSlimpayMandateRequest, SlimpayMandateResponse>(
      getPaymentClient(),
      "cancelSlimpayMandate"
    )(request),

  createSlimpayPayment: (
    request: CreateSlimpayPaymentRequest
  ): Promise<SlimpayPaymentResponse> =>
    promisify<CreateSlimpayPaymentRequest, SlimpayPaymentResponse>(
      getPaymentClient(),
      "createSlimpayPayment"
    )(request),

  getSlimpayPayment: (
    request: GetSlimpayPaymentRequest
  ): Promise<SlimpayPaymentResponse> =>
    promisify<GetSlimpayPaymentRequest, SlimpayPaymentResponse>(
      getPaymentClient(),
      "getSlimpayPayment"
    )(request),

  // ==================== MULTISAFEPAY ====================

  createMultiSafepayTransaction: (
    request: CreateMultiSafepayTransactionRequest
  ): Promise<MultiSafepayTransactionResponse> =>
    promisify<CreateMultiSafepayTransactionRequest, MultiSafepayTransactionResponse>(
      getPaymentClient(),
      "createMultiSafepayTransaction"
    )(request),

  getMultiSafepayTransaction: (
    request: GetMultiSafepayTransactionRequest
  ): Promise<MultiSafepayTransactionResponse> =>
    promisify<GetMultiSafepayTransactionRequest, MultiSafepayTransactionResponse>(
      getPaymentClient(),
      "getMultiSafepayTransaction"
    )(request),

  refundMultiSafepayTransaction: (
    request: RefundMultiSafepayTransactionRequest
  ): Promise<MultiSafepayTransactionResponse> =>
    promisify<RefundMultiSafepayTransactionRequest, MultiSafepayTransactionResponse>(
      getPaymentClient(),
      "refundMultiSafepayTransaction"
    )(request),

  // ==================== STATUS MAPPING ====================

  listProviderStatusMappings: (
    request: ListProviderStatusMappingsRequest
  ): Promise<ListProviderStatusMappingsResponse> =>
    promisify<ListProviderStatusMappingsRequest, ListProviderStatusMappingsResponse>(
      getPaymentClient(),
      "listProviderStatusMappings"
    )(request),

  updateProviderStatusMapping: (
    request: UpdateProviderStatusMappingRequest
  ): Promise<ProviderStatusMappingResponse> =>
    promisify<UpdateProviderStatusMappingRequest, ProviderStatusMappingResponse>(
      getPaymentClient(),
      "updateProviderStatusMapping"
    )(request),

  // ==================== REJECTION REASONS ====================

  listRejectionReasons: (
    request: ListRejectionReasonsRequest
  ): Promise<ListRejectionReasonsResponse> =>
    promisify<ListRejectionReasonsRequest, ListRejectionReasonsResponse>(
      getPaymentClient(),
      "listRejectionReasons"
    )(request),

  createRejectionReason: (
    request: CreateRejectionReasonRequest
  ): Promise<RejectionReasonResponse> =>
    promisify<CreateRejectionReasonRequest, RejectionReasonResponse>(
      getPaymentClient(),
      "createRejectionReason"
    )(request),

  updateRejectionReason: (
    request: UpdateRejectionReasonRequest
  ): Promise<RejectionReasonResponse> =>
    promisify<UpdateRejectionReasonRequest, RejectionReasonResponse>(
      getPaymentClient(),
      "updateRejectionReason"
    )(request),
};

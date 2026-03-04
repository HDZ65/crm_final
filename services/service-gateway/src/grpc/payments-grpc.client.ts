import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

export interface PaymentServiceClient {
  CreateStripeCheckoutSession(data: Record<string, unknown>): Observable<unknown>;
  CreateStripePaymentIntent(data: Record<string, unknown>): Observable<unknown>;
  GetStripePaymentIntent(data: Record<string, unknown>): Observable<unknown>;
  CancelStripePaymentIntent(data: Record<string, unknown>): Observable<unknown>;
  CreateStripeCustomer(data: Record<string, unknown>): Observable<unknown>;
  GetStripeCustomer(data: Record<string, unknown>): Observable<unknown>;
  CreateStripeSubscription(data: Record<string, unknown>): Observable<unknown>;
  GetStripeSubscription(data: Record<string, unknown>): Observable<unknown>;
  CancelStripeSubscription(data: Record<string, unknown>): Observable<unknown>;
  CreateStripeRefund(data: Record<string, unknown>): Observable<unknown>;
  CreateStripeSetupIntent(data: Record<string, unknown>): Observable<unknown>;
  CreateStripeBillingPortalSession(data: Record<string, unknown>): Observable<unknown>;
  CreatePayPalOrder(data: Record<string, unknown>): Observable<unknown>;
  GetPayPalOrder(data: Record<string, unknown>): Observable<unknown>;
  CapturePayPalOrder(data: Record<string, unknown>): Observable<unknown>;
  AuthorizePayPalOrder(data: Record<string, unknown>): Observable<unknown>;
  SetupGoCardlessMandate(data: Record<string, unknown>): Observable<unknown>;
  GetGoCardlessMandate(data: Record<string, unknown>): Observable<unknown>;
  CancelGoCardlessMandate(data: Record<string, unknown>): Observable<unknown>;
  CreateGoCardlessPayment(data: Record<string, unknown>): Observable<unknown>;
  CreateGoCardlessSubscription(data: Record<string, unknown>): Observable<unknown>;
  CancelGoCardlessSubscription(data: Record<string, unknown>): Observable<unknown>;
  ListGoCardlessMandates(data: Record<string, unknown>): Observable<unknown>;
  CreateSchedule(data: Record<string, unknown>): Observable<unknown>;
  GetSchedule(data: Record<string, unknown>): Observable<unknown>;
  UpdateSchedule(data: Record<string, unknown>): Observable<unknown>;
  DeleteSchedule(data: Record<string, unknown>): Observable<unknown>;
  GetDueSchedules(data: Record<string, unknown>): Observable<unknown>;
  ProcessDuePayments(data: Record<string, unknown>): Observable<unknown>;
  RenewSchedule(data: Record<string, unknown>): Observable<unknown>;
  CreatePaymentIntent(data: Record<string, unknown>): Observable<unknown>;
  GetPaymentIntent(data: Record<string, unknown>): Observable<unknown>;
  UpdatePaymentIntent(data: Record<string, unknown>): Observable<unknown>;
  DeletePaymentIntent(data: Record<string, unknown>): Observable<unknown>;
  CreatePaymentEvent(data: Record<string, unknown>): Observable<unknown>;
  GetPaymentEvent(data: Record<string, unknown>): Observable<unknown>;
  GetUnprocessedEvents(data: Record<string, unknown>): Observable<unknown>;
  MarkEventProcessed(data: Record<string, unknown>): Observable<unknown>;
  GetPSPAccountsSummary(data: Record<string, unknown>): Observable<unknown>;
  CreateSlimpayMandate(data: Record<string, unknown>): Observable<unknown>;
  GetSlimpayMandate(data: Record<string, unknown>): Observable<unknown>;
  CancelSlimpayMandate(data: Record<string, unknown>): Observable<unknown>;
  CreateSlimpayPayment(data: Record<string, unknown>): Observable<unknown>;
  GetSlimpayPayment(data: Record<string, unknown>): Observable<unknown>;
  CreateMultiSafepayTransaction(data: Record<string, unknown>): Observable<unknown>;
  GetMultiSafepayTransaction(data: Record<string, unknown>): Observable<unknown>;
  RefundMultiSafepayTransaction(data: Record<string, unknown>): Observable<unknown>;
  CreateEmerchantpayPayment(data: Record<string, unknown>): Observable<unknown>;
  GetEmerchantpayPayment(data: Record<string, unknown>): Observable<unknown>;
  CreateEmerchantpaySepaPayment(data: Record<string, unknown>): Observable<unknown>;
  RefundEmerchantpayPayment(data: Record<string, unknown>): Observable<unknown>;
  CreateRoutingRule(data: Record<string, unknown>): Observable<unknown>;
  UpdateRoutingRule(data: Record<string, unknown>): Observable<unknown>;
  DeleteRoutingRule(data: Record<string, unknown>): Observable<unknown>;
  ListRoutingRules(data: Record<string, unknown>): Observable<unknown>;
  TestRoutingRule(data: Record<string, unknown>): Observable<unknown>;
  CreateProviderOverride(data: Record<string, unknown>): Observable<unknown>;
  DeleteProviderOverride(data: Record<string, unknown>): Observable<unknown>;
  ListProviderOverrides(data: Record<string, unknown>): Observable<unknown>;
  CreateReassignmentJob(data: Record<string, unknown>): Observable<unknown>;
  GetReassignmentJob(data: Record<string, unknown>): Observable<unknown>;
  ListAlerts(data: Record<string, unknown>): Observable<unknown>;
  AcknowledgeAlert(data: Record<string, unknown>): Observable<unknown>;
  GetAlertStats(data: Record<string, unknown>): Observable<unknown>;
  CreateExportJob(data: Record<string, unknown>): Observable<unknown>;
  GetExportJob(data: Record<string, unknown>): Observable<unknown>;
  ListExportJobs(data: Record<string, unknown>): Observable<unknown>;
  DownloadExport(data: Record<string, unknown>): Observable<unknown>;
  GetRiskScore(data: Record<string, unknown>): Observable<unknown>;
  EvaluateRiskScore(data: Record<string, unknown>): Observable<unknown>;
  ListRiskScores(data: Record<string, unknown>): Observable<unknown>;
  GetScoringStats(data: Record<string, unknown>): Observable<unknown>;
  ImportBankStatement(data: Record<string, unknown>): Observable<unknown>;
  GetReconciliationStatus(data: Record<string, unknown>): Observable<unknown>;
  ForceReconciliation(data: Record<string, unknown>): Observable<unknown>;
  ListUnmatchedPayments(data: Record<string, unknown>): Observable<unknown>;
  ListProviderStatusMappings(data: Record<string, unknown>): Observable<unknown>;
  UpdateProviderStatusMapping(data: Record<string, unknown>): Observable<unknown>;
  ListRejectionReasons(data: Record<string, unknown>): Observable<unknown>;
  CreateRejectionReason(data: Record<string, unknown>): Observable<unknown>;
  UpdateRejectionReason(data: Record<string, unknown>): Observable<unknown>;
  ListPayments(data: Record<string, unknown>): Observable<unknown>;
  GetPaymentStats(data: Record<string, unknown>): Observable<unknown>;
  CreatePortalSession(data: Record<string, unknown>): Observable<unknown>;
  ValidatePortalToken(data: Record<string, unknown>): Observable<unknown>;
  AccessPortalSession(data: Record<string, unknown>): Observable<unknown>;
  ConsumePortalToken(data: Record<string, unknown>): Observable<unknown>;
  CancelPortalSession(data: Record<string, unknown>): Observable<unknown>;
  UpdatePortalPspInfo(data: Record<string, unknown>): Observable<unknown>;
  TransitionPortalSession(data: Record<string, unknown>): Observable<unknown>;
  ListPortalSessions(data: Record<string, unknown>): Observable<unknown>;
  GetPortalSessionAudit(data: Record<string, unknown>): Observable<unknown>;
  GetPortalSessionStats(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class PaymentsGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(PaymentsGrpcClient.name);
  private paymentService: PaymentServiceClient;

  constructor(@Inject('FINANCE_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.paymentService = this.client.getService<PaymentServiceClient>('PaymentService');
  }

  createStripeCheckoutSession(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateStripeCheckoutSession(data), this.logger, 'PaymentService', 'CreateStripeCheckoutSession');
  }

  createStripePaymentIntent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateStripePaymentIntent(data), this.logger, 'PaymentService', 'CreateStripePaymentIntent');
  }

  getStripePaymentIntent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetStripePaymentIntent(data), this.logger, 'PaymentService', 'GetStripePaymentIntent');
  }

  cancelStripePaymentIntent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CancelStripePaymentIntent(data), this.logger, 'PaymentService', 'CancelStripePaymentIntent');
  }

  createStripeCustomer(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateStripeCustomer(data), this.logger, 'PaymentService', 'CreateStripeCustomer');
  }

  getStripeCustomer(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetStripeCustomer(data), this.logger, 'PaymentService', 'GetStripeCustomer');
  }

  createStripeSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateStripeSubscription(data), this.logger, 'PaymentService', 'CreateStripeSubscription');
  }

  getStripeSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetStripeSubscription(data), this.logger, 'PaymentService', 'GetStripeSubscription');
  }

  cancelStripeSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CancelStripeSubscription(data), this.logger, 'PaymentService', 'CancelStripeSubscription');
  }

  createStripeRefund(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateStripeRefund(data), this.logger, 'PaymentService', 'CreateStripeRefund');
  }

  createStripeSetupIntent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateStripeSetupIntent(data), this.logger, 'PaymentService', 'CreateStripeSetupIntent');
  }

  createStripeBillingPortalSession(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateStripeBillingPortalSession(data), this.logger, 'PaymentService', 'CreateStripeBillingPortalSession');
  }

  createPayPalOrder(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreatePayPalOrder(data), this.logger, 'PaymentService', 'CreatePayPalOrder');
  }

  getPayPalOrder(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetPayPalOrder(data), this.logger, 'PaymentService', 'GetPayPalOrder');
  }

  capturePayPalOrder(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CapturePayPalOrder(data), this.logger, 'PaymentService', 'CapturePayPalOrder');
  }

  authorizePayPalOrder(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.AuthorizePayPalOrder(data), this.logger, 'PaymentService', 'AuthorizePayPalOrder');
  }

  setupGoCardlessMandate(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.SetupGoCardlessMandate(data), this.logger, 'PaymentService', 'SetupGoCardlessMandate');
  }

  getGoCardlessMandate(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetGoCardlessMandate(data), this.logger, 'PaymentService', 'GetGoCardlessMandate');
  }

  cancelGoCardlessMandate(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CancelGoCardlessMandate(data), this.logger, 'PaymentService', 'CancelGoCardlessMandate');
  }

  createGoCardlessPayment(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateGoCardlessPayment(data), this.logger, 'PaymentService', 'CreateGoCardlessPayment');
  }

  createGoCardlessSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateGoCardlessSubscription(data), this.logger, 'PaymentService', 'CreateGoCardlessSubscription');
  }

  cancelGoCardlessSubscription(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CancelGoCardlessSubscription(data), this.logger, 'PaymentService', 'CancelGoCardlessSubscription');
  }

  listGoCardlessMandates(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListGoCardlessMandates(data), this.logger, 'PaymentService', 'ListGoCardlessMandates');
  }

  createSchedule(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateSchedule(data), this.logger, 'PaymentService', 'CreateSchedule');
  }

  getSchedule(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetSchedule(data), this.logger, 'PaymentService', 'GetSchedule');
  }

  updateSchedule(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.UpdateSchedule(data), this.logger, 'PaymentService', 'UpdateSchedule');
  }

  deleteSchedule(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.DeleteSchedule(data), this.logger, 'PaymentService', 'DeleteSchedule');
  }

  getDueSchedules(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetDueSchedules(data), this.logger, 'PaymentService', 'GetDueSchedules');
  }

  processDuePayments(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ProcessDuePayments(data), this.logger, 'PaymentService', 'ProcessDuePayments');
  }

  renewSchedule(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.RenewSchedule(data), this.logger, 'PaymentService', 'RenewSchedule');
  }

  createPaymentIntent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreatePaymentIntent(data), this.logger, 'PaymentService', 'CreatePaymentIntent');
  }

  getPaymentIntent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetPaymentIntent(data), this.logger, 'PaymentService', 'GetPaymentIntent');
  }

  updatePaymentIntent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.UpdatePaymentIntent(data), this.logger, 'PaymentService', 'UpdatePaymentIntent');
  }

  deletePaymentIntent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.DeletePaymentIntent(data), this.logger, 'PaymentService', 'DeletePaymentIntent');
  }

  createPaymentEvent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreatePaymentEvent(data), this.logger, 'PaymentService', 'CreatePaymentEvent');
  }

  getPaymentEvent(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetPaymentEvent(data), this.logger, 'PaymentService', 'GetPaymentEvent');
  }

  getUnprocessedEvents(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetUnprocessedEvents(data), this.logger, 'PaymentService', 'GetUnprocessedEvents');
  }

  markEventProcessed(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.MarkEventProcessed(data), this.logger, 'PaymentService', 'MarkEventProcessed');
  }

  getPSPAccountsSummary(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetPSPAccountsSummary(data), this.logger, 'PaymentService', 'GetPSPAccountsSummary');
  }

  createSlimpayMandate(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateSlimpayMandate(data), this.logger, 'PaymentService', 'CreateSlimpayMandate');
  }

  getSlimpayMandate(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetSlimpayMandate(data), this.logger, 'PaymentService', 'GetSlimpayMandate');
  }

  cancelSlimpayMandate(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CancelSlimpayMandate(data), this.logger, 'PaymentService', 'CancelSlimpayMandate');
  }

  createSlimpayPayment(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateSlimpayPayment(data), this.logger, 'PaymentService', 'CreateSlimpayPayment');
  }

  getSlimpayPayment(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetSlimpayPayment(data), this.logger, 'PaymentService', 'GetSlimpayPayment');
  }

  createMultiSafepayTransaction(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateMultiSafepayTransaction(data), this.logger, 'PaymentService', 'CreateMultiSafepayTransaction');
  }

  getMultiSafepayTransaction(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetMultiSafepayTransaction(data), this.logger, 'PaymentService', 'GetMultiSafepayTransaction');
  }

  refundMultiSafepayTransaction(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.RefundMultiSafepayTransaction(data), this.logger, 'PaymentService', 'RefundMultiSafepayTransaction');
  }

  createEmerchantpayPayment(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateEmerchantpayPayment(data), this.logger, 'PaymentService', 'CreateEmerchantpayPayment');
  }

  getEmerchantpayPayment(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetEmerchantpayPayment(data), this.logger, 'PaymentService', 'GetEmerchantpayPayment');
  }

  createEmerchantpaySepaPayment(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateEmerchantpaySepaPayment(data), this.logger, 'PaymentService', 'CreateEmerchantpaySepaPayment');
  }

  refundEmerchantpayPayment(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.RefundEmerchantpayPayment(data), this.logger, 'PaymentService', 'RefundEmerchantpayPayment');
  }

  createRoutingRule(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateRoutingRule(data), this.logger, 'PaymentService', 'CreateRoutingRule');
  }

  updateRoutingRule(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.UpdateRoutingRule(data), this.logger, 'PaymentService', 'UpdateRoutingRule');
  }

  deleteRoutingRule(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.DeleteRoutingRule(data), this.logger, 'PaymentService', 'DeleteRoutingRule');
  }

  listRoutingRules(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListRoutingRules(data), this.logger, 'PaymentService', 'ListRoutingRules');
  }

  testRoutingRule(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.TestRoutingRule(data), this.logger, 'PaymentService', 'TestRoutingRule');
  }

  createProviderOverride(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateProviderOverride(data), this.logger, 'PaymentService', 'CreateProviderOverride');
  }

  deleteProviderOverride(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.DeleteProviderOverride(data), this.logger, 'PaymentService', 'DeleteProviderOverride');
  }

  listProviderOverrides(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListProviderOverrides(data), this.logger, 'PaymentService', 'ListProviderOverrides');
  }

  createReassignmentJob(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateReassignmentJob(data), this.logger, 'PaymentService', 'CreateReassignmentJob');
  }

  getReassignmentJob(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetReassignmentJob(data), this.logger, 'PaymentService', 'GetReassignmentJob');
  }

  listAlerts(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListAlerts(data), this.logger, 'PaymentService', 'ListAlerts');
  }

  acknowledgeAlert(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.AcknowledgeAlert(data), this.logger, 'PaymentService', 'AcknowledgeAlert');
  }

  getAlertStats(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetAlertStats(data), this.logger, 'PaymentService', 'GetAlertStats');
  }

  createExportJob(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateExportJob(data), this.logger, 'PaymentService', 'CreateExportJob');
  }

  getExportJob(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetExportJob(data), this.logger, 'PaymentService', 'GetExportJob');
  }

  listExportJobs(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListExportJobs(data), this.logger, 'PaymentService', 'ListExportJobs');
  }

  downloadExport(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.DownloadExport(data), this.logger, 'PaymentService', 'DownloadExport');
  }

  getRiskScore(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetRiskScore(data), this.logger, 'PaymentService', 'GetRiskScore');
  }

  evaluateRiskScore(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.EvaluateRiskScore(data), this.logger, 'PaymentService', 'EvaluateRiskScore');
  }

  listRiskScores(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListRiskScores(data), this.logger, 'PaymentService', 'ListRiskScores');
  }

  getScoringStats(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetScoringStats(data), this.logger, 'PaymentService', 'GetScoringStats');
  }

  importBankStatement(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ImportBankStatement(data), this.logger, 'PaymentService', 'ImportBankStatement');
  }

  getReconciliationStatus(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetReconciliationStatus(data), this.logger, 'PaymentService', 'GetReconciliationStatus');
  }

  forceReconciliation(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ForceReconciliation(data), this.logger, 'PaymentService', 'ForceReconciliation');
  }

  listUnmatchedPayments(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListUnmatchedPayments(data), this.logger, 'PaymentService', 'ListUnmatchedPayments');
  }

  listProviderStatusMappings(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListProviderStatusMappings(data), this.logger, 'PaymentService', 'ListProviderStatusMappings');
  }

  updateProviderStatusMapping(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.UpdateProviderStatusMapping(data), this.logger, 'PaymentService', 'UpdateProviderStatusMapping');
  }

  listRejectionReasons(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListRejectionReasons(data), this.logger, 'PaymentService', 'ListRejectionReasons');
  }

  createRejectionReason(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreateRejectionReason(data), this.logger, 'PaymentService', 'CreateRejectionReason');
  }

  updateRejectionReason(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.UpdateRejectionReason(data), this.logger, 'PaymentService', 'UpdateRejectionReason');
  }

  listPayments(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListPayments(data), this.logger, 'PaymentService', 'ListPayments');
  }

  getPaymentStats(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetPaymentStats(data), this.logger, 'PaymentService', 'GetPaymentStats');
  }

  createPortalSession(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CreatePortalSession(data), this.logger, 'PaymentService', 'CreatePortalSession');
  }

  validatePortalToken(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ValidatePortalToken(data), this.logger, 'PaymentService', 'ValidatePortalToken');
  }

  accessPortalSession(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.AccessPortalSession(data), this.logger, 'PaymentService', 'AccessPortalSession');
  }

  consumePortalToken(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ConsumePortalToken(data), this.logger, 'PaymentService', 'ConsumePortalToken');
  }

  cancelPortalSession(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.CancelPortalSession(data), this.logger, 'PaymentService', 'CancelPortalSession');
  }

  updatePortalPspInfo(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.UpdatePortalPspInfo(data), this.logger, 'PaymentService', 'UpdatePortalPspInfo');
  }

  transitionPortalSession(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.TransitionPortalSession(data), this.logger, 'PaymentService', 'TransitionPortalSession');
  }

  listPortalSessions(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.ListPortalSessions(data), this.logger, 'PaymentService', 'ListPortalSessions');
  }

  getPortalSessionAudit(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetPortalSessionAudit(data), this.logger, 'PaymentService', 'GetPortalSessionAudit');
  }

  getPortalSessionStats(data: Record<string, unknown>): Observable<unknown> {
    return wrapGrpcCall(this.paymentService.GetPortalSessionStats(data), this.logger, 'PaymentService', 'GetPortalSessionStats');
  }
}

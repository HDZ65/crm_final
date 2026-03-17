import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { PaymentsGrpcClient } from '../grpc/payments-grpc.client';

@ApiTags('Payments')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsClient: PaymentsGrpcClient) {}

  // ==================== STRIPE ====================

  @Post('stripe/checkout-sessions')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  createStripeCheckoutSession(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createStripeCheckoutSession(body));
  }

  @Post('stripe/payment-intents')
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  createStripePaymentIntent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createStripePaymentIntent(body));
  }

  @Post('stripe/payment-intents/get')
  @ApiOperation({ summary: 'Get Stripe payment intent' })
  getStripePaymentIntent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getStripePaymentIntent(body));
  }

  @Post('stripe/payment-intents/cancel')
  @ApiOperation({ summary: 'Cancel Stripe payment intent' })
  cancelStripePaymentIntent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.cancelStripePaymentIntent(body));
  }

  @Post('stripe/customers')
  @ApiOperation({ summary: 'Create Stripe customer' })
  createStripeCustomer(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createStripeCustomer(body));
  }

  @Post('stripe/customers/get')
  @ApiOperation({ summary: 'Get Stripe customer' })
  getStripeCustomer(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getStripeCustomer(body));
  }

  @Post('stripe/subscriptions')
  @ApiOperation({ summary: 'Create Stripe subscription' })
  createStripeSubscription(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createStripeSubscription(body));
  }

  @Post('stripe/subscriptions/get')
  @ApiOperation({ summary: 'Get Stripe subscription' })
  getStripeSubscription(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getStripeSubscription(body));
  }

  @Post('stripe/subscriptions/cancel')
  @ApiOperation({ summary: 'Cancel Stripe subscription' })
  cancelStripeSubscription(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.cancelStripeSubscription(body));
  }

  @Post('stripe/refunds')
  @ApiOperation({ summary: 'Create Stripe refund' })
  createStripeRefund(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createStripeRefund(body));
  }

  @Post('stripe/setup-intents')
  @ApiOperation({ summary: 'Create Stripe setup intent' })
  createStripeSetupIntent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createStripeSetupIntent(body));
  }

  @Post('stripe/billing-portal-sessions')
  @ApiOperation({ summary: 'Create Stripe billing portal session' })
  createStripeBillingPortalSession(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createStripeBillingPortalSession(body));
  }

  // ==================== PAYPAL ====================

  @Post('paypal/orders')
  @ApiOperation({ summary: 'Create PayPal order' })
  createPayPalOrder(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createPayPalOrder(body));
  }

  @Post('paypal/orders/get')
  @ApiOperation({ summary: 'Get PayPal order' })
  getPayPalOrder(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getPayPalOrder(body));
  }

  @Post('paypal/orders/capture')
  @ApiOperation({ summary: 'Capture PayPal order' })
  capturePayPalOrder(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.capturePayPalOrder(body));
  }

  @Post('paypal/orders/authorize')
  @ApiOperation({ summary: 'Authorize PayPal order' })
  authorizePayPalOrder(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.authorizePayPalOrder(body));
  }

  // ==================== GOCARDLESS ====================

  @Post('gocardless/mandates/setup')
  @ApiOperation({ summary: 'Setup GoCardless mandate' })
  setupGoCardlessMandate(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.setupGoCardlessMandate(body));
  }

  @Post('gocardless/mandates/get')
  @ApiOperation({ summary: 'Get GoCardless mandate' })
  getGoCardlessMandate(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getGoCardlessMandate(body));
  }

  @Post('gocardless/mandates/cancel')
  @ApiOperation({ summary: 'Cancel GoCardless mandate' })
  cancelGoCardlessMandate(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.cancelGoCardlessMandate(body));
  }

  @Post('gocardless/payments')
  @ApiOperation({ summary: 'Create GoCardless payment' })
  createGoCardlessPayment(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createGoCardlessPayment(body));
  }

  @Post('gocardless/subscriptions')
  @ApiOperation({ summary: 'Create GoCardless subscription' })
  createGoCardlessSubscription(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createGoCardlessSubscription(body));
  }

  @Post('gocardless/subscriptions/cancel')
  @ApiOperation({ summary: 'Cancel GoCardless subscription' })
  cancelGoCardlessSubscription(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.cancelGoCardlessSubscription(body));
  }

  @Post('gocardless/mandates/list')
  @ApiOperation({ summary: 'List GoCardless mandates' })
  listGoCardlessMandates(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.listGoCardlessMandates(body));
  }

  // ==================== SCHEDULES ====================

  @Post('schedules')
  @ApiOperation({ summary: 'Create schedule' })
  createSchedule(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createSchedule(body));
  }

  @Post('schedules/get')
  @ApiOperation({ summary: 'Get schedule' })
  getSchedule(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getSchedule(body));
  }

  @Put('schedules')
  @ApiOperation({ summary: 'Update schedule' })
  updateSchedule(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.updateSchedule(body));
  }

  @Delete('schedules')
  @ApiOperation({ summary: 'Delete schedule' })
  deleteSchedule(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.deleteSchedule(body));
  }

  @Post('schedules/due')
  @ApiOperation({ summary: 'Get due schedules' })
  getDueSchedules(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getDueSchedules(body));
  }

  @Post('schedules/process-due')
  @ApiOperation({ summary: 'Process due payments' })
  processDuePayments(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.processDuePayments(body));
  }

  @Post('schedules/renew')
  @ApiOperation({ summary: 'Renew schedule' })
  renewSchedule(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.renewSchedule(body));
  }

  // ==================== PAYMENT INTENTS ====================

  @Post('intents')
  @ApiOperation({ summary: 'Create payment intent' })
  createPaymentIntent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createPaymentIntent(body));
  }

  @Post('intents/get')
  @ApiOperation({ summary: 'Get payment intent' })
  getPaymentIntent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getPaymentIntent(body));
  }

  @Put('intents')
  @ApiOperation({ summary: 'Update payment intent' })
  updatePaymentIntent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.updatePaymentIntent(body));
  }

  @Delete('intents')
  @ApiOperation({ summary: 'Delete payment intent' })
  deletePaymentIntent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.deletePaymentIntent(body));
  }

  // ==================== PAYMENT EVENTS ====================

  @Post('events')
  @ApiOperation({ summary: 'Create payment event' })
  createPaymentEvent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createPaymentEvent(body));
  }

  @Post('events/get')
  @ApiOperation({ summary: 'Get payment event' })
  getPaymentEvent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getPaymentEvent(body));
  }

  @Post('events/unprocessed')
  @ApiOperation({ summary: 'Get unprocessed payment events' })
  getUnprocessedEvents(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getUnprocessedEvents(body));
  }

  @Post('events/mark-processed')
  @ApiOperation({ summary: 'Mark payment event processed' })
  markEventProcessed(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.markEventProcessed(body));
  }

  // ==================== PSP ACCOUNTS ====================

  @Post('psp-accounts/summary')
  @ApiOperation({ summary: 'Get PSP accounts summary' })
  getPSPAccountsSummary(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getPSPAccountsSummary(body));
  }

  // ==================== SLIMPAY ====================

  @Post('slimpay/mandates')
  @ApiOperation({ summary: 'Create SlimPay mandate' })
  createSlimpayMandate(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createSlimpayMandate(body));
  }

  @Post('slimpay/mandates/get')
  @ApiOperation({ summary: 'Get SlimPay mandate' })
  getSlimpayMandate(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getSlimpayMandate(body));
  }

  @Post('slimpay/mandates/cancel')
  @ApiOperation({ summary: 'Cancel SlimPay mandate' })
  cancelSlimpayMandate(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.cancelSlimpayMandate(body));
  }

  @Post('slimpay/payments')
  @ApiOperation({ summary: 'Create SlimPay payment' })
  createSlimpayPayment(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createSlimpayPayment(body));
  }

  @Post('slimpay/payments/get')
  @ApiOperation({ summary: 'Get SlimPay payment' })
  getSlimpayPayment(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getSlimpayPayment(body));
  }

  // ==================== MULTISAFEPAY ====================

  @Post('multisafepay/transactions')
  @ApiOperation({ summary: 'Create MultiSafePay transaction' })
  createMultiSafepayTransaction(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createMultiSafepayTransaction(body));
  }

  @Post('multisafepay/transactions/get')
  @ApiOperation({ summary: 'Get MultiSafePay transaction' })
  getMultiSafepayTransaction(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getMultiSafepayTransaction(body));
  }

  @Post('multisafepay/transactions/refund')
  @ApiOperation({ summary: 'Refund MultiSafePay transaction' })
  refundMultiSafepayTransaction(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.refundMultiSafepayTransaction(body));
  }

  // ==================== EMERCHANTPAY ====================

  @Post('emerchantpay/payments')
  @ApiOperation({ summary: 'Create eMerchantPay payment' })
  createEmerchantpayPayment(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createEmerchantpayPayment(body));
  }

  @Post('emerchantpay/payments/get')
  @ApiOperation({ summary: 'Get eMerchantPay payment' })
  getEmerchantpayPayment(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getEmerchantpayPayment(body));
  }

  @Post('emerchantpay/payments/sepa')
  @ApiOperation({ summary: 'Create eMerchantPay SEPA payment' })
  createEmerchantpaySepaPayment(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createEmerchantpaySepaPayment(body));
  }

  @Post('emerchantpay/payments/refund')
  @ApiOperation({ summary: 'Refund eMerchantPay payment' })
  refundEmerchantpayPayment(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.refundEmerchantpayPayment(body));
  }

  // ==================== ROUTING ====================

  @Post('routing/rules')
  @ApiOperation({ summary: 'Create routing rule' })
  createRoutingRule(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createRoutingRule(body));
  }

  @Put('routing/rules')
  @ApiOperation({ summary: 'Update routing rule' })
  updateRoutingRule(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.updateRoutingRule(body));
  }

  @Delete('routing/rules')
  @ApiOperation({ summary: 'Delete routing rule' })
  deleteRoutingRule(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.deleteRoutingRule(body));
  }

  @Post('routing/rules/list')
  @ApiOperation({ summary: 'List routing rules' })
  listRoutingRules(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.listRoutingRules(body));
  }

  @Post('routing/rules/test')
  @ApiOperation({ summary: 'Test routing rule' })
  testRoutingRule(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.testRoutingRule(body));
  }

  @Post('routing/overrides')
  @ApiOperation({ summary: 'Create provider override' })
  createProviderOverride(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createProviderOverride(body));
  }

  @Delete('routing/overrides')
  @ApiOperation({ summary: 'Delete provider override' })
  deleteProviderOverride(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.deleteProviderOverride(body));
  }

  @Post('routing/overrides/list')
  @ApiOperation({ summary: 'List provider overrides' })
  listProviderOverrides(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.listProviderOverrides(body));
  }

  @Post('routing/reassignment-jobs')
  @ApiOperation({ summary: 'Create reassignment job' })
  createReassignmentJob(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createReassignmentJob(body));
  }

  @Post('routing/reassignment-jobs/get')
  @ApiOperation({ summary: 'Get reassignment job' })
  getReassignmentJob(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getReassignmentJob(body));
  }

  // ==================== ALERTS ====================

  @Post('alerts/list')
  @ApiOperation({ summary: 'List payment alerts' })
  listAlerts(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.listAlerts(body));
  }

  @Post('alerts/acknowledge')
  @ApiOperation({ summary: 'Acknowledge payment alert' })
  acknowledgeAlert(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.acknowledgeAlert(body));
  }

  @Post('alerts/stats')
  @ApiOperation({ summary: 'Get payment alert stats' })
  getAlertStats(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getAlertStats(body));
  }

  // ==================== EXPORTS ====================

  @Post('exports')
  @ApiOperation({ summary: 'Create export job' })
  createExportJob(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createExportJob(body));
  }

  @Post('exports/get')
  @ApiOperation({ summary: 'Get export job' })
  getExportJob(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getExportJob(body));
  }

  @Post('exports/list')
  @ApiOperation({ summary: 'List export jobs' })
  listExportJobs(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.listExportJobs(body));
  }

  @Post('exports/download')
  @ApiOperation({ summary: 'Download export file' })
  downloadExport(@Body() body: Record<string, unknown>) {
    // TODO: bytes field - implement multipart upload support
    return firstValueFrom(this.paymentsClient.downloadExport(body));
  }

  // ==================== RISK ====================

  @Post('risk/get-score')
  @ApiOperation({ summary: 'Get risk score' })
  getRiskScore(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getRiskScore(body));
  }

  @Post('risk/evaluate')
  @ApiOperation({ summary: 'Evaluate risk score' })
  evaluateRiskScore(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.evaluateRiskScore(body));
  }

  @Post('risk/list')
  @ApiOperation({ summary: 'List risk scores' })
  listRiskScores(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.listRiskScores(body));
  }

  @Post('risk/stats')
  @ApiOperation({ summary: 'Get scoring stats' })
  getScoringStats(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getScoringStats(body));
  }

  // ==================== RECONCILIATION ====================

  @Post('reconciliation/import-bank-statement')
  @ApiOperation({ summary: 'Import bank statement' })
  importBankStatement(@Body() body: Record<string, unknown>) {
    // TODO: bytes field - implement multipart upload support
    return firstValueFrom(this.paymentsClient.importBankStatement(body));
  }

  @Post('reconciliation/status')
  @ApiOperation({ summary: 'Get reconciliation status' })
  getReconciliationStatus(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getReconciliationStatus(body));
  }

  @Post('reconciliation/force')
  @ApiOperation({ summary: 'Force reconciliation' })
  forceReconciliation(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.forceReconciliation(body));
  }

  @Post('reconciliation/unmatched-payments')
  @ApiOperation({ summary: 'List unmatched payments' })
  listUnmatchedPayments(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.listUnmatchedPayments(body));
  }

  // ==================== STATUS MAPPINGS ====================

  @Post('status-mappings/list')
  @ApiOperation({ summary: 'List provider status mappings' })
  listProviderStatusMappings(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.listProviderStatusMappings(body));
  }

  @Put('status-mappings')
  @ApiOperation({ summary: 'Update provider status mapping' })
  updateProviderStatusMapping(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.updateProviderStatusMapping(body));
  }

  // ==================== REJECTION REASONS ====================

  @Post('rejection-reasons/list')
  @ApiOperation({ summary: 'List rejection reasons' })
  listRejectionReasons(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.listRejectionReasons(body));
  }

  @Post('rejection-reasons')
  @ApiOperation({ summary: 'Create rejection reason' })
  createRejectionReason(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createRejectionReason(body));
  }

  @Put('rejection-reasons')
  @ApiOperation({ summary: 'Update rejection reason' })
  updateRejectionReason(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.updateRejectionReason(body));
  }

  // ==================== PAYMENT QUERIES ====================

  @Get()
  @ApiOperation({ summary: 'List payments' })
  listPayments(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.listPayments(query));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment stats' })
  getPaymentStats(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.getPaymentStats(query));
  }

  // ==================== JOURNAL / FEC EXPORTS ====================

  @Post('exports/journal')
  @ApiOperation({ summary: 'Create journal export (FEC/CSV/XLSX)' })
  createJournalExport(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.paymentsClient.createJournalExport(body));
  }

  @Get('exports/formats')
  @ApiOperation({ summary: 'Get available journal export formats' })
  getJournalExportFormats() {
    return firstValueFrom(this.paymentsClient.getJournalExportFormats({}));
  }

  @Get('exports/config/:societeId')
  @ApiOperation({ summary: 'Get export config for societe' })
  getExportConfig(@Param('societeId') societeId: string) {
    return firstValueFrom(
      this.paymentsClient.getExportConfig({ societe_id: societeId }),
    );
  }

  @Put('exports/config/:societeId')
  @ApiOperation({ summary: 'Update export config for societe' })
  updateExportConfig(
    @Param('societeId') societeId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.paymentsClient.updateExportConfig({ ...body, societe_id: societeId }),
    );
  }
}

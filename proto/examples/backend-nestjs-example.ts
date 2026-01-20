/**
 * Backend NestJS gRPC Examples
 *
 * This file demonstrates how to integrate the proto files
 * with NestJS microservices architecture.
 */

import { Module, Injectable, Controller } from '@nestjs/common';
import { ClientsModule, Transport, ClientGrpc } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';

// =============================================================================
// EXAMPLE 1: Configure gRPC Client Module
// =============================================================================

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PAYMENT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'payment',
          protoPath: join(__dirname, '../../proto/payment.proto'),
          url: 'localhost:50051',
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
      {
        name: 'INVOICE_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'invoice',
          protoPath: join(__dirname, '../../proto/invoice.proto'),
          url: 'localhost:50052',
        },
      },
      {
        name: 'LOGISTICS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'logistics',
          protoPath: join(__dirname, '../../proto/logistics.proto'),
          url: 'localhost:50053',
        },
      },
      {
        name: 'EMAIL_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'email',
          protoPath: join(__dirname, '../../proto/email.proto'),
          url: 'localhost:50054',
        },
      },
      {
        name: 'NOTIFICATION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'notifications',
          protoPath: join(__dirname, '../../proto/notifications.proto'),
          url: 'localhost:50055',
        },
      },
      {
        name: 'COMMISSION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'commission',
          protoPath: join(__dirname, '../../proto/commission.proto'),
          url: 'localhost:50056',
        },
      },
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [ClientsModule],
})
export class GrpcClientModule {}

// =============================================================================
// EXAMPLE 2: Payment Service Interface
// =============================================================================

export interface PaymentService {
  createStripeCheckoutSession(data: any): Observable<any>;
  createStripePaymentIntent(data: any): Observable<any>;
  getStripePaymentIntent(data: any): Observable<any>;
  createStripeCustomer(data: any): Observable<any>;
  createStripeSubscription(data: any): Observable<any>;
  createStripeRefund(data: any): Observable<any>;

  createPayPalOrder(data: any): Observable<any>;
  capturePayPalOrder(data: any): Observable<any>;
  getPayPalOrder(data: any): Observable<any>;

  setupGoCardlessMandate(data: any): Observable<any>;
  getGoCardlessMandate(data: any): Observable<any>;
  createGoCardlessPayment(data: any): Observable<any>;
  createGoCardlessSubscription(data: any): Observable<any>;

  createSchedule(data: any): Observable<any>;
  getSchedule(data: any): Observable<any>;
  processDuePayments(data: any): Observable<any>;
}

// =============================================================================
// EXAMPLE 3: Payment Service Client (Injectable)
// =============================================================================

@Injectable()
export class PaymentClientService {
  private paymentService: PaymentService;

  constructor(@Inject('PAYMENT_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.paymentService = this.client.getService<PaymentService>('PaymentService');
  }

  async createStripeCheckout(data: {
    societeId: string;
    amount: number;
    currency: string;
    mode: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    return this.paymentService.createStripeCheckoutSession(data).toPromise();
  }

  async createPayPalOrder(data: {
    societeId: string;
    intent: string;
    purchaseUnits: any[];
    returnUrl: string;
    cancelUrl: string;
  }) {
    return this.paymentService.createPayPalOrder(data).toPromise();
  }

  async setupGoCardlessMandate(data: {
    clientId: string;
    societeId: string;
    scheme: string;
    successRedirectUrl: string;
  }) {
    return this.paymentService.setupGoCardlessMandate(data).toPromise();
  }

  async createSchedule(data: {
    organisationId: string;
    societeId: string;
    contratId?: string;
    factureId?: string;
    clientId?: string;
    amount: number;
    currency: string;
    dueDate: string;
    autoProcess: boolean;
  }) {
    return this.paymentService.createSchedule(data).toPromise();
  }
}

// =============================================================================
// EXAMPLE 4: HTTP Controller Using gRPC Client
// =============================================================================

import { Body, Post, Get, Param } from '@nestjs/common';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentClient: PaymentClientService) {}

  @Post('stripe/checkout')
  async createStripeCheckout(@Body() body: any) {
    return this.paymentClient.createStripeCheckout({
      societeId: body.societeId,
      amount: body.amount,
      currency: body.currency || 'eur',
      mode: body.mode || 'payment',
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });
  }

  @Post('paypal/orders')
  async createPayPalOrder(@Body() body: any) {
    return this.paymentClient.createPayPalOrder({
      societeId: body.societeId,
      intent: body.intent || 'CAPTURE',
      purchaseUnits: body.purchaseUnits,
      returnUrl: body.returnUrl,
      cancelUrl: body.cancelUrl,
    });
  }

  @Post('gocardless/mandates')
  async setupMandate(@Body() body: any) {
    return this.paymentClient.setupGoCardlessMandate({
      clientId: body.clientId,
      societeId: body.societeId,
      scheme: body.scheme || 'sepa_core',
      successRedirectUrl: body.successRedirectUrl,
    });
  }

  @Post('schedules')
  async createSchedule(@Body() body: any) {
    return this.paymentClient.createSchedule({
      organisationId: body.organisationId,
      societeId: body.societeId,
      contratId: body.contratId,
      factureId: body.factureId,
      clientId: body.clientId,
      amount: body.amount,
      currency: body.currency || 'eur',
      dueDate: body.dueDate,
      autoProcess: body.autoProcess ?? true,
    });
  }
}

// =============================================================================
// EXAMPLE 5: Invoice Service Interface and Client
// =============================================================================

export interface InvoiceService {
  createInvoice(data: any): Observable<any>;
  findAllInvoices(data: any): Observable<any>;
  findOneInvoice(data: any): Observable<any>;
  updateInvoice(data: any): Observable<any>;
  validateInvoice(data: any): Observable<any>;
  markInvoiceAsPaid(data: any): Observable<any>;
  createCreditNote(data: any): Observable<any>;
  downloadInvoicePdf(data: any): Observable<any>;
}

@Injectable()
export class InvoiceClientService {
  private invoiceService: InvoiceService;

  constructor(@Inject('INVOICE_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.invoiceService = this.client.getService<InvoiceService>('InvoiceService');
  }

  async createInvoice(data: any) {
    return this.invoiceService.createInvoice(data).toPromise();
  }

  async validateInvoice(id: string, branding?: any) {
    return this.invoiceService.validateInvoice({ id, branding }).toPromise();
  }

  async downloadPdf(id: string) {
    return this.invoiceService.downloadInvoicePdf({ id }).toPromise();
  }
}

// =============================================================================
// EXAMPLE 6: Logistics Service Interface and Client
// =============================================================================

export interface LogisticsService {
  createExpedition(data: any): Observable<any>;
  getExpedition(data: any): Observable<any>;
  trackShipment(data: any): Observable<any>;
  generateLabel(data: any): Observable<any>;
  validateAddress(data: any): Observable<any>;
  simulatePricing(data: any): Observable<any>;
}

@Injectable()
export class LogisticsClientService {
  private logisticsService: LogisticsService;

  constructor(@Inject('LOGISTICS_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.logisticsService = this.client.getService<LogisticsService>('LogisticsService');
  }

  async createExpedition(data: any) {
    return this.logisticsService.createExpedition(data).toPromise();
  }

  async trackShipment(trackingNumber: string) {
    return this.logisticsService.trackShipment({ trackingNumber }).toPromise();
  }

  async generateLabel(data: any) {
    return this.logisticsService.generateLabel(data).toPromise();
  }
}

// =============================================================================
// EXAMPLE 7: Email Service Interface and Client
// =============================================================================

export interface EmailService {
  createMailbox(data: any): Observable<any>;
  getMailbox(data: any): Observable<any>;
  sendEmail(data: any): Observable<any>;
  getGoogleAuthUrl(data: any): Observable<any>;
  exchangeGoogleCode(data: any): Observable<any>;
  getMicrosoftAuthUrl(data: any): Observable<any>;
  exchangeMicrosoftCode(data: any): Observable<any>;
}

@Injectable()
export class EmailClientService {
  private emailService: EmailService;

  constructor(@Inject('EMAIL_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.emailService = this.client.getService<EmailService>('EmailService');
  }

  async sendEmail(data: {
    mailboxId: string;
    to: Array<{ email: string; name?: string }>;
    subject: string;
    htmlBody?: string;
    textBody?: string;
  }) {
    return this.emailService.sendEmail(data).toPromise();
  }

  async getGoogleAuthUrl(redirectUri: string) {
    return this.emailService.getGoogleAuthUrl({
      redirectUri,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
    }).toPromise();
  }
}

// =============================================================================
// EXAMPLE 8: Notification Service Interface and Client
// =============================================================================

export interface NotificationService {
  createNotification(data: any): Observable<any>;
  getNotificationsByUser(data: any): Observable<any>;
  getUnreadCount(data: any): Observable<any>;
  markAsRead(data: any): Observable<any>;
  markAllAsRead(data: any): Observable<any>;
  notifyNewClient(data: any): Observable<any>;
  notifyNewContrat(data: any): Observable<any>;
}

@Injectable()
export class NotificationClientService {
  private notificationService: NotificationService;

  constructor(@Inject('NOTIFICATION_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.notificationService = this.client.getService<NotificationService>('NotificationService');
  }

  async createNotification(data: {
    organisationId: string;
    utilisateurId: string;
    type: number;
    titre: string;
    message: string;
    broadcastWebsocket?: boolean;
  }) {
    return this.notificationService.createNotification(data).toPromise();
  }

  async notifyNewClient(data: {
    organisationId: string;
    utilisateurId: string;
    clientId: string;
    clientNom: string;
  }) {
    return this.notificationService.notifyNewClient(data).toPromise();
  }
}

// =============================================================================
// EXAMPLE 9: Commission Service Interface and Client
// =============================================================================

export interface CommissionService {
  createCommission(data: any): Observable<any>;
  getCommission(data: any): Observable<any>;
  calculerCommission(data: any): Observable<any>;
  genererBordereau(data: any): Observable<any>;
  createBareme(data: any): Observable<any>;
  getBaremeApplicable(data: any): Observable<any>;
}

@Injectable()
export class CommissionClientService {
  private commissionService: CommissionService;

  constructor(@Inject('COMMISSION_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.commissionService = this.client.getService<CommissionService>('CommissionService');
  }

  async calculateCommission(data: {
    organisationId: string;
    apporteurId: string;
    contratId: string;
    typeProduit: string;
    montantBase: string;
    periode: string;
  }) {
    return this.commissionService.calculerCommission(data).toPromise();
  }

  async generateBordereau(data: {
    organisationId: string;
    apporteurId: string;
    periode: string;
  }) {
    return this.commissionService.genererBordereau(data).toPromise();
  }
}

// =============================================================================
// EXAMPLE 10: Complete App Module Configuration
// =============================================================================

import { Inject } from '@nestjs/common';

@Module({
  imports: [GrpcClientModule],
  controllers: [PaymentController],
  providers: [
    PaymentClientService,
    InvoiceClientService,
    LogisticsClientService,
    EmailClientService,
    NotificationClientService,
    CommissionClientService,
  ],
  exports: [
    PaymentClientService,
    InvoiceClientService,
    LogisticsClientService,
    EmailClientService,
    NotificationClientService,
    CommissionClientService,
  ],
})
export class AppModule {}

// =============================================================================
// EXAMPLE 11: gRPC Server Setup (Microservice)
// =============================================================================

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'payment',
      protoPath: join(__dirname, '../proto/payment.proto'),
      url: '0.0.0.0:50051',
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  await app.listen();
  console.log('Payment microservice is listening on port 50051');
}

bootstrap();

// =============================================================================
// EXAMPLE 12: gRPC Controller (Server-side)
// =============================================================================

import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class PaymentGrpcController {
  constructor(private readonly stripeService: StripeService) {}

  @GrpcMethod('PaymentService', 'CreateStripeCheckoutSession')
  async createStripeCheckoutSession(data: any) {
    return this.stripeService.createCheckoutSession(data);
  }

  @GrpcMethod('PaymentService', 'CreateStripePaymentIntent')
  async createStripePaymentIntent(data: any) {
    return this.stripeService.createPaymentIntent(data);
  }

  @GrpcMethod('PaymentService', 'CreateStripeCustomer')
  async createStripeCustomer(data: any) {
    return this.stripeService.createCustomer(data);
  }
}

// =============================================================================
// EXAMPLE 13: Health Check for gRPC Services
// =============================================================================

@Injectable()
export class GrpcHealthCheckService {
  constructor(
    @Inject('PAYMENT_PACKAGE') private paymentClient: ClientGrpc,
    @Inject('INVOICE_PACKAGE') private invoiceClient: ClientGrpc,
  ) {}

  async checkPaymentService(): Promise<boolean> {
    try {
      // Implement health check logic
      return true;
    } catch (error) {
      console.error('Payment service health check failed:', error);
      return false;
    }
  }
}

// =============================================================================
// EXAMPLE 14: Error Handling with gRPC
// =============================================================================

import { RpcException } from '@nestjs/microservices';

@Injectable()
export class PaymentServiceWithErrorHandling {
  async createCheckout(data: any) {
    try {
      // Business logic
      return { success: true };
    } catch (error) {
      throw new RpcException({
        code: 'INTERNAL',
        message: 'Failed to create checkout',
        details: error.message,
      });
    }
  }
}

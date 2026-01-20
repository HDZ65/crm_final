/**
 * Exemple de client gRPC pour le service de facturation
 *
 * Ce fichier montre comment consommer le microservice gRPC depuis une autre application NestJS
 */

import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';

// Définir les interfaces TypeScript basées sur le fichier proto
interface CreateInvoiceRequest {
  customerName: string;
  customerAddress: string;
  customerSiret?: string;
  customerTvaNumber?: string;
  customerEmail?: string;
  customerPhone?: string;
  issueDate: string;
  deliveryDate: string;
  dueDate?: string;
  paymentTermsDays?: number;
  latePaymentInterestRate?: number;
  recoveryIndemnity?: number;
  vatMention?: string;
  notes?: string;
  items: CreateInvoiceItem[];
}

interface CreateInvoiceItem {
  description: string;
  quantity: number;
  unit?: string;
  unitPriceHT: number;
  vatRate: number;
  discount?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  customerName: string;
  customerAddress: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  // ... autres champs
}

interface FindAllResponse {
  invoices: Invoice[];
  total: number;
}

// Interface du service gRPC
interface InvoiceGrpcService {
  createInvoice(data: CreateInvoiceRequest): Observable<Invoice>;
  findAllInvoices(data: { limit?: number; offset?: number }): Observable<FindAllResponse>;
  findOneInvoice(data: { id: string }): Observable<Invoice>;
  updateInvoice(data: any): Observable<Invoice>;
  deleteInvoice(data: { id: string }): Observable<{ success: boolean; message: string }>;
  validateInvoice(data: { id: string }): Observable<Invoice>;
  markInvoiceAsPaid(data: { id: string }): Observable<Invoice>;
  createCreditNote(data: { id: string }): Observable<Invoice>;
  downloadInvoicePdf(data: { id: string }): Observable<{ pdfData: Buffer; fileName: string; invoiceNumber: string }>;
}

@Injectable()
export class InvoiceClientService implements OnModuleInit {
  private invoiceService: InvoiceGrpcService;

  constructor(private client: ClientGrpc) {}

  onModuleInit() {
    this.invoiceService = this.client.getService<InvoiceGrpcService>('InvoiceService');
  }

  /**
   * Créer une nouvelle facture
   */
  createInvoice(data: CreateInvoiceRequest): Observable<Invoice> {
    return this.invoiceService.createInvoice(data);
  }

  /**
   * Liste toutes les factures
   */
  findAllInvoices(): Observable<FindAllResponse> {
    return this.invoiceService.findAllInvoices({});
  }

  /**
   * Récupérer une facture par ID
   */
  findOneInvoice(id: string): Observable<Invoice> {
    return this.invoiceService.findOneInvoice({ id });
  }

  /**
   * Valider une facture
   */
  validateInvoice(id: string): Observable<Invoice> {
    return this.invoiceService.validateInvoice({ id });
  }

  /**
   * Télécharger le PDF d'une facture
   */
  downloadInvoicePdf(id: string): Observable<{ pdfData: Buffer; fileName: string; invoiceNumber: string }> {
    return this.invoiceService.downloadInvoicePdf({ id });
  }
}

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INVOICE_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'invoice',
          protoPath: join(__dirname, '../proto/invoice.proto'),
          url: process.env.INVOICE_GRPC_URL || 'localhost:50051',
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
        },
      },
    ]),
  ],
  providers: [InvoiceClientService],
  exports: [InvoiceClientService],
})
export class InvoiceClientModule {}

// ============================================
// EXEMPLE D'UTILISATION DANS UN CONTROLLER
// ============================================

/*
import { Controller, Get, Post, Body } from '@nestjs/common';
import { InvoiceClientService } from './invoice-client.service';
import { firstValueFrom } from 'rxjs';

@Controller('my-invoices')
export class MyInvoicesController {
  constructor(private readonly invoiceClient: InvoiceClientService) {}

  @Post()
  async createInvoice(@Body() createDto: any) {
    // Créer une facture via gRPC
    const invoice = await firstValueFrom(
      this.invoiceClient.createInvoice({
        customerName: createDto.customerName,
        customerAddress: createDto.customerAddress,
        issueDate: new Date().toISOString(),
        deliveryDate: new Date().toISOString(),
        items: createDto.items,
      })
    );

    return invoice;
  }

  @Get()
  async getAllInvoices() {
    // Récupérer toutes les factures via gRPC
    const result = await firstValueFrom(this.invoiceClient.findAllInvoices());
    return result.invoices;
  }

  @Post(':id/validate')
  async validateInvoice(@Param('id') id: string) {
    // Valider une facture via gRPC
    const invoice = await firstValueFrom(this.invoiceClient.validateInvoice(id));
    return invoice;
  }
}
*/

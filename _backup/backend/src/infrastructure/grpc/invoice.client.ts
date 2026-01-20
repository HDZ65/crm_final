import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'node:path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

// Types correspondant au proto
export enum InvoiceStatus {
  DRAFT = 0,
  VALIDATED = 1,
  PAID = 2,
  CANCELLED = 3,
  CREDIT_NOTE = 4,
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceHT: number;
  vatRate: number;
  discount: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export interface CreateInvoiceItem {
  description: string;
  quantity: number;
  unit?: string;
  unitPriceHT: number;
  vatRate: number;
  discount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  customerName: string;
  customerAddress: string;
  customerSiret?: string;
  customerTvaNumber?: string;
  customerEmail?: string;
  customerPhone?: string;
  issueDate: string;
  deliveryDate: string;
  dueDate: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  paymentTermsDays: number;
  latePaymentInterestRate: number;
  recoveryIndemnity: number;
  vatMention?: string;
  notes?: string;
  items: InvoiceItem[];
  pdfPath?: string;
  pdfHash?: string;
  originalInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
  paidAt?: string;
}

export interface CreateInvoiceRequest {
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

export interface UpdateInvoiceRequest extends CreateInvoiceRequest {
  id: string;
  status?: InvoiceStatus;
}

export interface FindAllRequest {
  limit?: number;
  offset?: number;
}

export interface FindAllResponse {
  invoices: Invoice[];
  total: number;
}

export interface DownloadPdfResponse {
  pdfData: Buffer;
  fileName: string;
  invoiceNumber: string;
}

export interface CompanyBranding {
  logoBase64?: string;
  logoMimeType?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companySiret?: string;
  companyTvaNumber?: string;
  companyRcs?: string;
  companyCapital?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  headerText?: string;
  footerText?: string;
  legalMentions?: string;
  paymentTerms?: string;
  invoicePrefix?: string;
  showLogo?: boolean;
  logoPosition?: string;
}

export interface ValidateInvoiceRequest {
  id: string;
  branding?: CompanyBranding;
}

// Interface du service gRPC
interface InvoiceGrpcService {
  CreateInvoice(
    req: CreateInvoiceRequest,
    callback: (err: grpc.ServiceError | null, response: Invoice) => void,
  ): void;
  FindAllInvoices(
    req: FindAllRequest,
    callback: (err: grpc.ServiceError | null, response: FindAllResponse) => void,
  ): void;
  FindOneInvoice(
    req: { id: string },
    callback: (err: grpc.ServiceError | null, response: Invoice) => void,
  ): void;
  UpdateInvoice(
    req: UpdateInvoiceRequest,
    callback: (err: grpc.ServiceError | null, response: Invoice) => void,
  ): void;
  DeleteInvoice(
    req: { id: string },
    callback: (err: grpc.ServiceError | null, response: { success: boolean; message: string }) => void,
  ): void;
  ValidateInvoice(
    req: ValidateInvoiceRequest,
    callback: (err: grpc.ServiceError | null, response: Invoice) => void,
  ): void;
  MarkInvoiceAsPaid(
    req: { id: string },
    callback: (err: grpc.ServiceError | null, response: Invoice) => void,
  ): void;
  CreateCreditNote(
    req: { id: string },
    callback: (err: grpc.ServiceError | null, response: Invoice) => void,
  ): void;
  DownloadInvoicePdf(
    req: { id: string },
    callback: (err: grpc.ServiceError | null, response: DownloadPdfResponse) => void,
  ): void;
}

@Injectable()
export class InvoiceGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(InvoiceGrpcClient.name);
  private client!: InvoiceGrpcService;
  private isConnected = false;

  onModuleInit() {
    this.connect();
  }

  private connect() {
    try {
      const projectRoot = path.join(__dirname, '../../../../');
      const protoPath = path.join(projectRoot, 'src/infrastructure/grpc/invoice.proto');

      const pkgDef = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: Number,
        defaults: true,
        oneofs: true,
        bytes: Buffer,
      });

      const grpcObj = grpc.loadPackageDefinition(pkgDef) as any;
      const grpcUrl = process.env.INVOICE_GRPC_URL || 'localhost:50051';

      this.client = new grpcObj.invoice.InvoiceService(
        grpcUrl,
        grpc.credentials.createInsecure(),
        {
          'grpc.keepalive_time_ms': 30000,
          'grpc.keepalive_timeout_ms': 10000,
          'grpc.max_receive_message_length': 20 * 1024 * 1024, // 20MB for PDF responses
          'grpc.max_send_message_length': 20 * 1024 * 1024,    // 20MB for base64 images
        },
      ) as InvoiceGrpcService;

      this.isConnected = true;
      this.logger.log(`Connected to Invoice gRPC service at ${grpcUrl}`);
    } catch (error) {
      this.logger.error(`Failed to connect to Invoice gRPC service: ${error}`);
      this.isConnected = false;
    }
  }

  private ensureConnected(): void {
    if (!this.isConnected) {
      this.connect();
    }
    if (!this.isConnected) {
      throw new Error('Invoice gRPC service is not available');
    }
  }

  async createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.client.CreateInvoice(request, (err, response) => {
        if (err) {
          this.logger.error(`CreateInvoice error: ${err.message}`);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  async findAllInvoices(request: FindAllRequest = {}): Promise<FindAllResponse> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.client.FindAllInvoices(request, (err, response) => {
        if (err) {
          this.logger.error(`FindAllInvoices error: ${err.message}`);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  async findOneInvoice(id: string): Promise<Invoice> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.client.FindOneInvoice({ id }, (err, response) => {
        if (err) {
          this.logger.error(`FindOneInvoice error: ${err.message}`);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  async updateInvoice(request: UpdateInvoiceRequest): Promise<Invoice> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.client.UpdateInvoice(request, (err, response) => {
        if (err) {
          this.logger.error(`UpdateInvoice error: ${err.message}`);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  async deleteInvoice(id: string): Promise<{ success: boolean; message: string }> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.client.DeleteInvoice({ id }, (err, response) => {
        if (err) {
          this.logger.error(`DeleteInvoice error: ${err.message}`);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  async validateInvoice(id: string, branding?: CompanyBranding): Promise<Invoice> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      const request: ValidateInvoiceRequest = { id, branding };
      this.client.ValidateInvoice(request, (err, response) => {
        if (err) {
          this.logger.error(`ValidateInvoice error: ${err.message}`);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  async markInvoiceAsPaid(id: string): Promise<Invoice> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.client.MarkInvoiceAsPaid({ id }, (err, response) => {
        if (err) {
          this.logger.error(`MarkInvoiceAsPaid error: ${err.message}`);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  async createCreditNote(id: string): Promise<Invoice> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.client.CreateCreditNote({ id }, (err, response) => {
        if (err) {
          this.logger.error(`CreateCreditNote error: ${err.message}`);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }

  async downloadInvoicePdf(id: string): Promise<DownloadPdfResponse> {
    this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.client.DownloadInvoicePdf({ id }, (err, response) => {
        if (err) {
          this.logger.error(`DownloadInvoicePdf error: ${err.message}`);
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
}

import { Controller, UseInterceptors } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import * as fs from 'fs';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ImmutabilityInterceptor } from '../../common/interceptors/immutability.interceptor';
import { toCompanyBranding } from '../../common/interfaces/company-branding.interface';

/**
 * Controller gRPC pour la gestion des factures
 * Conformité légale française + Support Factur-X
 */
@Controller()
@UseInterceptors(ImmutabilityInterceptor)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /**
   * gRPC: CreateInvoice
   * Crée une nouvelle facture (statut: DRAFT)
   */
  @GrpcMethod('InvoiceService', 'CreateInvoice')
  async createInvoice(data: CreateInvoiceDto) {
    try {
      console.log('[CreateInvoice] Received data:', JSON.stringify(data, null, 2));
      const result = await this.invoicesService.create(data);
      console.log('[CreateInvoice] Success:', result.invoiceNumber);
      return result;
    } catch (error) {
      console.error('[CreateInvoice] ERROR:', error.message);
      console.error('[CreateInvoice] Stack:', error.stack);
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: error.message,
      });
    }
  }

  /**
   * gRPC: FindAllInvoices
   * Liste toutes les factures
   */
  @GrpcMethod('InvoiceService', 'FindAllInvoices')
  async findAllInvoices(data: { limit?: number; offset?: number }) {
    try {
      const invoices = await this.invoicesService.findAll();
      return {
        invoices,
        total: invoices.length,
      };
    } catch (error) {
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: error.message,
      });
    }
  }

  /**
   * gRPC: FindOneInvoice
   * Récupère une facture par ID
   */
  @GrpcMethod('InvoiceService', 'FindOneInvoice')
  async findOneInvoice(data: { id: string }) {
    try {
      return await this.invoicesService.findOne(data.id);
    } catch (error) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: error.message,
      });
    }
  }

  /**
   * gRPC: UpdateInvoice
   * Met à jour une facture
   * BLOQUÉ si status !== DRAFT
   */
  @GrpcMethod('InvoiceService', 'UpdateInvoice')
  async updateInvoice(data: UpdateInvoiceDto & { id: string }) {
    try {
      const { id, ...updateDto } = data;
      return await this.invoicesService.update(id, updateDto);
    } catch (error) {
      throw new RpcException({
        code: GrpcStatus.FAILED_PRECONDITION,
        message: error.message,
      });
    }
  }

  /**
   * gRPC: DeleteInvoice
   * Supprime une facture
   * BLOQUÉ si status !== DRAFT
   */
  @GrpcMethod('InvoiceService', 'DeleteInvoice')
  async deleteInvoice(data: { id: string }) {
    try {
      await this.invoicesService.remove(data.id);
      return {
        success: true,
        message: 'Facture supprimée avec succès',
      };
    } catch (error) {
      throw new RpcException({
        code: GrpcStatus.FAILED_PRECONDITION,
        message: error.message,
      });
    }
  }

  /**
   * gRPC: ValidateInvoice
   * Valide une facture et génère le PDF Factur-X
   * Après validation, la facture devient IMMUTABLE
   */
  @GrpcMethod('InvoiceService', 'ValidateInvoice')
  async validateInvoice(data: { id: string; branding?: any }) {
    try {
      const branding = toCompanyBranding(data.branding);
      return await this.invoicesService.validate(data.id, branding);
    } catch (error) {
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: error.message,
      });
    }
  }

  /**
   * gRPC: MarkInvoiceAsPaid
   * Marque une facture comme payée
   */
  @GrpcMethod('InvoiceService', 'MarkInvoiceAsPaid')
  async markInvoiceAsPaid(data: { id: string }) {
    try {
      return await this.invoicesService.markAsPaid(data.id);
    } catch (error) {
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: error.message,
      });
    }
  }

  /**
   * gRPC: CreateCreditNote
   * Crée un avoir (credit note) pour une facture existante
   * Seule action autorisée sur une facture VALIDATED/PAID
   */
  @GrpcMethod('InvoiceService', 'CreateCreditNote')
  async createCreditNote(data: { id: string }) {
    try {
      return await this.invoicesService.createCreditNote(data.id);
    } catch (error) {
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: error.message,
      });
    }
  }

  /**
   * gRPC: DownloadInvoicePdf
   * Télécharge le PDF Factur-X de la facture
   */
  @GrpcMethod('InvoiceService', 'DownloadInvoicePdf')
  async downloadInvoicePdf(data: { id: string }) {
    try {
      const invoice = await this.invoicesService.findOne(data.id);

      if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
        throw new RpcException({
          code: GrpcStatus.NOT_FOUND,
          message:
            'PDF non trouvé. Veuillez valider la facture pour générer le PDF.',
        });
      }

      const pdfData = fs.readFileSync(invoice.pdfPath);
      const fileName = `${invoice.invoiceNumber.replace(/\//g, '-')}.pdf`;

      return {
        pdfData,
        fileName,
        invoiceNumber: invoice.invoiceNumber,
      };
    } catch (error) {
      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: error.message,
      });
    }
  }
}

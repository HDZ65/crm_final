import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Optional,
  Inject,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InvoiceGrpcClient,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  Invoice,
  FindAllResponse,
} from '../../../grpc/invoice.client';
import { GetFactureSettingsUseCase } from '../../../../applications/usecase/facture-settings';

// DTOs pour Swagger et validation
class CreateInvoiceItemDto {
  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  unitPriceHT!: number;

  @IsNumber()
  vatRate!: number;

  @IsOptional()
  @IsNumber()
  discount?: number;
}

class CreateInvoiceDto {
  @IsString()
  customerName!: string;

  @IsString()
  customerAddress!: string;

  @IsOptional()
  @IsString()
  customerSiret?: string;

  @IsOptional()
  @IsString()
  customerTvaNumber?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsString()
  issueDate!: string;

  @IsString()
  deliveryDate!: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  paymentTermsDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  latePaymentInterestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  recoveryIndemnity?: number;

  @IsOptional()
  @IsString()
  vatMention?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items!: CreateInvoiceItemDto[];
}

class UpdateInvoiceDto extends CreateInvoiceDto {
  @IsOptional()
  @IsNumber()
  status?: number;
}

@ApiTags('Invoice Service (gRPC Proxy)')
@Controller('invoice-service')
export class InvoiceServiceController {
  private readonly logger = new Logger(InvoiceServiceController.name);

  constructor(
    private readonly invoiceClient: InvoiceGrpcClient,
    @Optional()
    @Inject(GetFactureSettingsUseCase)
    private readonly getFactureSettingsUseCase?: GetFactureSettingsUseCase,
  ) {}

  @Post('invoices')
  @ApiOperation({ summary: 'Créer une nouvelle facture (DRAFT)' })
  @ApiBody({ type: CreateInvoiceDto })
  @ApiResponse({ status: 201, description: 'Facture créée' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 503, description: 'Service factures indisponible' })
  async createInvoice(@Body() dto: CreateInvoiceDto): Promise<Invoice> {
    try {
      this.logger.log(`Creating invoice for customer: ${dto.customerName}`);

      // Nettoyer les chaînes vides (gRPC n'aime pas les "" pour les champs optionnels)
      const cleanString = (val: string | undefined): string | undefined =>
        val && val.trim() !== '' ? val : undefined;

      const request: CreateInvoiceRequest = {
        customerName: dto.customerName,
        customerAddress: dto.customerAddress,
        customerSiret: cleanString(dto.customerSiret),
        customerTvaNumber: cleanString(dto.customerTvaNumber),
        customerEmail: cleanString(dto.customerEmail),
        customerPhone: cleanString(dto.customerPhone),
        issueDate: dto.issueDate,
        deliveryDate: dto.deliveryDate,
        dueDate: cleanString(dto.dueDate),
        paymentTermsDays: dto.paymentTermsDays || 30,
        latePaymentInterestRate: dto.latePaymentInterestRate || 13.5,
        recoveryIndemnity: dto.recoveryIndemnity || 40,
        vatMention: cleanString(dto.vatMention),
        notes: cleanString(dto.notes),
        items: dto.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'pièce',
          unitPriceHT: item.unitPriceHT,
          vatRate: item.vatRate,
          discount: item.discount || 0,
        })),
      };
      return await this.invoiceClient.createInvoice(request);
    } catch (error: any) {
      this.logger.error(`Failed to create invoice: ${error.message}`);
      if (error.code === 14) {
        throw new InternalServerErrorException('Service factures indisponible');
      }
      throw new BadRequestException(error.message || 'Erreur lors de la création');
    }
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Lister toutes les factures' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste des factures' })
  async findAllInvoices(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<FindAllResponse> {
    try {
      return await this.invoiceClient.findAllInvoices({
        limit: limit || 100,
        offset: offset || 0,
      });
    } catch (error: any) {
      this.logger.error(`Failed to list invoices: ${error.message}`);
      if (error.code === 14) {
        throw new InternalServerErrorException('Service factures indisponible');
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Récupérer une facture par ID' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture trouvée' })
  @ApiResponse({ status: 404, description: 'Facture non trouvée' })
  async findOneInvoice(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    try {
      return await this.invoiceClient.findOneInvoice(id);
    } catch (error: any) {
      this.logger.error(`Failed to find invoice ${id}: ${error.message}`);
      if (error.code === 5) {
        throw new BadRequestException('Facture non trouvée');
      }
      throw new BadRequestException(error.message);
    }
  }

  @Put('invoices/:id')
  @ApiOperation({ summary: 'Mettre à jour une facture (DRAFT uniquement)' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiBody({ type: UpdateInvoiceDto })
  @ApiResponse({ status: 200, description: 'Facture mise à jour' })
  @ApiResponse({ status: 400, description: 'Modification interdite (non DRAFT)' })
  async updateInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    try {
      const request: UpdateInvoiceRequest = {
        id,
        ...dto,
        items: dto.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'pièce',
          unitPriceHT: item.unitPriceHT,
          vatRate: item.vatRate,
          discount: item.discount || 0,
        })),
      };
      return await this.invoiceClient.updateInvoice(request);
    } catch (error: any) {
      this.logger.error(`Failed to update invoice ${id}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Delete('invoices/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une facture (DRAFT uniquement)' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture supprimée' })
  @ApiResponse({ status: 400, description: 'Suppression interdite (non DRAFT)' })
  async deleteInvoice(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await this.invoiceClient.deleteInvoice(id);
    } catch (error: any) {
      this.logger.error(`Failed to delete invoice ${id}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Post('invoices/:id/validate')
  @ApiOperation({ summary: 'Valider une facture (génère le PDF, devient immutable)' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiHeader({
    name: 'x-societe-id',
    description: 'UUID de la société pour le branding personnalisé',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Facture validée avec PDF généré' })
  @ApiResponse({ status: 400, description: 'Validation impossible' })
  async validateInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-societe-id') societeId?: string,
  ): Promise<Invoice> {
    try {
      this.logger.log(`Validating invoice ${id} with societeId: ${societeId || 'none'}`);

      // Récupérer le branding de la société si societeId fourni
      let branding: any = undefined;
      if (societeId && this.getFactureSettingsUseCase) {
        try {
          const settings = await this.getFactureSettingsUseCase.findBySocieteId(societeId);
          if (settings) {
            branding = {
              logoBase64: settings.logoBase64,
              logoMimeType: settings.logoMimeType,
              primaryColor: settings.primaryColor,
              secondaryColor: settings.secondaryColor,
              companyName: settings.companyName,
              companyAddress: settings.companyAddress,
              companyPhone: settings.companyPhone,
              companyEmail: settings.companyEmail,
              companySiret: settings.companySiret,
              companyTvaNumber: settings.companyTvaNumber,
              companyRcs: settings.companyRcs,
              companyCapital: settings.companyCapital,
              iban: settings.iban,
              bic: settings.bic,
              bankName: settings.bankName,
              headerText: settings.headerText,
              footerText: settings.footerText,
              legalMentions: settings.legalMentions,
              paymentTerms: settings.paymentTerms,
              invoicePrefix: settings.invoicePrefix,
              showLogo: settings.showLogo,
              logoPosition: settings.logoPosition,
            };
            this.logger.log(`Loaded branding for société ${societeId}`);
          }
        } catch (settingsError: any) {
          this.logger.warn(`Could not load facture settings: ${settingsError.message}`);
        }
      }

      return await this.invoiceClient.validateInvoice(id, branding);
    } catch (error: any) {
      this.logger.error(`Failed to validate invoice ${id}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Post('invoices/:id/mark-paid')
  @ApiOperation({ summary: 'Marquer une facture comme payée' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiResponse({ status: 200, description: 'Facture marquée comme payée' })
  async markAsPaid(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    try {
      this.logger.log(`Marking invoice ${id} as paid`);
      return await this.invoiceClient.markInvoiceAsPaid(id);
    } catch (error: any) {
      this.logger.error(`Failed to mark invoice ${id} as paid: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Post('invoices/:id/credit-note')
  @ApiOperation({ summary: 'Créer un avoir pour une facture' })
  @ApiParam({ name: 'id', description: 'UUID de la facture originale' })
  @ApiResponse({ status: 201, description: 'Avoir créé' })
  async createCreditNote(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    try {
      this.logger.log(`Creating credit note for invoice ${id}`);
      return await this.invoiceClient.createCreditNote(id);
    } catch (error: any) {
      this.logger.error(`Failed to create credit note for ${id}: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Télécharger le PDF de la facture (Factur-X)' })
  @ApiParam({ name: 'id', description: 'UUID de la facture' })
  @ApiResponse({ status: 200, description: 'PDF téléchargé' })
  @ApiResponse({ status: 400, description: 'PDF non disponible (facture non validée)' })
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      this.logger.log(`Downloading PDF for invoice ${id}`);
      const result = await this.invoiceClient.downloadInvoicePdf(id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': result.pdfData.length,
      });

      res.send(result.pdfData);
    } catch (error: any) {
      this.logger.error(`Failed to download PDF for ${id}: ${error.message}`);
      throw new BadRequestException(error.message || 'PDF non disponible');
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Vérifier la connexion au service factures' })
  @ApiResponse({ status: 200, description: 'Service disponible' })
  async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      // Tenter une requête simple pour vérifier la connexion
      await this.invoiceClient.findAllInvoices({ limit: 1 });
      return { status: 'ok', service: 'invoice-service' };
    } catch {
      return { status: 'unavailable', service: 'invoice-service' };
    }
  }
}

import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { type Response } from 'express';
import { CfastApiClient } from '../../external/cfast/cfast-api-client';
import { CfastConfigService } from '../../persistence/typeorm/repositories/cfast/cfast-config.service';

@Controller('api/cfast')
export class CfastPdfController {
  private readonly logger = new Logger(CfastPdfController.name);

  constructor(
    private readonly cfastApiClient: CfastApiClient,
    private readonly cfastConfigService: CfastConfigService,
  ) {}

  @Get('invoices/:invoiceId/pdf')
  async downloadInvoicePdf(
    @Param('invoiceId') invoiceId: string,
    @Query('organisationId') organisationId: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!organisationId) {
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Missing required query parameter: organisationId',
      });
      return;
    }

    // Load CFAST config for the organisation
    const config = await this.cfastConfigService.findByOrganisationId(organisationId);
    if (!config || !config.active) {
      this.logger.warn(`No active CFAST config for organisation ${organisationId}`);
      res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No active CFAST configuration for this organisation',
      });
      return;
    }

    // Authenticate with CFAST
    let token: string;
    try {
      token = await this.cfastApiClient.authenticate(config);
    } catch (error) {
      this.logger.error(
        `CFAST authentication failed for organisation ${organisationId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'CFAST authentication failed',
      });
      return;
    }

    // Download PDF from CFAST
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await this.cfastApiClient.downloadInvoicePdf(token, invoiceId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('404')) {
        this.logger.warn(`Invoice ${invoiceId} not found in CFAST`);
        res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: `Invoice ${invoiceId} not found in CFAST`,
        });
        return;
      }

      this.logger.error(`Failed to download PDF for invoice ${invoiceId}: ${errorMessage}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to download invoice PDF from CFAST',
      });
      return;
    }

    // Stream PDF response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
    });

    res.end(pdfBuffer);
  }
}

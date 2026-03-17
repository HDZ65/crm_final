import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { YousignApiClient } from './yousign-api.client';
import { SepaMandateService } from './sepa-mandate.service';
import type { CreateSignatureRequestPayload } from './yousign.types';

@ApiTags('Yousign')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/yousign')
export class YousignController {
  constructor(
    private readonly yousignClient: YousignApiClient,
    private readonly sepaMandateService: SepaMandateService,
  ) {}

  @Post('signature-requests')
  @ApiOperation({ summary: 'Create a Yousign signature request' })
  createSignatureRequest(@Body() body: CreateSignatureRequestPayload) {
    return this.yousignClient.createSignatureRequest(body);
  }

  @Get('signature-requests/:id')
  @ApiOperation({ summary: 'Get a signature request by ID' })
  getSignatureRequest(@Param('id') id: string) {
    return this.yousignClient.getSignatureRequest(id);
  }

  @Post('signature-requests/:id/activate')
  @ApiOperation({ summary: 'Activate a signature request (send to signers)' })
  activateSignatureRequest(@Param('id') id: string) {
    return this.yousignClient.activateSignatureRequest(id);
  }

  @Delete('signature-requests/:id')
  @ApiOperation({ summary: 'Cancel a signature request' })
  cancelSignatureRequest(@Param('id') id: string) {
    return this.yousignClient.cancelSignatureRequest(id);
  }

  @Get('signature-requests/:id/documents/:docId/download')
  @ApiOperation({ summary: 'Download a signed document' })
  async downloadSignedDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.yousignClient.downloadSignedDocument(id, docId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="signed-${docId}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });
    res.send(buffer);
  }

  // --------------------------------------------------------------------------
  // SEPA Mandate Endpoints
  // --------------------------------------------------------------------------

  @Post('sepa-mandates')
  @ApiOperation({ summary: 'Initiate a SEPA mandate signature flow' })
  initiateSepaMandate(
    @Body()
    body: {
      contratId: string;
      clientName: string;
      iban: string;
      bic: string;
      organisationId: string;
    },
  ) {
    return this.sepaMandateService.initiateSepaMandate(body);
  }

  @Get('sepa-mandates/:contratId/status')
  @ApiOperation({ summary: 'Get SEPA mandate signature status' })
  getSepaMandateStatus(@Param('contratId') contratId: string) {
    return this.sepaMandateService.getSepaMandateStatus(contratId);
  }
}

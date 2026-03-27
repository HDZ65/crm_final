import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { DepanssurGrpcClient } from '../grpc/depanssur-grpc.client';

@ApiTags('Depanssur')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/depanssur')
export class DepanssurController {
  constructor(private readonly depanssurClient: DepanssurGrpcClient) {}

  @Post('abonnements')
  @ApiOperation({ summary: 'Create abonnement depanssur' })
  createAbonnement(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.createAbonnement(body));
  }

  @Get('abonnements/:id')
  @ApiOperation({ summary: 'Get abonnement depanssur' })
  getAbonnement(@Param('id') id: string) {
    return firstValueFrom(this.depanssurClient.getAbonnement({ id }));
  }

  @Get('abonnements/by-client/:organisationId/:clientId')
  @ApiOperation({ summary: 'Get abonnement by client' })
  getAbonnementByClient(
    @Param('organisationId') organisationId: string,
    @Param('clientId') clientId: string,
  ) {
    return firstValueFrom(
      this.depanssurClient.getAbonnementByClient({
        organisation_id: organisationId,
        client_id: clientId,
      }),
    );
  }

  @Put('abonnements/:id')
  @ApiOperation({ summary: 'Update abonnement depanssur' })
  updateAbonnement(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.updateAbonnement({ ...body, id }));
  }

  @Post('abonnements/list')
  @ApiOperation({ summary: 'List abonnements depanssur' })
  listAbonnements(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.listAbonnements(body));
  }

  @Post('dossiers')
  @ApiOperation({ summary: 'Create dossier declaratif' })
  createDossier(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.createDossier(body));
  }

  @Get('dossiers/:id')
  @ApiOperation({ summary: 'Get dossier declaratif' })
  getDossier(@Param('id') id: string) {
    return firstValueFrom(this.depanssurClient.getDossier({ id }));
  }

  @Get('dossiers/by-reference/:organisationId/:reference')
  @ApiOperation({ summary: 'Get dossier by reference' })
  getDossierByReference(
    @Param('organisationId') organisationId: string,
    @Param('reference') reference: string,
  ) {
    return firstValueFrom(
      this.depanssurClient.getDossierByReference({
        organisation_id: organisationId,
        reference_externe: reference,
      }),
    );
  }

  @Put('dossiers/:id')
  @ApiOperation({ summary: 'Update dossier declaratif' })
  updateDossier(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.updateDossier({ ...body, id }));
  }

  @Post('dossiers/list')
  @ApiOperation({ summary: 'List dossiers declaratifs' })
  listDossiers(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.listDossiers(body));
  }

  @Delete('dossiers/:id')
  @ApiOperation({ summary: 'Delete dossier declaratif' })
  deleteDossier(@Param('id') id: string) {
    return firstValueFrom(this.depanssurClient.deleteDossier({ id }));
  }

  @Post('options')
  @ApiOperation({ summary: 'Create option abonnement' })
  createOption(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.createOption(body));
  }

  @Get('options/:id')
  @ApiOperation({ summary: 'Get option abonnement' })
  getOption(@Param('id') id: string) {
    return firstValueFrom(this.depanssurClient.getOption({ id }));
  }

  @Put('options/:id')
  @ApiOperation({ summary: 'Update option abonnement' })
  updateOption(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.updateOption({ ...body, id }));
  }

  @Post('options/list')
  @ApiOperation({ summary: 'List options abonnement' })
  listOptions(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.listOptions(body));
  }

  @Delete('options/:id')
  @ApiOperation({ summary: 'Delete option abonnement' })
  deleteOption(@Param('id') id: string) {
    return firstValueFrom(this.depanssurClient.deleteOption({ id }));
  }

  @Get('compteurs/:abonnementId')
  @ApiOperation({ summary: 'Get compteur plafond' })
  getCompteur(@Param('abonnementId') abonnementId: string) {
    return firstValueFrom(this.depanssurClient.getCompteur({ abonnement_id: abonnementId }));
  }

  @Put('compteurs/:id')
  @ApiOperation({ summary: 'Update compteur plafond' })
  updateCompteur(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.updateCompteur({ ...body, id }));
  }

  @Post('compteurs/reset/:abonnementId')
  @ApiOperation({ summary: 'Reset compteur plafond' })
  resetCompteur(
    @Param('abonnementId') abonnementId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.depanssurClient.resetCompteur({
        ...body,
        abonnement_id: abonnementId,
      }),
    );
  }

  @Post('compteurs/list')
  @ApiOperation({ summary: 'List compteurs plafond' })
  listCompteurs(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.listCompteurs(body));
  }

  @Post('consentements')
  @ApiOperation({ summary: 'Create consentement RGPD' })
  createConsentement(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.createConsentement(body));
  }

  @Get('consentements/:id')
  @ApiOperation({ summary: 'Get consentement RGPD' })
  getConsentement(@Param('id') id: string) {
    return firstValueFrom(this.depanssurClient.getConsentement({ id }));
  }

  @Put('consentements/:id')
  @ApiOperation({ summary: 'Update consentement RGPD' })
  updateConsentement(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.updateConsentement({ ...body, id }));
  }

  @Post('consentements/list')
  @ApiOperation({ summary: 'List consentements RGPD' })
  listConsentements(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.listConsentements(body));
  }

  @Delete('consentements/:id')
  @ApiOperation({ summary: 'Delete consentement RGPD' })
  deleteConsentement(@Param('id') id: string) {
    return firstValueFrom(this.depanssurClient.deleteConsentement({ id }));
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle depanssur webhook' })
  handleWebhook(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.depanssurClient.handleWebhook(body));
  }
}

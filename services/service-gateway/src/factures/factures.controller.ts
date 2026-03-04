import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { FacturesGrpcClient } from '../grpc/factures-grpc.client';

@ApiTags('Factures')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/factures')
export class FacturesController {
  constructor(private readonly facturesClient: FacturesGrpcClient) {}

  // ==================== STATUT FACTURE ====================

  @Post('statuts')
  @ApiOperation({ summary: 'Create statut facture' })
  createStatutFacture(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.facturesClient.createStatutFacture(body));
  }

  @Get('statuts')
  @ApiOperation({ summary: 'List statuts facture' })
  listStatutsFacture(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.facturesClient.listStatutsFacture(query));
  }

  @Get('statuts/by-code/:code')
  @ApiOperation({ summary: 'Get statut facture by code' })
  getStatutFactureByCode(@Param('code') code: string) {
    return firstValueFrom(this.facturesClient.getStatutFactureByCode({ code }));
  }

  @Get('statuts/:id')
  @ApiOperation({ summary: 'Get statut facture by ID' })
  getStatutFacture(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.getStatutFacture({ id }));
  }

  @Put('statuts/:id')
  @ApiOperation({ summary: 'Update statut facture' })
  updateStatutFacture(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.facturesClient.updateStatutFacture({ ...body, id }),
    );
  }

  @Delete('statuts/:id')
  @ApiOperation({ summary: 'Delete statut facture' })
  deleteStatutFacture(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.deleteStatutFacture({ id }));
  }

  // ==================== EMISSION FACTURE ====================

  @Post('emissions')
  @ApiOperation({ summary: 'Create emission facture' })
  createEmissionFacture(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.facturesClient.createEmissionFacture(body));
  }

  @Get('emissions')
  @ApiOperation({ summary: 'List emissions facture' })
  listEmissionsFacture(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.facturesClient.listEmissionsFacture(query));
  }

  @Get('emissions/:id')
  @ApiOperation({ summary: 'Get emission facture by ID' })
  getEmissionFacture(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.getEmissionFacture({ id }));
  }

  @Put('emissions/:id')
  @ApiOperation({ summary: 'Update emission facture' })
  updateEmissionFacture(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.facturesClient.updateEmissionFacture({ ...body, id }),
    );
  }

  @Delete('emissions/:id')
  @ApiOperation({ summary: 'Delete emission facture' })
  deleteEmissionFacture(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.deleteEmissionFacture({ id }));
  }

  // ==================== LIGNE FACTURE ====================

  @Post('lignes')
  @ApiOperation({ summary: 'Create ligne facture' })
  createLigneFacture(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.facturesClient.createLigneFacture(body));
  }

  @Get('lignes/by-facture/:factureId')
  @ApiOperation({ summary: 'List lignes by facture' })
  listLignesFacture(@Param('factureId') factureId: string) {
    return firstValueFrom(
      this.facturesClient.listLignesFacture({ facture_id: factureId }),
    );
  }

  @Get('lignes/:id')
  @ApiOperation({ summary: 'Get ligne facture by ID' })
  getLigneFacture(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.getLigneFacture({ id }));
  }

  @Put('lignes/:id')
  @ApiOperation({ summary: 'Update ligne facture' })
  updateLigneFacture(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.facturesClient.updateLigneFacture({ ...body, id }),
    );
  }

  @Delete('lignes/:id')
  @ApiOperation({ summary: 'Delete ligne facture' })
  deleteLigneFacture(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.deleteLigneFacture({ id }));
  }

  // ==================== FACTURE (CRUD) ====================

  @Post()
  @ApiOperation({ summary: 'Create facture' })
  createFacture(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.facturesClient.createFacture(body));
  }

  @Get()
  @ApiOperation({ summary: 'List factures' })
  listFactures(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.facturesClient.listFactures(query));
  }

  @Get('by-numero/:organisationId/:numero')
  @ApiOperation({ summary: 'Get facture by numero' })
  getFactureByNumero(
    @Param('organisationId') organisationId: string,
    @Param('numero') numero: string,
  ) {
    return firstValueFrom(
      this.facturesClient.getFactureByNumero({
        organisation_id: organisationId,
        numero,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get facture by ID' })
  getFacture(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.getFacture({ id }));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update facture' })
  updateFacture(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(this.facturesClient.updateFacture({ ...body, id }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete facture' })
  deleteFacture(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.deleteFacture({ id }));
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate facture' })
  validateFacture(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.validateFacture({ id }));
  }

  @Post(':id/finalize')
  @ApiOperation({ summary: 'Finalize facture' })
  finalizeFacture(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.finalizeFacture({ id }));
  }

  @Post(':id/avoir')
  @ApiOperation({ summary: 'Create avoir (credit note) for facture' })
  createAvoir(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.facturesClient.createAvoir({ ...body, facture_origine_id: id }),
    );
  }

  @Get(':id/avoirs')
  @ApiOperation({ summary: 'List avoirs by facture' })
  listAvoirsByFacture(@Param('id') id: string) {
    return firstValueFrom(
      this.facturesClient.listAvoirsByFacture({ facture_origine_id: id }),
    );
  }

  // ==================== FACTURE SETTINGS ====================

  @Post('settings')
  @ApiOperation({ summary: 'Create facture settings' })
  createFactureSettings(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.facturesClient.createFactureSettings(body));
  }

  @Get('settings/by-societe/:societeId')
  @ApiOperation({ summary: 'Get facture settings by societe' })
  getFactureSettingsBySociete(@Param('societeId') societeId: string) {
    return firstValueFrom(
      this.facturesClient.getFactureSettingsBySociete({
        societe_id: societeId,
      }),
    );
  }

  @Get('settings/:id')
  @ApiOperation({ summary: 'Get facture settings by ID' })
  getFactureSettings(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.getFactureSettings({ id }));
  }

  @Put('settings/:id')
  @ApiOperation({ summary: 'Update facture settings' })
  updateFactureSettings(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.facturesClient.updateFactureSettings({ ...body, id }),
    );
  }

  @Delete('settings/:id')
  @ApiOperation({ summary: 'Delete facture settings' })
  deleteFactureSettings(@Param('id') id: string) {
    return firstValueFrom(this.facturesClient.deleteFactureSettings({ id }));
  }

  @Post('settings/:id/logo')
  @ApiOperation({ summary: 'Upload logo for facture settings' })
  uploadLogo(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.facturesClient.uploadLogo({ ...body, settings_id: id }),
    );
  }

  // ==================== FACTURE GENERATION ====================

  @Post('generation/next-numero')
  @ApiOperation({ summary: 'Generate next facture numero' })
  generateNextNumero(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.facturesClient.generateNextNumero(body));
  }

  @Post('generation/calculate-totals')
  @ApiOperation({ summary: 'Calculate facture totals' })
  calculateTotals(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.facturesClient.calculateTotals(body));
  }
}

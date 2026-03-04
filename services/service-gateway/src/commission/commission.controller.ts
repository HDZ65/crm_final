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
import { CommissionGrpcClient } from '../grpc/commission-grpc.client';

@ApiTags('Commission')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/commission')
export class CommissionController {
  constructor(private readonly commissionClient: CommissionGrpcClient) {}

  @Post()
  @ApiOperation({ summary: 'Create commission' })
  createCommission(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.createCommission(body));
  }

  @Post('search')
  @ApiOperation({ summary: 'Search commissions' })
  getCommissions(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getCommissions(body));
  }

  @Post('by-apporteur')
  @ApiOperation({ summary: 'Get commissions by apporteur' })
  getCommissionsByApporteur(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getCommissionsByApporteur(body));
  }

  @Post('by-periode')
  @ApiOperation({ summary: 'Get commissions by periode' })
  getCommissionsByPeriode(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getCommissionsByPeriode(body));
  }

  @Post('calculer')
  @ApiOperation({ summary: 'Calculer commission' })
  calculerCommission(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.calculerCommission(body));
  }

  @Post('generer-bordereau')
  @ApiOperation({ summary: 'Generer bordereau' })
  genererBordereau(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.genererBordereau(body));
  }

  @Post('declencher-reprise')
  @ApiOperation({ summary: 'Declencher reprise' })
  declencherReprise(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.declencherReprise(body));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get commission by ID' })
  getCommission(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.getCommission({ id }));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update commission' })
  updateCommission(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.updateCommission({ ...body, id }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete commission' })
  deleteCommission(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.deleteCommission({ id }));
  }

  @Post('baremes')
  @ApiOperation({ summary: 'Create bareme' })
  createBareme(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.createBareme(body));
  }

  @Post('baremes/search')
  @ApiOperation({ summary: 'Search baremes' })
  getBaremes(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getBaremes(body));
  }

  @Post('baremes/applicable')
  @ApiOperation({ summary: 'Get applicable bareme' })
  getBaremeApplicable(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getBaremeApplicable(body));
  }

  @Get('baremes/:id')
  @ApiOperation({ summary: 'Get bareme by ID' })
  getBareme(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.getBareme({ id }));
  }

  @Put('baremes/:id')
  @ApiOperation({ summary: 'Update bareme' })
  updateBareme(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.updateBareme({ ...body, id }));
  }

  @Delete('baremes/:id')
  @ApiOperation({ summary: 'Delete bareme' })
  deleteBareme(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.deleteBareme({ id }));
  }

  @Post('paliers')
  @ApiOperation({ summary: 'Create palier' })
  createPalier(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.createPalier(body));
  }

  @Post('paliers/by-bareme')
  @ApiOperation({ summary: 'Get paliers by bareme' })
  getPaliersByBareme(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getPaliersByBareme(body));
  }

  @Get('paliers/:id')
  @ApiOperation({ summary: 'Get palier by ID' })
  getPalier(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.getPalier({ id }));
  }

  @Put('paliers/:id')
  @ApiOperation({ summary: 'Update palier' })
  updatePalier(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.updatePalier({ ...body, id }));
  }

  @Delete('paliers/:id')
  @ApiOperation({ summary: 'Delete palier' })
  deletePalier(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.deletePalier({ id }));
  }

  @Post('bordereaux')
  @ApiOperation({ summary: 'Create bordereau' })
  createBordereau(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.createBordereau(body));
  }

  @Post('bordereaux/search')
  @ApiOperation({ summary: 'Search bordereaux' })
  getBordereaux(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getBordereaux(body));
  }

  @Post('bordereaux/by-apporteur-periode')
  @ApiOperation({ summary: 'Get bordereau by apporteur and periode' })
  getBordereauByApporteurPeriode(@Body() body: Record<string, unknown>) {
    return firstValueFrom(
      this.commissionClient.getBordereauByApporteurPeriode(body),
    );
  }

  @Post('bordereaux/export-files')
  @ApiOperation({ summary: 'Export bordereau files' })
  exportBordereauFiles(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.exportBordereauFiles(body));
  }

  @Get('bordereaux/:id/export')
  @ApiOperation({ summary: 'Export bordereau' })
  exportBordereau(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.exportBordereau({ id }));
  }

  @Get('bordereaux/:id')
  @ApiOperation({ summary: 'Get bordereau by ID' })
  getBordereau(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.getBordereau({ id }));
  }

  @Put('bordereaux/:id')
  @ApiOperation({ summary: 'Update bordereau' })
  updateBordereau(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.updateBordereau({ ...body, id }));
  }

  @Post('bordereaux/:id/validate')
  @ApiOperation({ summary: 'Validate bordereau' })
  validateBordereau(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.validateBordereau({ ...body, id }));
  }

  @Delete('bordereaux/:id')
  @ApiOperation({ summary: 'Delete bordereau' })
  deleteBordereau(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.deleteBordereau({ id }));
  }

  @Post('lignes-bordereau')
  @ApiOperation({ summary: 'Create ligne bordereau' })
  createLigneBordereau(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.createLigneBordereau(body));
  }

  @Post('lignes-bordereau/by-bordereau')
  @ApiOperation({ summary: 'Get lignes by bordereau' })
  getLignesByBordereau(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getLignesByBordereau(body));
  }

  @Get('lignes-bordereau/:id')
  @ApiOperation({ summary: 'Get ligne bordereau by ID' })
  getLigneBordereau(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.getLigneBordereau({ id }));
  }

  @Put('lignes-bordereau/:id')
  @ApiOperation({ summary: 'Update ligne bordereau' })
  updateLigneBordereau(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.commissionClient.updateLigneBordereau({
        ...body,
        id,
      }),
    );
  }

  @Post('lignes-bordereau/:id/validate')
  @ApiOperation({ summary: 'Validate ligne bordereau' })
  validateLigne(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.validateLigne({ ...body, id }));
  }

  @Delete('lignes-bordereau/:id')
  @ApiOperation({ summary: 'Delete ligne bordereau' })
  deleteLigneBordereau(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.deleteLigneBordereau({ id }));
  }

  @Post('reprises')
  @ApiOperation({ summary: 'Create reprise' })
  createReprise(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.createReprise(body));
  }

  @Post('reprises/search')
  @ApiOperation({ summary: 'Search reprises' })
  getReprises(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getReprises(body));
  }

  @Post('reprises/by-commission')
  @ApiOperation({ summary: 'Get reprises by commission' })
  getReprisesByCommission(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getReprisesByCommission(body));
  }

  @Get('reprises/:id')
  @ApiOperation({ summary: 'Get reprise by ID' })
  getReprise(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.getReprise({ id }));
  }

  @Post('reprises/:id/apply')
  @ApiOperation({ summary: 'Apply reprise' })
  applyReprise(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.applyReprise({ ...body, id }));
  }

  @Post('reprises/:id/cancel')
  @ApiOperation({ summary: 'Cancel reprise' })
  cancelReprise(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.cancelReprise({ id }));
  }

  @Delete('reprises/:id')
  @ApiOperation({ summary: 'Delete reprise' })
  deleteReprise(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.deleteReprise({ id }));
  }

  @Post('contestations')
  @ApiOperation({ summary: 'Create contestation' })
  creerContestation(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.creerContestation(body));
  }

  @Post('contestations/search')
  @ApiOperation({ summary: 'Search contestations' })
  getContestations(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getContestations(body));
  }

  @Post('contestations/:id/resolve')
  @ApiOperation({ summary: 'Resolve contestation' })
  resoudreContestation(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.commissionClient.resoudreContestation({
        ...body,
        id,
      }),
    );
  }

  @Post('statuts')
  @ApiOperation({ summary: 'Create statut commission' })
  createStatut(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.createStatut(body));
  }

  @Get('statuts/by-code/:code')
  @ApiOperation({ summary: 'Get statut by code' })
  getStatutByCode(@Param('code') code: string) {
    return firstValueFrom(this.commissionClient.getStatutByCode({ code }));
  }

  @Post('statuts/search')
  @ApiOperation({ summary: 'Search statuts commission' })
  getStatuts(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getStatuts(body));
  }

  @Get('statuts/:id')
  @ApiOperation({ summary: 'Get statut by ID' })
  getStatut(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.getStatut({ id }));
  }

  @Put('statuts/:id')
  @ApiOperation({ summary: 'Update statut commission' })
  updateStatut(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.updateStatut({ ...body, id }));
  }

  @Delete('statuts/:id')
  @ApiOperation({ summary: 'Delete statut commission' })
  deleteStatut(@Param('id') id: string) {
    return firstValueFrom(this.commissionClient.deleteStatut({ id }));
  }

  @Post('audit-logs/search')
  @ApiOperation({ summary: 'Search audit logs' })
  getAuditLogs(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getAuditLogs(body));
  }

  @Post('audit-logs/by-ref')
  @ApiOperation({ summary: 'Get audit logs by reference' })
  getAuditLogsByRef(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getAuditLogsByRef(body));
  }

  @Post('audit-logs/by-commission')
  @ApiOperation({ summary: 'Get audit logs by commission' })
  getAuditLogsByCommission(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getAuditLogsByCommission(body));
  }

  @Post('recurrences/search')
  @ApiOperation({ summary: 'Search recurrences' })
  getRecurrences(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getRecurrences(body));
  }

  @Post('recurrences/by-contrat')
  @ApiOperation({ summary: 'Get recurrences by contrat' })
  getRecurrencesByContrat(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getRecurrencesByContrat(body));
  }

  @Post('reports-negatifs/search')
  @ApiOperation({ summary: 'Search reports negatifs' })
  getReportsNegatifs(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getReportsNegatifs(body));
  }

  @Post('validation/preselectionner-lignes')
  @ApiOperation({ summary: 'Preselectionner lignes for validation' })
  preselectionnerLignes(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.preselectionnerLignes(body));
  }

  @Post('validation/recalculer-totaux-bordereau')
  @ApiOperation({ summary: 'Recalculer totaux bordereau' })
  recalculerTotauxBordereau(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.recalculerTotauxBordereau(body));
  }

  @Post('validation/valider-bordereau-final')
  @ApiOperation({ summary: 'Valider bordereau final' })
  validerBordereauFinal(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.validerBordereauFinal(body));
  }

  @Post('validation/lignes-for-validation')
  @ApiOperation({ summary: 'Get lignes for validation' })
  getLignesForValidation(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getLignesForValidation(body));
  }

  @Post('kpi/dashboard')
  @ApiOperation({ summary: 'Get dashboard KPI' })
  getDashboardKpi(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getDashboardKpi(body));
  }

  @Post('kpi/snapshot')
  @ApiOperation({ summary: 'Generer snapshot KPI' })
  genererSnapshotKpi(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.genererSnapshotKpi(body));
  }

  @Post('kpi/comparatifs')
  @ApiOperation({ summary: 'Get KPI comparatifs' })
  getComparatifs(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.getComparatifs(body));
  }

  @Post('kpi/export-analytique')
  @ApiOperation({ summary: 'Export KPI analytique' })
  exportAnalytique(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commissionClient.exportAnalytique(body));
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { ActivitesGrpcClient } from '../grpc/activites-grpc.client';

@ApiTags('Activites')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/activites')
export class ActivitesController {
  constructor(private readonly activitesClient: ActivitesGrpcClient) {}

  // ========== TypeActiviteService ==========

  @Post('types-activite')
  @ApiOperation({ summary: 'Create type activite' })
  createTypeActivite(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.createTypeActivite(body));
  }

  @Get('types-activite/by-code/:code')
  @ApiOperation({ summary: 'Get type activite by code' })
  getTypeActiviteByCode(@Param('code') code: string) {
    return firstValueFrom(this.activitesClient.getTypeActiviteByCode({ code }));
  }

  @Get('types-activite')
  @ApiOperation({ summary: 'List types activite' })
  listTypesActivite(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listTypesActivite(query));
  }

  @Get('types-activite/:id')
  @ApiOperation({ summary: 'Get type activite by id' })
  getTypeActivite(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.getTypeActivite({ id }));
  }

  @Put('types-activite/:id')
  @ApiOperation({ summary: 'Update type activite' })
  updateTypeActivite(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.updateTypeActivite({ id, ...body }));
  }

  @Delete('types-activite/:id')
  @ApiOperation({ summary: 'Delete type activite' })
  deleteTypeActivite(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.deleteTypeActivite({ id }));
  }

  // ========== ActiviteService ==========

  @Post('activites')
  @ApiOperation({ summary: 'Create activite' })
  createActivite(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.createActivite(body));
  }

  @Get('activites/by-client/:clientBaseId')
  @ApiOperation({ summary: 'List activites by client' })
  listActivitesByClient(@Param('clientBaseId') client_base_id: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listActivitesByClient({ client_base_id, ...query }));
  }

  @Get('activites/by-contrat/:contratId')
  @ApiOperation({ summary: 'List activites by contrat' })
  listActivitesByContrat(@Param('contratId') contrat_id: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listActivitesByContrat({ contrat_id, ...query }));
  }

  @Get('activites')
  @ApiOperation({ summary: 'List activites' })
  listActivites(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listActivites(query));
  }

  @Get('activites/:id')
  @ApiOperation({ summary: 'Get activite by id' })
  getActivite(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.getActivite({ id }));
  }

  @Put('activites/:id')
  @ApiOperation({ summary: 'Update activite' })
  updateActivite(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.updateActivite({ id, ...body }));
  }

  @Delete('activites/:id')
  @ApiOperation({ summary: 'Delete activite' })
  deleteActivite(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.deleteActivite({ id }));
  }

  // ========== TacheService ==========

  @Post('taches')
  @ApiOperation({ summary: 'Create tache' })
  createTache(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.createTache(body));
  }

  @Get('taches/stats')
  @ApiOperation({ summary: 'Get tache statistics' })
  getTacheStats(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.getTacheStats(query));
  }

  @Get('taches/alertes')
  @ApiOperation({ summary: 'Get tache alertes' })
  getTacheAlertes(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.getTacheAlertes(query));
  }

  @Get('taches/en-retard')
  @ApiOperation({ summary: 'List taches en retard' })
  listTachesEnRetard(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listTachesEnRetard(query));
  }

  @Get('taches/by-assigne/:assigneA')
  @ApiOperation({ summary: 'List taches by assigne' })
  listTachesByAssigne(@Param('assigneA') assigne_a: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listTachesByAssigne({ assigne_a, ...query }));
  }

  @Get('taches/by-client/:clientId')
  @ApiOperation({ summary: 'List taches by client' })
  listTachesByClient(@Param('clientId') client_id: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listTachesByClient({ client_id, ...query }));
  }

  @Get('taches/by-contrat/:contratId')
  @ApiOperation({ summary: 'List taches by contrat' })
  listTachesByContrat(@Param('contratId') contrat_id: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listTachesByContrat({ contrat_id, ...query }));
  }

  @Get('taches/by-facture/:factureId')
  @ApiOperation({ summary: 'List taches by facture' })
  listTachesByFacture(@Param('factureId') facture_id: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listTachesByFacture({ facture_id, ...query }));
  }

  @Get('taches')
  @ApiOperation({ summary: 'List taches' })
  listTaches(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listTaches(query));
  }

  @Get('taches/:id')
  @ApiOperation({ summary: 'Get tache by id' })
  getTache(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.getTache({ id }));
  }

  @Put('taches/:id')
  @ApiOperation({ summary: 'Update tache' })
  updateTache(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.updateTache({ id, ...body }));
  }

  @Put('taches/:id/en-cours')
  @ApiOperation({ summary: 'Marquer tache en cours' })
  marquerTacheEnCours(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.marquerTacheEnCours({ id }));
  }

  @Put('taches/:id/terminee')
  @ApiOperation({ summary: 'Marquer tache terminee' })
  marquerTacheTerminee(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.marquerTacheTerminee({ id }));
  }

  @Put('taches/:id/annulee')
  @ApiOperation({ summary: 'Marquer tache annulee' })
  marquerTacheAnnulee(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.marquerTacheAnnulee({ id }));
  }

  @Delete('taches/:id')
  @ApiOperation({ summary: 'Delete tache' })
  deleteTache(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.deleteTache({ id }));
  }

  // ========== EvenementSuiviService ==========

  @Post('evenements-suivi')
  @ApiOperation({ summary: 'Create evenement suivi' })
  createEvenementSuivi(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.createEvenementSuivi(body));
  }

  @Get('evenements-suivi/by-expedition/:expeditionId')
  @ApiOperation({ summary: 'List evenements suivi by expedition' })
  listEvenementsByExpedition(@Param('expeditionId') expedition_id: string, @Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listEvenementsByExpedition({ expedition_id, ...query }));
  }

  @Get('evenements-suivi')
  @ApiOperation({ summary: 'List evenements suivi' })
  listEvenementsSuivi(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.listEvenementsSuivi(query));
  }

  @Get('evenements-suivi/:id')
  @ApiOperation({ summary: 'Get evenement suivi by id' })
  getEvenementSuivi(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.getEvenementSuivi({ id }));
  }

  @Put('evenements-suivi/:id')
  @ApiOperation({ summary: 'Update evenement suivi' })
  updateEvenementSuivi(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.activitesClient.updateEvenementSuivi({ id, ...body }));
  }

  @Delete('evenements-suivi/:id')
  @ApiOperation({ summary: 'Delete evenement suivi' })
  deleteEvenementSuivi(@Param('id') id: string) {
    return firstValueFrom(this.activitesClient.deleteEvenementSuivi({ id }));
  }
}

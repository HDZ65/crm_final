import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { ContratGrpcClient } from '../grpc/contrat-grpc.client';
import { ContratExtendedGrpcClient } from '../grpc/contrat-extended-grpc.client';

@ApiTags('Contrats')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/contrats')
export class ContratsController {
  constructor(
    private readonly contratGrpcClient: ContratGrpcClient,
    private readonly contratExtendedGrpcClient: ContratExtendedGrpcClient,
  ) {}

  // ========== StatutContratService ==========

  @Post('statuts')
  @ApiOperation({ summary: 'Create contrat status' })
  createStatutContrat(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.contratExtendedGrpcClient.createStatutContrat(body));
  }

  @Get('statuts')
  @ApiOperation({ summary: 'List contrat statuses' })
  listStatutsContrat(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.contratExtendedGrpcClient.listStatutsContrat(query));
  }

  @Get('statuts/code/:code')
  @ApiOperation({ summary: 'Get contrat status by code' })
  getStatutContratByCode(@Param('code') code: string) {
    return firstValueFrom(this.contratExtendedGrpcClient.getStatutContratByCode({ code }));
  }

  @Get('statuts/:id')
  @ApiOperation({ summary: 'Get contrat status by ID' })
  getStatutContrat(@Param('id') id: string) {
    return firstValueFrom(this.contratExtendedGrpcClient.getStatutContrat({ id }));
  }

  @Put('statuts/:id')
  @ApiOperation({ summary: 'Update contrat status' })
  updateStatutContrat(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(
      this.contratExtendedGrpcClient.updateStatutContrat({ ...body, id }),
    );
  }

  @Delete('statuts/:id')
  @ApiOperation({ summary: 'Delete contrat status' })
  deleteStatutContrat(@Param('id') id: string) {
    return firstValueFrom(this.contratExtendedGrpcClient.deleteStatutContrat({ id }));
  }

  // ========== LigneContratService ==========

  @Post('lignes')
  @ApiOperation({ summary: 'Create contrat line' })
  createLigneContrat(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.contratExtendedGrpcClient.createLigneContrat(body));
  }

  @Get('lignes/contrat/:contratId')
  @ApiOperation({ summary: 'List lines by contrat' })
  listLignesByContrat(
    @Param('contratId') contrat_id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.contratExtendedGrpcClient.listLignesByContrat({ contrat_id, ...query }),
    );
  }

  @Get('lignes/:id')
  @ApiOperation({ summary: 'Get contrat line by ID' })
  getLigneContrat(@Param('id') id: string) {
    return firstValueFrom(this.contratExtendedGrpcClient.getLigneContrat({ id }));
  }

  @Put('lignes/:id')
  @ApiOperation({ summary: 'Update contrat line' })
  updateLigneContrat(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(
      this.contratExtendedGrpcClient.updateLigneContrat({ ...body, id }),
    );
  }

  @Delete('lignes/:id')
  @ApiOperation({ summary: 'Delete contrat line' })
  deleteLigneContrat(@Param('id') id: string) {
    return firstValueFrom(this.contratExtendedGrpcClient.deleteLigneContrat({ id }));
  }

  // ========== HistoriqueStatutContratService ==========

  @Post('historique')
  @ApiOperation({ summary: 'Create status history entry' })
  createHistoriqueStatutContrat(@Body() body: Record<string, unknown>) {
    return firstValueFrom(
      this.contratExtendedGrpcClient.createHistoriqueStatutContrat(body),
    );
  }

  @Get('historique/contrat/:contratId')
  @ApiOperation({ summary: 'List status history by contrat' })
  listHistoriqueByContrat(
    @Param('contratId') contrat_id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.contratExtendedGrpcClient.listHistoriqueByContrat({ contrat_id, ...query }),
    );
  }

  @Get('historique/:id')
  @ApiOperation({ summary: 'Get status history entry by ID' })
  getHistoriqueStatutContrat(@Param('id') id: string) {
    return firstValueFrom(
      this.contratExtendedGrpcClient.getHistoriqueStatutContrat({ id }),
    );
  }

  @Delete('historique/:id')
  @ApiOperation({ summary: 'Delete status history entry' })
  deleteHistoriqueStatutContrat(@Param('id') id: string) {
    return firstValueFrom(
      this.contratExtendedGrpcClient.deleteHistoriqueStatutContrat({ id }),
    );
  }

  // ========== ContractOrchestrationService ==========

  @Post('orchestration/activate')
  @ApiOperation({ summary: 'Activate contract' })
  activateContract(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.contratExtendedGrpcClient.activateContract(body));
  }

  @Post('orchestration/suspend')
  @ApiOperation({ summary: 'Suspend contract' })
  suspendContract(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.contratExtendedGrpcClient.suspendContract(body));
  }

  @Post('orchestration/terminate')
  @ApiOperation({ summary: 'Terminate contract' })
  terminateContract(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.contratExtendedGrpcClient.terminateContract(body));
  }

  @Post('orchestration/port-in')
  @ApiOperation({ summary: 'Port-in contract' })
  portInContract(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.contratExtendedGrpcClient.portInContract(body));
  }

  @Get('orchestration/history/:contractId')
  @ApiOperation({ summary: 'Get orchestration history' })
  getOrchestrationHistory(
    @Param('contractId') contract_id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.contratExtendedGrpcClient.getOrchestrationHistory({ contract_id, ...query }),
    );
  }

  // ========== ContratImportService ==========

  @Post('import/external')
  @ApiOperation({ summary: 'Import contracts from external source' })
  importFromExternal(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.contratExtendedGrpcClient.importFromExternal(body));
  }

  @Get('import/status/:importId')
  @ApiOperation({ summary: 'Get import status' })
  getImportStatus(@Param('importId') import_id: string) {
    return firstValueFrom(
      this.contratExtendedGrpcClient.getImportStatus({ import_id }),
    );
  }

  // ========== ContratService (CRUD) — declared LAST so :id doesn't catch sub-paths ==========

  @Post()
  @ApiOperation({ summary: 'Create contrat' })
  createContrat(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.contratGrpcClient.createContrat(body));
  }

  @Get()
  @ApiOperation({ summary: 'List contrats' })
  listContrats(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.contratGrpcClient.listContrats(query));
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get contrat with details (lignes + historique)' })
  getContratWithDetails(@Param('id') id: string) {
    return firstValueFrom(this.contratGrpcClient.getContratWithDetails({ id }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contrat by ID' })
  getContrat(@Param('id') id: string) {
    return firstValueFrom(this.contratGrpcClient.getContrat({ id }));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contrat' })
  updateContrat(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.contratGrpcClient.updateContrat({ ...body, id }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contrat' })
  deleteContrat(@Param('id') id: string) {
    return firstValueFrom(this.contratGrpcClient.deleteContrat({ id }));
  }
}

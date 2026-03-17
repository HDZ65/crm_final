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
import { QualiteGrpcClient } from '../grpc/qualite-grpc.client';

@ApiTags('Qualite')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/qualite')
export class QualiteController {
  constructor(private readonly qualiteClient: QualiteGrpcClient) {}

  // ==================== CONTROLES ====================

  @Post('controles')
  @ApiOperation({ summary: 'Create controle qualite' })
  creerControle(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.qualiteClient.creerControle(body));
  }

  @Get('controles')
  @ApiOperation({ summary: 'List controles qualite' })
  getControles(
    @Query('organisation_id') organisationId?: string,
    @Query('statut') statut?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return firstValueFrom(
      this.qualiteClient.getControles({
        organisation_id: organisationId,
        statut,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      }),
    );
  }

  @Get('controles/by-contrat/:contratId')
  @ApiOperation({ summary: 'Get controle qualite by contrat' })
  getControleByContrat(
    @Param('contratId') contratId: string,
    @Query('organisation_id') organisationId?: string,
  ) {
    return firstValueFrom(
      this.qualiteClient.getControleByContrat({
        contrat_id: contratId,
        organisation_id: organisationId,
      }),
    );
  }

  @Get('controles/:id')
  @ApiOperation({ summary: 'Get controle qualite by ID' })
  getControle(@Param('id') id: string) {
    return firstValueFrom(this.qualiteClient.getControle({ id }));
  }

  // ==================== WORKFLOW ====================

  @Post('controles/:id/valider')
  @ApiOperation({ summary: 'Valider controle qualite' })
  validerControle(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.qualiteClient.validerControle({ ...body, id }),
    );
  }

  @Post('controles/:id/rejeter')
  @ApiOperation({ summary: 'Rejeter controle qualite' })
  rejeterControle(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.qualiteClient.rejeterControle({ ...body, id }),
    );
  }

  @Post('controles/:id/retourner')
  @ApiOperation({ summary: 'Retourner controle qualite' })
  retournerControle(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.qualiteClient.retournerControle({ ...body, id }),
    );
  }

  @Post('controles/:id/criteres/:critereId/valider')
  @ApiOperation({ summary: 'Valider critere for controle' })
  validerCritere(
    @Param('id') id: string,
    @Param('critereId') critereId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.qualiteClient.validerCritere({
        ...body,
        controle_id: id,
        critere_id: critereId,
      }),
    );
  }

  // ==================== CRITERES ====================

  @Get('criteres')
  @ApiOperation({ summary: 'List criteres qualite' })
  getCriteres(
    @Query('organisation_id') organisationId?: string,
    @Query('actif_only') actifOnly?: string,
  ) {
    return firstValueFrom(
      this.qualiteClient.getCriteres({
        organisation_id: organisationId,
        actif_only: actifOnly === 'true',
      }),
    );
  }

  @Post('criteres')
  @ApiOperation({ summary: 'Create critere qualite' })
  createCritere(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.qualiteClient.createCritere(body));
  }

  @Put('criteres/:id')
  @ApiOperation({ summary: 'Update critere qualite' })
  updateCritere(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.qualiteClient.updateCritere({ ...body, id }),
    );
  }

  @Delete('criteres/:id')
  @ApiOperation({ summary: 'Delete critere qualite' })
  deleteCritere(@Param('id') id: string) {
    return firstValueFrom(this.qualiteClient.deleteCritere({ id }));
  }

  // ==================== REGLES ====================

  @Get('regles')
  @ApiOperation({ summary: 'List regles qualite' })
  getRegles(
    @Query('organisation_id') organisationId?: string,
    @Query('type_produit') typeProduit?: string,
  ) {
    return firstValueFrom(
      this.qualiteClient.getRegles({
        organisation_id: organisationId,
        type_produit: typeProduit,
      }),
    );
  }

  @Post('regles')
  @ApiOperation({ summary: 'Create regle qualite' })
  createRegle(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.qualiteClient.createRegle(body));
  }

  @Put('regles/:id')
  @ApiOperation({ summary: 'Update regle qualite' })
  updateRegle(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.qualiteClient.updateRegle({ ...body, id }),
    );
  }

  // ==================== STATISTIQUES ====================

  @Get('statistiques')
  @ApiOperation({ summary: 'Get statistiques qualite' })
  getStatistiques(
    @Query('organisation_id') organisationId?: string,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ) {
    return firstValueFrom(
      this.qualiteClient.getStatistiques({
        organisation_id: organisationId,
        period_from: periodFrom,
        period_to: periodTo,
      }),
    );
  }
}

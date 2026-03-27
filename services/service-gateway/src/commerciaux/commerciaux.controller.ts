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
import { CommerciauxGrpcClient } from '../grpc/commerciaux-grpc.client';

@ApiTags('Commerciaux')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/commerciaux')
export class CommerciauxController {
  constructor(private readonly commerciauxGrpcClient: CommerciauxGrpcClient) {}

  @Post('apporteurs')
  @ApiOperation({ summary: 'Create apporteur' })
  createApporteur(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.createApporteur(body));
  }

  @Put('apporteurs/:id')
  @ApiOperation({ summary: 'Update apporteur' })
  updateApporteur(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.updateApporteur({ ...body, id }));
  }

  @Get('apporteurs/by-utilisateur/:utilisateurId')
  @ApiOperation({ summary: 'Get apporteur by utilisateur ID' })
  getApporteurByUtilisateur(@Param('utilisateurId') utilisateurId: string) {
    return firstValueFrom(
      this.commerciauxGrpcClient.getApporteurByUtilisateur({ utilisateur_id: utilisateurId }),
    );
  }

  @Get('apporteurs/by-organisation/:organisationId')
  @ApiOperation({ summary: 'List apporteurs by organisation' })
  listApporteursByOrganisation(
    @Param('organisationId') organisationId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.commerciauxGrpcClient.listApporteursByOrganisation({
        ...query,
        organisation_id: organisationId,
      }),
    );
  }

  @Get('apporteurs')
  @ApiOperation({ summary: 'List apporteurs' })
  listApporteurs(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.listApporteurs(query));
  }

  @Get('apporteurs/:id')
  @ApiOperation({ summary: 'Get apporteur by ID' })
  getApporteur(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.getApporteur({ id }));
  }

  @Post('apporteurs/:id/activer')
  @ApiOperation({ summary: 'Activate apporteur' })
  activerApporteur(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.activerApporteur({ id }));
  }

  @Post('apporteurs/:id/desactiver')
  @ApiOperation({ summary: 'Deactivate apporteur' })
  desactiverApporteur(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.desactiverApporteur({ id }));
  }

  @Delete('apporteurs/:id')
  @ApiOperation({ summary: 'Delete apporteur' })
  deleteApporteur(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.deleteApporteur({ id }));
  }

  @Post('baremes-commission')
  @ApiOperation({ summary: 'Create bareme commission' })
  createBaremeCommission(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.createBaremeCommission(body));
  }

  @Put('baremes-commission/:id')
  @ApiOperation({ summary: 'Update bareme commission' })
  updateBaremeCommission(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.updateBaremeCommission({ ...body, id }));
  }

  @Get('baremes-commission/code/:code')
  @ApiOperation({ summary: 'Get bareme commission by code' })
  getBaremeCommissionByCode(@Param('code') code: string) {
    return firstValueFrom(this.commerciauxGrpcClient.getBaremeCommissionByCode({ code }));
  }

  @Get('baremes-commission/by-organisation/:organisationId')
  @ApiOperation({ summary: 'List baremes commission by organisation' })
  listBaremeCommissionsByOrganisation(
    @Param('organisationId') organisationId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.commerciauxGrpcClient.listBaremeCommissionsByOrganisation({
        ...query,
        organisation_id: organisationId,
      }),
    );
  }

  @Get('baremes-commission/actifs/:organisationId')
  @ApiOperation({ summary: 'List active baremes commission' })
  listBaremeCommissionsActifs(
    @Param('organisationId') organisationId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.commerciauxGrpcClient.listBaremeCommissionsActifs({
        ...query,
        organisation_id: organisationId,
      }),
    );
  }

  @Get('baremes-commission')
  @ApiOperation({ summary: 'List baremes commission' })
  listBaremeCommissions(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.listBaremeCommissions(query));
  }

  @Get('baremes-commission/:id/with-paliers')
  @ApiOperation({ summary: 'Get bareme commission with paliers' })
  getBaremeCommissionWithPaliers(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.getBaremeCommissionWithPaliers({ id }));
  }

  @Get('baremes-commission/:id')
  @ApiOperation({ summary: 'Get bareme commission by ID' })
  getBaremeCommission(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.getBaremeCommission({ id }));
  }

  @Post('baremes-commission/:id/activer')
  @ApiOperation({ summary: 'Activate bareme commission' })
  activerBaremeCommission(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.activerBaremeCommission({ id }));
  }

  @Post('baremes-commission/:id/desactiver')
  @ApiOperation({ summary: 'Deactivate bareme commission' })
  desactiverBaremeCommission(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.desactiverBaremeCommission({ id }));
  }

  @Delete('baremes-commission/:id')
  @ApiOperation({ summary: 'Delete bareme commission' })
  deleteBaremeCommission(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.deleteBaremeCommission({ id }));
  }

  @Post('paliers-commission')
  @ApiOperation({ summary: 'Create palier commission' })
  createPalierCommission(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.createPalierCommission(body));
  }

  @Put('paliers-commission/:id')
  @ApiOperation({ summary: 'Update palier commission' })
  updatePalierCommission(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.updatePalierCommission({ ...body, id }));
  }

  @Get('paliers-commission/by-bareme/:baremeId')
  @ApiOperation({ summary: 'List paliers commission by bareme' })
  listPaliersByBareme(
    @Param('baremeId') baremeId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.commerciauxGrpcClient.listPaliersByBareme({
        ...query,
        bareme_id: baremeId,
      }),
    );
  }

  @Get('paliers-commission/:id')
  @ApiOperation({ summary: 'Get palier commission by ID' })
  getPalierCommission(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.getPalierCommission({ id }));
  }

  @Post('paliers-commission/:id/activer')
  @ApiOperation({ summary: 'Activate palier commission' })
  activerPalierCommission(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.activerPalierCommission({ id }));
  }

  @Post('paliers-commission/:id/desactiver')
  @ApiOperation({ summary: 'Deactivate palier commission' })
  desactiverPalierCommission(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.desactiverPalierCommission({ id }));
  }

  @Delete('paliers-commission/:id')
  @ApiOperation({ summary: 'Delete palier commission' })
  deletePalierCommission(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.deletePalierCommission({ id }));
  }

  @Post('modeles-distribution')
  @ApiOperation({ summary: 'Create modele distribution' })
  createModeleDistribution(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.createModeleDistribution(body));
  }

  @Put('modeles-distribution/:id')
  @ApiOperation({ summary: 'Update modele distribution' })
  updateModeleDistribution(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.updateModeleDistribution({ ...body, id }));
  }

  @Get('modeles-distribution/code/:code')
  @ApiOperation({ summary: 'Get modele distribution by code' })
  getModeleDistributionByCode(@Param('code') code: string) {
    return firstValueFrom(this.commerciauxGrpcClient.getModeleDistributionByCode({ code }));
  }

  @Get('modeles-distribution')
  @ApiOperation({ summary: 'List modeles distribution' })
  listModelesDistribution(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.commerciauxGrpcClient.listModelesDistribution(query));
  }

  @Get('modeles-distribution/:id')
  @ApiOperation({ summary: 'Get modele distribution by ID' })
  getModeleDistribution(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.getModeleDistribution({ id }));
  }

  @Delete('modeles-distribution/:id')
  @ApiOperation({ summary: 'Delete modele distribution' })
  deleteModeleDistribution(@Param('id') id: string) {
    return firstValueFrom(this.commerciauxGrpcClient.deleteModeleDistribution({ id }));
  }
}

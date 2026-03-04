import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { LogisticsGrpcClient } from '../grpc/logistics-grpc.client';

@ApiTags('Logistics')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/logistics')
export class LogisticsController {
  constructor(private readonly logisticsClient: LogisticsGrpcClient) {}

  // ==================== EXPEDITIONS ====================

  @Post('expeditions')
  @ApiOperation({ summary: 'Create expedition' })
  createExpedition(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.logisticsClient.createExpedition(body));
  }

  @Get('expeditions/:id')
  @ApiOperation({ summary: 'Get expedition by ID' })
  getExpedition(@Param('id') id: string) {
    return firstValueFrom(this.logisticsClient.getExpedition({ id }));
  }

  @Get('expeditions/by-client/:clientId')
  @ApiOperation({ summary: 'Get expeditions by client' })
  getExpeditionsByClient(@Param('clientId') clientId: string) {
    return firstValueFrom(
      this.logisticsClient.getExpeditionsByClient({
        client_base_id: clientId,
      }),
    );
  }

  @Get('expeditions/by-organisation/:orgId')
  @ApiOperation({ summary: 'Get expeditions by organisation' })
  getExpeditionsByOrganisation(@Param('orgId') orgId: string) {
    return firstValueFrom(
      this.logisticsClient.getExpeditionsByOrganisation({
        organisation_id: orgId,
      }),
    );
  }

  @Put('expeditions/:id')
  @ApiOperation({ summary: 'Update expedition' })
  updateExpedition(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.logisticsClient.updateExpedition({ ...body, id }),
    );
  }

  @Delete('expeditions/:id')
  @ApiOperation({ summary: 'Delete expedition' })
  deleteExpedition(@Param('id') id: string) {
    return firstValueFrom(this.logisticsClient.deleteExpedition({ id }));
  }

  // ==================== COLIS (PARCELS) ====================

  @Post('colis')
  @ApiOperation({ summary: 'Create colis' })
  createColis(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.logisticsClient.createColis(body));
  }

  @Get('colis/:id')
  @ApiOperation({ summary: 'Get colis by ID' })
  getColis(@Param('id') id: string) {
    return firstValueFrom(this.logisticsClient.getColis({ id }));
  }

  @Get('colis/by-expedition/:expeditionId')
  @ApiOperation({ summary: 'Get colis by expedition' })
  getColisByExpedition(@Param('expeditionId') expeditionId: string) {
    return firstValueFrom(
      this.logisticsClient.getColisByExpedition({
        expedition_id: expeditionId,
      }),
    );
  }

  @Put('colis/:id')
  @ApiOperation({ summary: 'Update colis' })
  updateColis(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(this.logisticsClient.updateColis({ ...body, id }));
  }

  @Delete('colis/:id')
  @ApiOperation({ summary: 'Delete colis' })
  deleteColis(@Param('id') id: string) {
    return firstValueFrom(this.logisticsClient.deleteColis({ id }));
  }

  // ==================== TRACKING EVENTS ====================

  @Post('tracking-events')
  @ApiOperation({ summary: 'Create tracking event' })
  createTrackingEvent(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.logisticsClient.createTrackingEvent(body));
  }

  @Get('tracking-events/by-expedition/:expeditionId')
  @ApiOperation({ summary: 'Get tracking events by expedition' })
  getTrackingEvents(@Param('expeditionId') expeditionId: string) {
    return firstValueFrom(
      this.logisticsClient.getTrackingEvents({
        expedition_id: expeditionId,
      }),
    );
  }

  @Get('tracking-events/latest/:expeditionId')
  @ApiOperation({ summary: 'Get latest tracking event for expedition' })
  getLatestTrackingEvent(@Param('expeditionId') expeditionId: string) {
    return firstValueFrom(
      this.logisticsClient.getLatestTrackingEvent({
        expedition_id: expeditionId,
      }),
    );
  }

  // ==================== CARRIER ACCOUNTS ====================

  @Post('carrier-accounts')
  @ApiOperation({ summary: 'Create carrier account' })
  createCarrierAccount(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.logisticsClient.createCarrierAccount(body));
  }

  @Get('carrier-accounts/:id')
  @ApiOperation({ summary: 'Get carrier account by ID' })
  getCarrierAccount(@Param('id') id: string) {
    return firstValueFrom(this.logisticsClient.getCarrierAccount({ id }));
  }

  @Get('carrier-accounts/by-organisation/:orgId')
  @ApiOperation({ summary: 'Get carrier accounts by organisation' })
  getCarrierAccountsByOrganisation(@Param('orgId') orgId: string) {
    return firstValueFrom(
      this.logisticsClient.getCarrierAccountsByOrganisation({
        organisation_id: orgId,
      }),
    );
  }

  @Put('carrier-accounts/:id')
  @ApiOperation({ summary: 'Update carrier account' })
  updateCarrierAccount(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.logisticsClient.updateCarrierAccount({ ...body, id }),
    );
  }

  @Delete('carrier-accounts/:id')
  @ApiOperation({ summary: 'Delete carrier account' })
  deleteCarrierAccount(@Param('id') id: string) {
    return firstValueFrom(this.logisticsClient.deleteCarrierAccount({ id }));
  }

  // ==================== MAILEVA OPERATIONS ====================

  @Post('labels/generate')
  @ApiOperation({ summary: 'Generate shipping label' })
  generateLabel(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.logisticsClient.generateLabel(body));
  }

  @Post('tracking/track')
  @ApiOperation({ summary: 'Track shipment' })
  trackShipment(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.logisticsClient.trackShipment(body));
  }

  @Post('address-validation')
  @ApiOperation({ summary: 'Validate address' })
  validateAddress(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.logisticsClient.validateAddress(body));
  }

  @Post('pricing-simulation')
  @ApiOperation({ summary: 'Simulate pricing' })
  simulatePricing(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.logisticsClient.simulatePricing(body));
  }
}

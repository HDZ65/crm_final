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
import { WoocommerceGrpcClient } from '../grpc/woocommerce-grpc.client';

@ApiTags('Woocommerce')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/woocommerce')
export class WoocommerceController {
  constructor(private readonly woocommerceGrpcClient: WoocommerceGrpcClient) {}

  // ==================== WEBHOOK ROUTES ====================

  @Post('webhooks/process')
  @ApiOperation({ summary: 'Process a WooCommerce webhook' })
  processWebhook(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.woocommerceGrpcClient.processWebhook(body));
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List webhook events' })
  listWebhookEvents(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.woocommerceGrpcClient.listWebhookEvents(query));
  }

  @Get('webhooks/:id')
  @ApiOperation({ summary: 'Get webhook event by ID' })
  getWebhookEvent(@Param('id') id: string) {
    return firstValueFrom(this.woocommerceGrpcClient.getWebhookEvent({ id }));
  }

  @Post('webhooks/:id/retry')
  @ApiOperation({ summary: 'Retry a failed webhook event' })
  retryWebhookEvent(@Param('id') id: string) {
    return firstValueFrom(this.woocommerceGrpcClient.retryWebhookEvent({ id }));
  }

  // ==================== MAPPING ROUTES ====================

  @Post('mappings')
  @ApiOperation({ summary: 'Create a WooCommerce mapping' })
  createMapping(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.woocommerceGrpcClient.createMapping(body));
  }

  @Put('mappings/:id')
  @ApiOperation({ summary: 'Update a WooCommerce mapping' })
  updateMapping(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.woocommerceGrpcClient.updateMapping({ ...body, id }));
  }

  @Get('mappings/:id')
  @ApiOperation({ summary: 'Get a WooCommerce mapping by ID' })
  getMapping(@Param('id') id: string) {
    return firstValueFrom(this.woocommerceGrpcClient.getMapping({ id }));
  }

  @Get('mappings/external/:organisationId/:entityType/:externalId')
  @ApiOperation({ summary: 'Get a WooCommerce mapping by external ID' })
  getMappingByExternalId(
    @Param('organisationId') organisation_id: string,
    @Param('entityType') entity_type: string,
    @Param('externalId') external_id: string,
  ) {
    return firstValueFrom(
      this.woocommerceGrpcClient.getMappingByExternalId({
        organisation_id,
        entity_type,
        external_id,
      }),
    );
  }

  @Get('mappings')
  @ApiOperation({ summary: 'List WooCommerce mappings' })
  listMappings(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.woocommerceGrpcClient.listMappings(query));
  }

  @Delete('mappings/:id')
  @ApiOperation({ summary: 'Delete a WooCommerce mapping' })
  deleteMapping(@Param('id') id: string) {
    return firstValueFrom(this.woocommerceGrpcClient.deleteMapping({ id }));
  }

  // ==================== CONFIG ROUTES ====================

  @Post('configs')
  @ApiOperation({ summary: 'Create a WooCommerce config' })
  createConfig(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.woocommerceGrpcClient.createConfig(body));
  }

  @Put('configs/:id')
  @ApiOperation({ summary: 'Update a WooCommerce config' })
  updateConfig(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.woocommerceGrpcClient.updateConfig({ ...body, id }));
  }

  @Get('configs/:id')
  @ApiOperation({ summary: 'Get a WooCommerce config by ID' })
  getConfig(@Param('id') id: string) {
    return firstValueFrom(this.woocommerceGrpcClient.getConfig({ id }));
  }

  @Get('configs/organisation/:organisationId')
  @ApiOperation({ summary: 'Get WooCommerce config by organisation' })
  getConfigByOrganisation(@Param('organisationId') organisation_id: string) {
    return firstValueFrom(
      this.woocommerceGrpcClient.getConfigByOrganisation({ organisation_id }),
    );
  }

  @Get('configs/organisation/:organisationId/list')
  @ApiOperation({ summary: 'List WooCommerce configs by organisation' })
  listConfigsByOrganisation(@Param('organisationId') organisation_id: string) {
    return firstValueFrom(
      this.woocommerceGrpcClient.listConfigsByOrganisation({ organisation_id }),
    );
  }

  @Delete('configs/:id')
  @ApiOperation({ summary: 'Delete a WooCommerce config' })
  deleteConfig(@Param('id') id: string) {
    return firstValueFrom(this.woocommerceGrpcClient.deleteConfig({ id }));
  }

  @Post('configs/test-connection')
  @ApiOperation({ summary: 'Test WooCommerce connection' })
  testConnection(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.woocommerceGrpcClient.testConnection(body));
  }
}

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
import { CfastGrpcClient } from '../grpc/cfast-grpc.client';

@ApiTags('Cfast')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/cfast')
export class CfastController {
  constructor(private readonly cfastGrpcClient: CfastGrpcClient) {}

  @Post('config')
  @ApiOperation({ summary: 'Create CFAST config' })
  createCfastConfig(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.cfastGrpcClient.createCfastConfig(body));
  }

  @Put('config/:id')
  @ApiOperation({ summary: 'Update CFAST config' })
  updateCfastConfig(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.cfastGrpcClient.updateCfastConfig({ ...body, id }));
  }

  @Get('config/organisation/:organisationId')
  @ApiOperation({ summary: 'Get CFAST config by organisation' })
  getCfastConfigByOrganisation(@Param('organisationId') organisationId: string) {
    return firstValueFrom(this.cfastGrpcClient.getCfastConfigByOrganisation({ organisation_id: organisationId }));
  }

  @Get('config/:id')
  @ApiOperation({ summary: 'Get CFAST config by ID' })
  getCfastConfig(@Param('id') id: string) {
    return firstValueFrom(this.cfastGrpcClient.getCfastConfig({ id }));
  }

  @Delete('config/:id')
  @ApiOperation({ summary: 'Delete CFAST config' })
  deleteCfastConfig(@Param('id') id: string) {
    return firstValueFrom(this.cfastGrpcClient.deleteCfastConfig({ id }));
  }

  @Post('config/test-connection')
  @ApiOperation({ summary: 'Test CFAST connection' })
  testCfastConnection(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.cfastGrpcClient.testCfastConnection(body));
  }

  @Post('import/invoices')
  @ApiOperation({ summary: 'Import invoices from CFAST' })
  importInvoices(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.cfastGrpcClient.importInvoices(body));
  }

  @Get('import/status/:organisationId')
  @ApiOperation({ summary: 'Get CFAST import status' })
  getImportStatus(@Param('organisationId') organisationId: string) {
    return firstValueFrom(this.cfastGrpcClient.getImportStatus({ organisation_id: organisationId }));
  }

  @Post('push/client')
  @ApiOperation({ summary: 'Push client to CFAST' })
  pushClientToCfast(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.cfastGrpcClient.pushClientToCfast(body));
  }

  @Post('push/contract')
  @ApiOperation({ summary: 'Push contract to CFAST' })
  pushContractToCfast(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.cfastGrpcClient.pushContractToCfast(body));
  }

  @Post('push/subscription/assign')
  @ApiOperation({ summary: 'Assign subscription in CFAST' })
  assignSubscriptionInCfast(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.cfastGrpcClient.assignSubscriptionInCfast(body));
  }

  @Post('push/invoices/unpaid/sync')
  @ApiOperation({ summary: 'Sync unpaid invoices to CFAST' })
  syncUnpaidInvoices(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.cfastGrpcClient.syncUnpaidInvoices(body));
  }

  @Get('push/status/:organisationId')
  @ApiOperation({ summary: 'Get CFAST sync status' })
  getCfastSyncStatus(@Param('organisationId') organisationId: string) {
    return firstValueFrom(this.cfastGrpcClient.getCfastSyncStatus({ organisation_id: organisationId }));
  }

  @Get('push/mappings/:organisationId')
  @ApiOperation({ summary: 'Get CFAST entity mappings' })
  getCfastEntityMappings(
    @Param('organisationId') organisationId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return firstValueFrom(
      this.cfastGrpcClient.getCfastEntityMappings({
        ...query,
        organisation_id: organisationId,
      }),
    );
  }
}

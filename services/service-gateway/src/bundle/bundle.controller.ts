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
import { BundleGrpcClient } from '../grpc/bundle-grpc.client';

@ApiTags('Bundle')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/bundle')
export class BundleController {
  constructor(private readonly bundleGrpcClient: BundleGrpcClient) {}

  @Post('configurations')
  @ApiOperation({ summary: 'Create bundle configuration' })
  createConfiguration(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.bundleGrpcClient.createConfiguration(body));
  }

  @Get('configurations')
  @ApiOperation({ summary: 'List bundle configurations' })
  listConfigurations(@Query() query: Record<string, unknown>) {
    return firstValueFrom(this.bundleGrpcClient.listConfigurations(query));
  }

  @Get('configurations/:id')
  @ApiOperation({ summary: 'Get bundle configuration by ID' })
  getConfiguration(@Param('id') id: string) {
    return firstValueFrom(this.bundleGrpcClient.getConfiguration({ id }));
  }

  @Get('configurations/code/:organisationId/:code')
  @ApiOperation({ summary: 'Get bundle configuration by code' })
  getConfigurationByCode(
    @Param('organisationId') organisation_id: string,
    @Param('code') code: string,
  ) {
    return firstValueFrom(
      this.bundleGrpcClient.getConfigurationByCode({ organisation_id, code }),
    );
  }

  @Put('configurations/:id')
  @ApiOperation({ summary: 'Update bundle configuration' })
  updateConfiguration(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return firstValueFrom(this.bundleGrpcClient.updateConfiguration({ ...body, id }));
  }

  @Delete('configurations/:id')
  @ApiOperation({ summary: 'Delete bundle configuration' })
  deleteConfiguration(@Param('id') id: string) {
    return firstValueFrom(this.bundleGrpcClient.deleteConfiguration({ id }));
  }

  @Post('calculate-price')
  @ApiOperation({ summary: 'Calculate bundle price' })
  calculatePrice(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.bundleGrpcClient.calculatePrice(body));
  }

  @Post('recalculate-client')
  @ApiOperation({ summary: 'Recalculate client bundle eligibility' })
  recalculateClient(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.bundleGrpcClient.recalculateClient(body));
  }
}

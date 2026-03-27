import {
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { DashboardGrpcClient } from '../grpc/dashboard-grpc.client';
import { Body } from '@nestjs/common';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardClient: DashboardGrpcClient) {}

  // ==================== KPIs ====================

  @Post('kpis')
  @ApiOperation({ summary: 'Get dashboard KPIs' })
  getKpis(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.dashboardClient.getKpis(body));
  }

  // ==================== Evolution CA ====================

  @Post('evolution-ca')
  @ApiOperation({ summary: 'Get CA evolution data' })
  getEvolutionCa(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.dashboardClient.getEvolutionCa(body));
  }

  // ==================== Repartition Produits ====================

  @Post('repartition-produits')
  @ApiOperation({ summary: 'Get product distribution data' })
  getRepartitionProduits(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.dashboardClient.getRepartitionProduits(body));
  }

  // ==================== Stats Societes ====================

  @Post('stats-societes')
  @ApiOperation({ summary: 'Get company statistics' })
  getStatsSocietes(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.dashboardClient.getStatsSocietes(body));
  }

  // ==================== Alertes ====================

  @Post('alertes')
  @ApiOperation({ summary: 'Get dashboard alerts' })
  getAlertes(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.dashboardClient.getAlertes(body));
  }

  // ==================== KPIs Commerciaux ====================

  @Post('kpis-commerciaux')
  @ApiOperation({ summary: 'Get commercial KPIs' })
  getKpisCommerciaux(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.dashboardClient.getKpisCommerciaux(body));
  }
}

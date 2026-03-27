import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { ScoringGrpcClient } from '../grpc/scoring-grpc.client';

@ApiTags('Scoring')
@ApiBearerAuth('bearer')
@UseGuards(KeycloakJwtGuard)
@Controller('api/scoring')
export class ScoringController {
  constructor(private readonly scoringClient: ScoringGrpcClient) {}

  @Post('predict')
  @ApiOperation({ summary: 'Predict risk score' })
  predictRisk(@Body() body: Record<string, unknown>) {
    return firstValueFrom(this.scoringClient.predictRisk(body));
  }
}

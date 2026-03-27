import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { KeycloakJwtGuard } from '../auth/keycloak-jwt.guard';
import { ContratGrpcClient } from '../grpc/contrat-grpc.client';
import { NatsPublisherService } from '../nats/nats-publisher.service';
import { CreateContratDto } from './dto/create-contrat.dto';

@ApiTags('WinLeadPlus Webhook')
@ApiBearerAuth('bearer')
@Controller('api')
export class ContratController {
  private readonly logger = new Logger(ContratController.name);

  constructor(
    private readonly natsPublisher: NatsPublisherService,
    private readonly contratGrpcClient: ContratGrpcClient,
  ) {}

  @ApiOperation({
    summary: 'Receive signed contract from WinLead+',
    description: 'Webhook endpoint for WinLead+. Validates the contract payload against the schema (docs/contract-payload-schema.jsonc), publishes to NATS for async orchestration, and optionally calls service-commercial via gRPC. Returns immediately with a correlation ID.',
  })
  @ApiResponse({
    status: 202,
    description: 'Contract accepted and queued for processing',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        correlation_id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
        message: { type: 'string', example: 'Contract received and queued for processing' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — payload does not match contract schema',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        timestamp: { type: 'string', example: '2026-03-02T12:00:00.000Z' },
        path: { type: 'string', example: '/api/winleadplus' },
        error: { type: 'string', example: 'Bad Request' },
        message: { type: 'array', items: { type: 'string' }, example: ['prospect.nom should not be empty'] },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Keycloak JWT token' })
  @Post('winleadplus')
  @UseGuards(KeycloakJwtGuard)
  @HttpCode(202)
  async createContrat(@Body() dto: CreateContratDto) {
    const correlation_id = randomUUID();

    this.logger.log(
      `Contract received correlation_id=${correlation_id} societe_id=${dto.societe_id}`,
    );

    await this.natsPublisher.publish('crm.gateway.winleadplus.received', {
      correlation_id,
      payload: dto,
      received_at: new Date().toISOString(),
      source: 'winleadplus',
    });

    try {
      await firstValueFrom(
        this.contratGrpcClient.createContrat({
          correlation_id,
          ...dto,
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Non-blocking gRPC create failed correlation_id=${correlation_id} societe_id=${dto.societe_id}`,
      );
    }

    return {
      success: true,
      correlation_id,
      message: 'Contract received and queued for processing',
    };
  }
}

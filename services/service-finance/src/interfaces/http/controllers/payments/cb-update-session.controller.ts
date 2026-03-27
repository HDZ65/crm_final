import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CbUpdateSessionService } from '../../../../infrastructure/persistence/typeorm/repositories/payments/cb-update-session.service';

export interface CreateCbUpdateSessionDto {
  clientId: string;
  organisationId: string;
  scheduleId: string;
  subscriptionType: 'WEB_DIRECT' | 'STORE';
}

export interface CreateCbUpdateSessionResponse {
  link: string;
  expiresAt: string;
  tokenHash: string;
}

/**
 * POST /portal/cb-update-session
 *
 * Generates a 24h temporary token for CB (card) update.
 * Used by the dunning J+2 SMS to send a link to the subscriber.
 */
@Controller('portal')
export class CbUpdateSessionController {
  private readonly logger = new Logger(CbUpdateSessionController.name);

  constructor(
    private readonly cbUpdateSessionService: CbUpdateSessionService,
  ) {}

  @Post('cb-update-session')
  @HttpCode(HttpStatus.CREATED)
  async createCbUpdateSession(
    @Body() dto: CreateCbUpdateSessionDto,
  ): Promise<CreateCbUpdateSessionResponse> {
    this.logger.log(
      `POST /portal/cb-update-session client=${dto.clientId} type=${dto.subscriptionType}`,
    );

    const session = await this.cbUpdateSessionService.createSession({
      clientId: dto.clientId,
      organisationId: dto.organisationId,
      scheduleId: dto.scheduleId,
      subscriptionType: dto.subscriptionType,
    });

    return {
      link: session.link,
      expiresAt: session.expiresAt.toISOString(),
      tokenHash: session.tokenHash,
    };
  }
}

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  DepanssurWebhookService,
} from '../../../domain/depanssur/services/depanssur-webhook.service';
import type { DepanssurWebhookPayload } from '../../../domain/depanssur/services/depanssur-webhook.service';

@Controller('webhooks')
export class DepanssurWebhookController {
  private readonly logger = new Logger(DepanssurWebhookController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly webhookService: DepanssurWebhookService,
    private readonly configService: ConfigService,
  ) {
    this.webhookSecret = this.configService.get<string>(
      'DEPANSSUR_WEBHOOK_SECRET',
      'depanssur-webhook-secret-default',
    );
  }

  @Post('depanssur')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: Record<string, any>,
    @Headers('x-depanssur-signature') signature: string | undefined,
    @Req() req: any,
  ): Promise<{ status: string; eventId: string }> {
    const payload = body as DepanssurWebhookPayload;
    this.logger.log(
      `POST /webhooks/depanssur — eventId=${payload.eventId} type=${payload.eventType}`,
    );

    // 1. Validate HMAC signature
    this.validateSignature(req, signature);

    // 2. Basic payload validation
    if (!payload.eventId || !payload.eventType) {
      throw new UnauthorizedException('Missing required fields: eventId, eventType');
    }

    // 3. Process (logs event immediately, dispatches handler async)
    const logEntry = await this.webhookService.processWebhook(payload, signature ?? null);

    return {
      status: logEntry.isDuplicate() ? 'duplicate' : 'accepted',
      eventId: payload.eventId,
    };
  }

  /**
   * Validate HMAC-SHA256 signature from X-Depanssur-Signature header.
   * Computes HMAC over raw body using shared secret.
   */
  private validateSignature(
    req: any,
    signature: string | undefined,
  ): void {
    if (!signature) {
      throw new UnauthorizedException('Missing X-Depanssur-Signature header');
    }

    // Use raw body if available, fallback to stringified body
    const rawBody = req.rawBody
      ? req.rawBody
      : Buffer.from(JSON.stringify(req.body));

    const expectedSignature = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Prefix support: "sha256=<hex>" or just "<hex>"
    const providedHex = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    try {
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const providedBuffer = Buffer.from(providedHex, 'hex');

      if (
        expectedBuffer.length !== providedBuffer.length ||
        !timingSafeEqual(expectedBuffer, providedBuffer)
      ) {
        this.logger.warn('Webhook signature mismatch');
        throw new UnauthorizedException('Invalid signature');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Buffer.from with invalid hex, or length mismatch
      this.logger.warn(`Webhook signature validation error: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid signature');
    }
  }
}

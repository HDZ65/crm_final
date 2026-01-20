import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { GoCardlessService } from '../../../../services/gocardless.service';
import { ProcessWebhookUseCase } from '../../../../../applications/usecase/gocardless/process-webhook.usecase';

@ApiTags('GoCardless Webhooks')
@Controller('webhooks/gocardless')
export class GoCardlessWebhookController {
  private readonly logger = new Logger(GoCardlessWebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly gocardlessService: GoCardlessService,
    private readonly processWebhookUseCase: ProcessWebhookUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Handle GoCardless webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 498, description: 'Invalid signature' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('webhook-signature') signature: string,
  ): Promise<void> {
    const webhookSecret = this.configService.get<string>(
      'GOCARDLESS_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      this.logger.error('GOCARDLESS_WEBHOOK_SECRET not configured');
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Webhook secret not configured');
      return;
    }

    // Get raw body for signature verification
    const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);

    // Verify signature
    const isValid = this.gocardlessService.verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret,
    );

    if (!isValid) {
      this.logger.warn('Invalid webhook signature received');
      res.status(498).send('Invalid signature');
      return;
    }

    // Parse and process events
    try {
      const events = this.gocardlessService.parseWebhookEvents(req.body);

      this.logger.log(`Received ${events.length} webhook event(s)`);

      // Process events asynchronously (don't block response)
      setImmediate(async () => {
        try {
          await this.processWebhookUseCase.execute(events);
        } catch (error) {
          this.logger.error(`Error processing webhook events: ${error.message}`, error.stack);
        }
      });

      // Respond immediately to GoCardless
      res.status(HttpStatus.OK).send('OK');
    } catch (error) {
      this.logger.error(`Error parsing webhook: ${error.message}`, error.stack);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error processing webhook');
    }
  }
}

import {
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Headers,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { NatsPublisherService } from '../nats/nats-publisher.service';
import { YousignApiClient } from './yousign-api.client';

// --------------------------------------------------------------------------
// Yousign V3 Webhook Event Types
// --------------------------------------------------------------------------

interface YousignWebhookPayload {
  event_name: string;
  event_time: string;
  data: {
    signature_request: {
      id: string;
      status: string;
      external_id?: string;
      signers: Array<{
        id: string;
        info: { first_name: string; last_name: string; email: string };
        status: string;
      }>;
      documents: Array<{
        id: string;
        filename: string;
        nature: string;
      }>;
    };
    signer?: {
      id: string;
      info: { first_name: string; last_name: string; email: string };
      status: string;
    };
  };
}

// --------------------------------------------------------------------------
// NATS event subjects
// --------------------------------------------------------------------------

const NATS_DOCUMENT_SIGNED = 'crm.document.signed';
const NATS_DOCUMENT_SIGNATURE_FAILED = 'crm.document.signature.failed';

@ApiExcludeController()
@Controller('api/yousign/webhooks')
export class YousignWebhookController {
  private readonly logger = new Logger(YousignWebhookController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly natsPublisher: NatsPublisherService,
    private readonly yousignClient: YousignApiClient,
  ) {
    const secret = this.configService.get<string>('YOUSIGN_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn(
        'YOUSIGN_WEBHOOK_SECRET is not set — webhook signature validation will reject all requests',
      );
    }
    this.webhookSecret = secret ?? '';
  }

  // --------------------------------------------------------------------------
  // POST /api/yousign/webhooks
  // --------------------------------------------------------------------------

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-yousign-signature-256') signatureHeader: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: true }> {
    // 1. Validate HMAC signature
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body — ensure raw body parsing is enabled');
    }

    this.validateSignature(rawBody, signatureHeader);

    // 2. Parse payload
    const payload: YousignWebhookPayload = JSON.parse(rawBody.toString('utf-8'));
    const eventName = payload.event_name;

    this.logger.log(
      `Received Yousign webhook: ${eventName} for signature_request ${payload.data.signature_request.id}`,
    );

    // 3. Route event
    switch (eventName) {
      case 'signature_request.done':
        await this.handleSignatureRequestDone(payload);
        break;

      case 'signature_request.expired':
      case 'signature_request.declined':
        await this.handleSignatureRequestFailed(payload, eventName);
        break;

      case 'signer.done':
        this.handleSignerDone(payload);
        break;

      default:
        this.logger.debug(`Unhandled Yousign webhook event: ${eventName}`);
    }

    return { received: true };
  }

  // --------------------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------------------

  private async handleSignatureRequestDone(payload: YousignWebhookPayload): Promise<void> {
    const sigReq = payload.data.signature_request;

    // Download all signed documents and publish events
    for (const doc of sigReq.documents) {
      try {
        // Attempt download of signed document — fire-and-forget for now
        // The downloaded buffer would be stored in S3 by downstream consumers
        await this.yousignClient.downloadSignedDocument(sigReq.id, doc.id);

        this.logger.log(
          `Downloaded signed document ${doc.id} (${doc.filename}) for signature_request ${sigReq.id}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to download signed document ${doc.id}: ${message}`,
        );
      }
    }

    // Find the signer who completed
    const completedSigner = sigReq.signers.find((s) => s.status === 'signed');

    // Publish NATS event
    await this.natsPublisher.publish(NATS_DOCUMENT_SIGNED, {
      signature_request_id: sigReq.id,
      document_id: sigReq.documents[0]?.id ?? '',
      contrat_id: sigReq.external_id ?? '',
      organisation_id: '',
      signer_email: completedSigner?.info.email ?? '',
      signed_at: payload.event_time,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Published ${NATS_DOCUMENT_SIGNED} for signature_request ${sigReq.id}`);
  }

  private async handleSignatureRequestFailed(
    payload: YousignWebhookPayload,
    eventName: string,
  ): Promise<void> {
    const sigReq = payload.data.signature_request;
    const reason = eventName === 'signature_request.expired' ? 'expired' : 'declined';

    await this.natsPublisher.publish(NATS_DOCUMENT_SIGNATURE_FAILED, {
      signature_request_id: sigReq.id,
      contrat_id: sigReq.external_id ?? '',
      organisation_id: '',
      reason,
      status: sigReq.status,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Published ${NATS_DOCUMENT_SIGNATURE_FAILED} (${reason}) for signature_request ${sigReq.id}`,
    );
  }

  private handleSignerDone(payload: YousignWebhookPayload): void {
    const signer = payload.data.signer;
    if (signer) {
      this.logger.log(
        `Signer ${signer.info.email} completed signing for signature_request ${payload.data.signature_request.id}`,
      );
    }
  }

  // --------------------------------------------------------------------------
  // HMAC Validation
  // --------------------------------------------------------------------------

  private validateSignature(rawBody: Buffer, signatureHeader: string | undefined): void {
    if (!this.webhookSecret) {
      throw new ForbiddenException('Webhook secret not configured');
    }

    if (!signatureHeader) {
      throw new ForbiddenException('Missing X-Yousign-Signature-256 header');
    }

    const expectedSignature = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const expected = Buffer.from(expectedSignature, 'hex');
    const received = Buffer.from(signatureHeader, 'hex');

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new ForbiddenException('Invalid webhook signature');
    }
  }
}

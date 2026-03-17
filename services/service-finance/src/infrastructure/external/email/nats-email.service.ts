import { Injectable, Logger } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';
import {
  IEmailService,
  SendEmailInput,
  SendEmailResult,
} from './email-service.interface';

/**
 * Email Service that publishes `notification.email.send` NATS events
 * to service-engagement for actual email delivery.
 */
@Injectable()
export class NatsEmailService implements IEmailService {
  private readonly logger = new Logger(NatsEmailService.name);

  constructor(private readonly natsService: NatsService) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const messageId = `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      await this.natsService.publish('notification.email.send', {
        messageId,
        templateId: input.templateId,
        recipientClientId: input.recipientClientId,
        variables: input.variables,
        sentAt: new Date().toISOString(),
      });

      this.logger.log(
        `Email event published: template=${input.templateId} client=${input.recipientClientId} messageId=${messageId}`,
      );

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to publish email event: template=${input.templateId} client=${input.recipientClientId}: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        messageId: null,
        errorCode: 'NATS_PUBLISH_FAILED',
        errorMessage: error.message,
      };
    }
  }
}

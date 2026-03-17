import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailService,
  SendEmailInput,
  SendEmailResult,
} from './email-service.interface';

/**
 * Mock Email Service for tests and development.
 * Records all sent emails for assertion.
 */
@Injectable()
export class MockEmailService implements IEmailService {
  private readonly logger = new Logger(MockEmailService.name);
  readonly sentEmails: Array<SendEmailInput & { messageId: string; sentAt: Date }> = [];

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const messageId = `mock-email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    this.sentEmails.push({
      ...input,
      messageId,
      sentAt: new Date(),
    });

    this.logger.debug(
      `[MOCK] Email sent: template=${input.templateId} client=${input.recipientClientId} messageId=${messageId}`,
    );

    return {
      success: true,
      messageId,
    };
  }

  /** Reset recorded emails (useful between tests) */
  reset(): void {
    this.sentEmails.length = 0;
  }

  /** Get last sent email */
  getLastEmail(): (SendEmailInput & { messageId: string; sentAt: Date }) | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }
}

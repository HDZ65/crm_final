import { Injectable, Logger } from '@nestjs/common';
import {
  ISmsService,
  SendSmsInput,
  SendSmsResult,
} from './sms-service.interface';

/**
 * Mock SMS Service for tests and development.
 * Records all sent messages for assertion.
 */
@Injectable()
export class MockSmsService implements ISmsService {
  private readonly logger = new Logger(MockSmsService.name);
  readonly sentMessages: Array<SendSmsInput & { messageId: string; sentAt: Date }> = [];

  async sendSms(input: SendSmsInput): Promise<SendSmsResult> {
    const messageId = `mock-sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    this.sentMessages.push({
      ...input,
      messageId,
      sentAt: new Date(),
    });

    this.logger.debug(`[MOCK] SMS sent: to=${input.to} messageId=${messageId}`);

    return {
      success: true,
      messageId,
    };
  }

  /** Reset recorded messages (useful between tests) */
  reset(): void {
    this.sentMessages.length = 0;
  }

  /** Get last sent message */
  getLastMessage(): (SendSmsInput & { messageId: string; sentAt: Date }) | undefined {
    return this.sentMessages[this.sentMessages.length - 1];
  }
}

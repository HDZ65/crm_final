import { Injectable, Logger } from '@nestjs/common';
import {
  IImsClient,
  NotifySuspensionInput,
  NotifySuspensionResult,
} from './ims-client.interface';

/**
 * Mock IMS Client for tests and development.
 * Records all suspension notifications for assertion.
 */
@Injectable()
export class MockImsClientService implements IImsClient {
  private readonly logger = new Logger(MockImsClientService.name);
  readonly suspensionNotifications: Array<
    NotifySuspensionInput & { externalRef: string; notifiedAt: Date }
  > = [];

  async notifySuspension(
    input: NotifySuspensionInput,
  ): Promise<NotifySuspensionResult> {
    const externalRef = `mock-ims-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    this.suspensionNotifications.push({
      ...input,
      externalRef,
      notifiedAt: new Date(),
    });

    this.logger.debug(
      `[MOCK] IMS suspension notified: subscription=${input.subscriptionId} ref=${externalRef}`,
    );

    return {
      acknowledged: true,
      externalRef,
    };
  }

  reset(): void {
    this.suspensionNotifications.length = 0;
  }

  getLastNotification() {
    return this.suspensionNotifications[this.suspensionNotifications.length - 1];
  }
}

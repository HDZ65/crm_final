import { Injectable, Logger } from '@nestjs/common';
import { NatsService } from '@crm/shared-kernel';

@Injectable()
export class NatsPublisherService {
  private readonly logger = new Logger(NatsPublisherService.name);

  constructor(private readonly natsService: NatsService) {}

  async publish(subject: string, data: unknown): Promise<void> {
    if (this.natsService.isConnected()) {
      await this.natsService.publish(subject, data);
      this.logger.debug(`Published message to ${subject}`);
    } else {
      this.logger.warn(
        `NATS not connected, message to ${subject} not published`,
      );
    }
  }
}

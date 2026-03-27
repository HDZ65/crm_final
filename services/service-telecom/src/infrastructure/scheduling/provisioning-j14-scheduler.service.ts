import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NatsService } from '@crm/shared-kernel';
import { ProvisioningLifecycleService } from '../persistence/typeorm/repositories/provisioning';

@Injectable()
export class ProvisioningJ14SchedulerService {
  private readonly logger = new Logger(ProvisioningJ14SchedulerService.name);
  private isRunning = false;

  constructor(
    private readonly repository: ProvisioningLifecycleService,
    private readonly natsService: NatsService,
  ) {}

  @Cron('0 4 * * *', {
    name: 'provisioning-j14-deadline',
    timeZone: 'Europe/Paris',
  })
  async processJ14Deadline(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('[provisioning-j14-deadline] job already running, skip');
      return;
    }

    this.isRunning = true;
    try {
      const dueLifecycles = await this.repository.findReadyForRetractionDeadline(
        new Date(),
      );

      for (const lifecycle of dueLifecycles) {
        await this.natsService.publish('crm.provisioning.delai_retractation.ecoule', {
          contratId: lifecycle.contratId,
          triggeredAt: new Date().toISOString(),
        });
      }
    } finally {
      this.isRunning = false;
    }
  }
}

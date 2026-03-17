import { NatsService } from '@crm/shared-kernel';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReconductionTaciteLogEntity } from '../../domain/contrats/entities/reconduction-tacite-log.entity';
import type { IReconductionTaciteRepository } from '../../domain/contrats/repositories/IReconductionTaciteRepository';

const RECONDUCTION_TACITE_REPOSITORY = 'IReconductionTaciteRepository';
const BATCH_SIZE = 100;

@Injectable()
export class ReconductionTaciteSchedulerService {
  private readonly logger = new Logger(ReconductionTaciteSchedulerService.name);
  private isRunning = false;

  constructor(
    @Inject(RECONDUCTION_TACITE_REPOSITORY)
    private readonly reconductionTaciteRepository: IReconductionTaciteRepository,
    private readonly natsService: NatsService,
  ) {}

  @Cron('0 5 * * *', {
    name: 'reconduction-tacite-due-notifications',
    timeZone: 'Europe/Paris',
  })
  async processDueNotifications(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Scheduler already running, skipping');
      return;
    }

    this.isRunning = true;
    try {
      const now = new Date();

      const dueJ90 = await this.reconductionTaciteRepository.findContratsDueForJ90(now);
      await this.publishDueContracts(
        dueJ90,
        'crm.reconduction.j90.due',
        (contratId) => this.reconductionTaciteRepository.markJ90Sent(contratId),
      );

      const dueJ30 = await this.reconductionTaciteRepository.findContratsDueForJ30(now);
      await this.publishDueContracts(
        dueJ30,
        'crm.reconduction.j30.due',
        (contratId) => this.reconductionTaciteRepository.markJ30Sent(contratId),
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async publishDueContracts(
    contrats: ReconductionTaciteLogEntity[],
    subject: 'crm.reconduction.j90.due' | 'crm.reconduction.j30.due',
    markSent: (contratId: string) => Promise<void>,
  ): Promise<void> {
    if (contrats.length === 0) {
      return;
    }

    for (let i = 0; i < contrats.length; i += BATCH_SIZE) {
      const batch = contrats.slice(i, i + BATCH_SIZE);

      for (const contrat of batch) {
        const clientId = contrat.contrat?.clientId;

        if (!clientId) {
          this.logger.warn(
            `[${subject}] Missing clientId for contrat ${contrat.contratId}, notification skipped`,
          );
          continue;
        }

        await this.natsService.publish(subject, {
          contratId: contrat.contratId,
          renewalDate: contrat.renewalDate.toISOString(),
          clientId,
        });

        await markSent(contrat.contratId);
      }
    }
  }
}

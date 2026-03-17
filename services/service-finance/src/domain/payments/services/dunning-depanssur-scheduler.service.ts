import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DunningDepanssurService } from './dunning-depanssur.service';

/**
 * DunningDepanssurSchedulerService — Automated cron job for Depanssur dunning.
 *
 * Runs daily at 07:00 UTC to process pending dunning steps (J0, J+2, J+5, J+10).
 * Calls DunningDepanssurService.processPendingSteps() to advance due steps automatically.
 */
@Injectable()
export class DunningDepanssurSchedulerService {
  private readonly logger = new Logger(DunningDepanssurSchedulerService.name);

  constructor(private readonly dunningService: DunningDepanssurService) {}

  /**
   * Daily at 07:00 UTC — Process pending dunning steps.
   * Advances J0, J+2, J+5, J+10 steps for all active dunning runs.
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM, {
    name: 'dunning-depanssur-daily',
    timeZone: 'UTC',
  })
  async handleDunningCron(): Promise<void> {
    this.logger.log('Running dunning step processor...');
    const processed = await this.dunningService.processPendingSteps();
    this.logger.log(`Dunning cron: processed ${processed} step(s)`);
  }
}

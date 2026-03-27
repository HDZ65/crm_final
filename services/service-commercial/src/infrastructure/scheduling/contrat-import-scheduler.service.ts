import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ImportOrchestratorService } from '../../domain/import/services/import-orchestrator.service';

// ────────────────────────────────────────────────────────────────────────────
// Default cron expression — overridable via environment variable
// ────────────────────────────────────────────────────────────────────────────
const DEFAULT_CRON_HOURLY = '0 * * * *'; // Every hour at minute 0

/**
 * ContratImportSchedulerService — Automated cron job for multi-entity import.
 *
 * Scheduled job:
 *   Hourly — Import prospects with contracts, subscriptions, payments, and commercials
 *   Supports incremental sync via updatedSince parameter
 */
@Injectable()
export class ContratImportSchedulerService {
  private readonly logger = new Logger(ContratImportSchedulerService.name);

  /** Configurable cron expression (resolved at construction) */
  private readonly cronSchedule: string;

  /** Guard flag to prevent concurrent imports */
  private isImportRunning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly importOrchestratorService: ImportOrchestratorService,
  ) {
    this.cronSchedule = this.configService.get<string>(
      'IMPORT_CRON_SCHEDULE',
      DEFAULT_CRON_HOURLY,
    );

    this.logger.log(
      `Scheduler initialized — import schedule: "${this.cronSchedule}"`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // JOB — Hourly: Import multi-entity data from external API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Hourly import of prospects with nested contracts, subscriptions, payments, and commercials.
   * Configurable via IMPORT_CRON_SCHEDULE environment variable.
   * Supports incremental sync via updatedSince parameter.
   */
  @Cron(process.env.IMPORT_CRON_SCHEDULE || DEFAULT_CRON_HOURLY, {
    name: 'contrat-import',
    timeZone: 'Europe/Paris',
  })
  async handleContractImport(): Promise<void> {
    const jobName = 'contrat-import';
    const startTime = Date.now();

    // Guard: prevent concurrent imports
    if (this.isImportRunning) {
      this.logger.warn(
        `[${jobName}] Import already in progress, skipping this execution`,
      );
      return;
    }

    this.isImportRunning = true;

    try {
      // Read configuration from environment variables
      const apiUrl = this.configService.get<string>(
        'EXTERNAL_API_URL',
        'http://localhost:3000/api',
      );
      const apiKey = this.configService.get<string>('EXTERNAL_API_KEY', '');
      const organisationId = this.configService.get<string>(
        'IMPORT_ORGANISATION_ID',
        '',
      );

      if (!organisationId) {
        this.logger.error(
          `[${jobName}] IMPORT_ORGANISATION_ID not configured, skipping import`,
        );
        return;
      }

      this.logger.log(
        `[${jobName}] Starting multi-entity import from ${apiUrl}`,
      );

      // Call the import orchestrator
      const result = await this.importOrchestratorService.importAll({
        apiUrl,
        apiKey,
        organisationId,
        dryRun: false,
      });

      const durationMs = Date.now() - startTime;

      // Log summary
      this.logger.log(
        `[${jobName}] Import complete in ${durationMs}ms — ` +
          `total: ${result.total}, ` +
          `created: ${result.created}, ` +
          `updated: ${result.updated}, ` +
          `skipped: ${result.skipped}, ` +
          `errors: ${result.errors.length}`,
      );

      // Log errors if any
      if (result.errors.length > 0) {
        this.logger.warn(
          `[${jobName}] Import completed with ${result.errors.length} error(s):`,
        );
        for (const error of result.errors.slice(0, 10)) {
          // Log first 10 errors
          this.logger.warn(
            `  Prospect ${error.prospectExternalId}: ${error.message}`,
          );
        }
        if (result.errors.length > 10) {
          this.logger.warn(
            `  ... and ${result.errors.length - 10} more error(s)`,
          );
        }
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.logger.error(
        `[${jobName}] Job failed after ${durationMs}ms: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      // Always reset the guard flag
      this.isImportRunning = false;
    }
  }
}

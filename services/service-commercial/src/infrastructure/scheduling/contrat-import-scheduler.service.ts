import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ContratImportService } from '../../domain/contrats/services/contrat-import.service';

// ────────────────────────────────────────────────────────────────────────────
// Default cron expression — overridable via environment variable
// ────────────────────────────────────────────────────────────────────────────
const DEFAULT_CRON_DAILY_0200 = '0 2 * * *'; // Every day at 02:00

/**
 * ContratImportSchedulerService — Automated cron job for contract import.
 *
 * Scheduled job:
 *   Daily 02:00 — Import contracts from external API
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
    private readonly contratImportService: ContratImportService,
  ) {
    this.cronSchedule = this.configService.get<string>(
      'IMPORT_CRON_SCHEDULE',
      DEFAULT_CRON_DAILY_0200,
    );

    this.logger.log(
      `Scheduler initialized — import schedule: "${this.cronSchedule}"`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // JOB — Daily 02:00: Import contracts from external API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Daily at 02:00 — Import contracts from external API.
   * Configurable via IMPORT_CRON_SCHEDULE environment variable.
   */
  @Cron(process.env.IMPORT_CRON_SCHEDULE || DEFAULT_CRON_DAILY_0200, {
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
      const sourceUrl = this.configService.get<string>(
        'EXTERNAL_API_URL',
        'http://localhost:3000/api/contracts',
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
        `[${jobName}] Starting contract import from ${sourceUrl}`,
      );

      // Call the import service
      const result = await this.contratImportService.importFromExternal({
        organisationId,
        sourceUrl,
        apiKey,
        dryRun: false,
      });

      const durationMs = Date.now() - startTime;

      // Log summary
      this.logger.log(
        `[${jobName}] Import complete in ${durationMs}ms — ` +
          `created: ${result.createdCount}, ` +
          `updated: ${result.updatedCount}, ` +
          `skipped: ${result.skippedCount}, ` +
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
            `  Row ${error.row} (${error.reference}): ${error.errorMessage}`,
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

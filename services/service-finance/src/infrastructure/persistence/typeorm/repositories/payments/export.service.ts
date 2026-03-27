import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';

import {
  ExportJobEntity,
  ExportFormat,
  ExportJobStatus,
} from '../../../../../domain/payments/entities/export-job.entity';
import {
  PaymentIntentEntity,
  PaymentIntentStatus,
} from '../../../../../domain/payments/entities/payment-intent.entity';
import {
  RiskScoreEntity,
} from '../../../../../domain/payments/entities/risk-score.entity';
import {
  RetryScheduleEntity,
} from '../../../../../domain/payments/entities/retry-schedule.entity';
import {
  ReminderEntity,
} from '../../../../../domain/payments/entities/reminder.entity';

const gzip = promisify(zlib.gzip);

// ── Annexe J.2 — Column definitions ──────────────────────────────────
const EXPORT_COLUMNS = [
  'entry_id',
  'company_id',
  'journal_code',
  'entry_date',
  'document_ref',
  'account_debit',
  'account_credit',
  'amount_debit',
  'amount_credit',
  'currency',
  'customer_ref',
  'contract_ref',
  'provider_name',
  'provider_ref',
  'status_code',
  'preferred_debit_day',
  'debit_lot_code',
  'planned_debit_date',
  'risk_score',
  'risk_tier',
  'reminder_count',
] as const;

// ── Annexe J.6 — Accounting status mapping ───────────────────────────
interface AccountingEntry {
  entry_id: string;
  company_id: string;
  journal_code: string;
  entry_date: string;
  document_ref: string;
  account_debit: string;
  account_credit: string;
  amount_debit: number;
  amount_credit: number;
  currency: string;
  customer_ref: string;
  contract_ref: string;
  provider_name: string;
  provider_ref: string;
  status_code: string;
  preferred_debit_day: number | null;
  debit_lot_code: string | null;
  planned_debit_date: string | null;
  risk_score: number | null;
  risk_tier: string | null;
  reminder_count: number;
}

export interface ExportPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** JWT-like signed download token payload */
interface DownloadTokenPayload {
  jobId: string;
  companyId: string;
  exp: number;
}

const DOWNLOAD_TOKEN_EXPIRY_HOURS = 24;
const DOWNLOAD_TOKEN_SECRET = process.env.EXPORT_DOWNLOAD_SECRET || 'export-download-secret-key';

/**
 * ExportService — Asynchronous accounting export generation.
 *
 * CDC Annexe J: Generates CSV, XLSX (simplified), and JSON exports
 * of payment data with accounting mappings, compressed and hashed.
 *
 * Scheduled exports:
 *   - Daily at 06:00 (previous day)
 *   - Weekly Monday at 06:30 (previous week)
 *   - Monthly 1st at 07:00 (previous month)
 */
@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(ExportJobEntity)
    private readonly exportJobRepository: Repository<ExportJobEntity>,
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepository: Repository<PaymentIntentEntity>,
    @InjectRepository(RiskScoreEntity)
    private readonly riskScoreRepository: Repository<RiskScoreEntity>,
    @InjectRepository(RetryScheduleEntity)
    private readonly retryScheduleRepository: Repository<RetryScheduleEntity>,
    @InjectRepository(ReminderEntity)
    private readonly reminderRepository: Repository<ReminderEntity>,
  ) {}

  // ── CRUD operations ────────────────────────────────────────────────

  /**
   * Create a new export job and start async generation.
   */
  async createExportJob(params: {
    companyId: string;
    periodFrom: Date;
    periodTo: Date;
    format: ExportFormat;
    createdBy?: string;
  }): Promise<ExportJobEntity> {
    const job = this.exportJobRepository.create({
      companyId: params.companyId,
      periodFrom: params.periodFrom,
      periodTo: params.periodTo,
      format: params.format,
      status: ExportJobStatus.PENDING,
      createdBy: params.createdBy ?? null,
    });

    const saved = await this.exportJobRepository.save(job);

    // Fire & forget — don't block the caller
    this.generateExport(saved.id).catch((err) => {
      this.logger.error(
        `Export generation failed for job ${saved.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    return saved;
  }

  /**
   * Get a single export job by ID.
   */
  async getExportJob(jobId: string): Promise<ExportJobEntity | null> {
    return this.exportJobRepository.findOne({ where: { id: jobId } });
  }

  /**
   * List export jobs for a company with pagination.
   */
  async listExportJobs(
    companyId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<ExportPaginatedResult<ExportJobEntity>> {
    const [items, total] = await this.exportJobRepository.findAndCount({
      where: { companyId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Generate a signed download URL (JWT-like token) for an export job.
   * Token expires after 24h (CDC Annexe J.4).
   */
  async getDownloadUrl(jobId: string): Promise<{ url: string; expiresAt: Date }> {
    const job = await this.exportJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Export job ${jobId} not found`);
    }
    if (job.status !== ExportJobStatus.DONE) {
      throw new Error(`Export job ${jobId} is not complete (status: ${job.status})`);
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + DOWNLOAD_TOKEN_EXPIRY_HOURS);

    const payload: DownloadTokenPayload = {
      jobId: job.id,
      companyId: job.companyId,
      exp: expiresAt.getTime(),
    };

    // Sign the token with HMAC-SHA256
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', DOWNLOAD_TOKEN_SECRET)
      .update(payloadB64)
      .digest('base64url');

    const token = `${payloadB64}.${signature}`;
    const url = `/api/payments/exports/download?token=${token}`;

    return { url, expiresAt };
  }

  // ── Export generation ──────────────────────────────────────────────

  /**
   * Generate the export file for a job.
   * Queries payments, maps to accounting entries, formats, compresses, and hashes.
   */
  async generateExport(jobId: string): Promise<void> {
    const startTime = Date.now();

    const job = await this.exportJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Export job ${jobId} not found`);
    }

    // Mark as RUNNING
    job.status = ExportJobStatus.RUNNING;
    await this.exportJobRepository.save(job);

    try {
      // 1. Query payments for the period
      const payments = await this.paymentIntentRepository.find({
        where: {
          societeId: job.companyId,
          createdAt: Between(job.periodFrom, job.periodTo),
        },
        order: { createdAt: 'ASC' },
      });

      // 2. Enrich with risk scores and reminder counts
      const entries = await this.buildAccountingEntries(payments, job.companyId);

      // 3. Generate file content based on format
      let fileContent: Buffer;
      switch (job.format) {
        case ExportFormat.CSV:
          fileContent = this.generateCsv(entries);
          break;
        case ExportFormat.XLSX:
          fileContent = this.generateXlsx(entries);
          break;
        case ExportFormat.JSON:
          fileContent = this.generateJson(entries);
          break;
        default:
          throw new Error(`Unsupported format: ${job.format}`);
      }

      // 4. Compress with ZIP/gzip (CDC Annexe J.4)
      const compressed = await gzip(fileContent);

      // 5. Hash SHA-256 for integrity (CDC Annexe J.4)
      const hash = crypto.createHash('sha256').update(compressed).digest('hex');

      // 6. Generate file ID from hash (would normally store file to object storage)
      const fileId = hash.substring(0, 36).replace(
        /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
        '$1-$2-$3-$4-$5',
      );

      // 7. Update job as DONE
      job.status = ExportJobStatus.DONE;
      job.fileId = fileId;
      job.durationMs = Date.now() - startTime;
      await this.exportJobRepository.save(job);

      this.logger.log(
        `Export job ${jobId} completed: ${entries.length} entries, ${job.format}, ` +
        `${compressed.length} bytes compressed, duration ${job.durationMs}ms, hash ${hash.substring(0, 16)}...`,
      );
    } catch (error) {
      job.status = ExportJobStatus.FAILED;
      job.durationMs = Date.now() - startTime;
      await this.exportJobRepository.save(job);

      this.logger.error(
        `Export job ${jobId} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ── Accounting entry mapping (Annexe J.6) ──────────────────────────

  /**
   * Build accounting entries from payment intents.
   * Maps payment statuses to accounting journal entries per Annexe J.6.
   */
  private async buildAccountingEntries(
    payments: PaymentIntentEntity[],
    companyId: string,
  ): Promise<AccountingEntry[]> {
    const entries: AccountingEntry[] = [];

    // Batch-load risk scores for all payments
    const paymentIds = payments.map((p) => p.id);
    const riskScores = paymentIds.length > 0
      ? await this.riskScoreRepository
          .createQueryBuilder('rs')
          .where('rs.payment_id IN (:...ids)', { ids: paymentIds })
          .getMany()
      : [];
    const riskScoreMap = new Map(riskScores.map((rs) => [rs.paymentId, rs]));

    // Batch-load reminder counts per payment (through retry_schedule → reminder)
    const reminderCounts = paymentIds.length > 0
      ? await this.retryScheduleRepository
          .createQueryBuilder('rs')
          .innerJoin(ReminderEntity, 'r', 'r.retry_schedule_id = rs.id')
          .select('rs.original_payment_id', 'paymentId')
          .addSelect('COUNT(r.id)', 'count')
          .where('rs.original_payment_id IN (:...ids)', { ids: paymentIds })
          .groupBy('rs.original_payment_id')
          .getRawMany<{ paymentId: string; count: string }>()
      : [];
    const reminderCountMap = new Map(
      reminderCounts.map((r) => [r.paymentId, parseInt(r.count, 10)]),
    );

    let entryIndex = 0;

    for (const payment of payments) {
      const riskScore = riskScoreMap.get(payment.id);
      const reminderCount = reminderCountMap.get(payment.id) ?? 0;

      const baseEntry = {
        company_id: companyId,
        entry_date: payment.createdAt.toISOString().split('T')[0],
        document_ref: payment.providerPaymentId ?? payment.id,
        currency: payment.currency,
        customer_ref: payment.clientId ?? '',
        contract_ref: payment.factureId ?? '',
        provider_name: payment.provider ?? '',
        provider_ref: payment.providerPaymentId ?? '',
        status_code: this.mapStatusCode(payment.status),
        preferred_debit_day: null as number | null,
        debit_lot_code: null as string | null,
        planned_debit_date: null as string | null,
        risk_score: riskScore?.score ?? null,
        risk_tier: riskScore?.riskTier ?? null,
        reminder_count: reminderCount,
      };

      // Generate accounting entries based on payment status (Annexe J.6)
      const mappedEntries = this.mapPaymentToAccountingEntries(
        payment,
        baseEntry,
        entryIndex,
      );

      entries.push(...mappedEntries);
      entryIndex += mappedEntries.length;
    }

    return entries;
  }

  /**
   * Map a single payment to one or more accounting entries (Annexe J.6):
   *   - PAID → debit BAN (512), credit CLIENT (411)
   *   - REJECT_INSUFF → reverse entry (contre-passation)
   *   - REFUNDED → debit CLIENT (411), credit BAN (512)
   *   - Others → no accounting entry
   */
  private mapPaymentToAccountingEntries(
    payment: PaymentIntentEntity,
    baseEntry: Omit<AccountingEntry, 'entry_id' | 'journal_code' | 'account_debit' | 'account_credit' | 'amount_debit' | 'amount_credit'>,
    startIndex: number,
  ): AccountingEntry[] {
    const amount = Number(payment.amount);
    const entries: AccountingEntry[] = [];

    switch (payment.status) {
      // PAID → Encaissement validé: debit BAN, credit CLIENT
      case PaymentIntentStatus.SUCCEEDED: {
        entries.push({
          ...baseEntry,
          entry_id: `E${String(startIndex + 1).padStart(6, '0')}`,
          journal_code: 'BAN',
          account_debit: '512000',  // Banque
          account_credit: '411000', // Clients
          amount_debit: amount,
          amount_credit: amount,
        });
        break;
      }

      // REJECT (FAILED) → Contre-passation
      case PaymentIntentStatus.FAILED: {
        entries.push({
          ...baseEntry,
          entry_id: `E${String(startIndex + 1).padStart(6, '0')}`,
          journal_code: 'BAN',
          account_debit: '411000',  // Clients (reverse)
          account_credit: '512000', // Banque (reverse)
          amount_debit: amount,
          amount_credit: amount,
        });
        break;
      }

      // REFUNDED → Sortie trésorerie
      case PaymentIntentStatus.REFUNDED:
      case PaymentIntentStatus.PARTIALLY_REFUNDED: {
        const refundAmount = Number(payment.refundedAmount) || amount;
        entries.push({
          ...baseEntry,
          entry_id: `E${String(startIndex + 1).padStart(6, '0')}`,
          journal_code: 'BAN',
          account_debit: '411000',  // Clients
          account_credit: '512000', // Banque
          amount_debit: refundAmount,
          amount_credit: refundAmount,
        });
        break;
      }

      // CANCELLED, PENDING, PROCESSING → No accounting entry
      default:
        break;
    }

    return entries;
  }

  /**
   * Map PaymentIntentStatus to export status_code.
   */
  private mapStatusCode(status: PaymentIntentStatus): string {
    switch (status) {
      case PaymentIntentStatus.SUCCEEDED:
        return 'PAID';
      case PaymentIntentStatus.FAILED:
        return 'REJECT_INSUFF_FUNDS';
      case PaymentIntentStatus.REFUNDED:
      case PaymentIntentStatus.PARTIALLY_REFUNDED:
        return 'REFUNDED';
      case PaymentIntentStatus.CANCELLED:
        return 'CANCELLED';
      case PaymentIntentStatus.PENDING:
      case PaymentIntentStatus.PROCESSING:
        return 'PENDING';
      default:
        return 'UNKNOWN';
    }
  }

  // ── Format generators ──────────────────────────────────────────────

  /**
   * Generate CSV with separator `;`, UTF-8 BOM, header included (Annexe J.1).
   */
  private generateCsv(entries: AccountingEntry[]): Buffer {
    const BOM = '\uFEFF';
    const header = EXPORT_COLUMNS.join(';');
    const rows = entries.map((entry) =>
      EXPORT_COLUMNS.map((col) => {
        const value = entry[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(';')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(';'),
    );

    const content = BOM + [header, ...rows].join('\r\n');
    return Buffer.from(content, 'utf-8');
  }

  /**
   * Generate simplified XLSX as tab-separated CSV with .xlsx hint.
   * Avoids heavy XLSX libraries per MUST NOT constraints.
   * In production, this would use a streaming XLSX writer.
   */
  private generateXlsx(entries: AccountingEntry[]): Buffer {
    // Simplified: generate tab-separated values that Excel can open
    const header = EXPORT_COLUMNS.join('\t');
    const rows = entries.map((entry) =>
      EXPORT_COLUMNS.map((col) => {
        const value = entry[col];
        if (value === null || value === undefined) return '';
        return String(value);
      }).join('\t'),
    );

    const content = [header, ...rows].join('\r\n');
    return Buffer.from(content, 'utf-8');
  }

  /**
   * Generate JSON export — structured array (Annexe J.1).
   */
  private generateJson(entries: AccountingEntry[]): Buffer {
    const content = JSON.stringify(entries, null, 2);
    return Buffer.from(content, 'utf-8');
  }

  // ── Scheduled exports (Annexe J.3) ─────────────────────────────────

  /**
   * Daily export at 06:00 — generates export for the previous day.
   */
  @Cron('0 6 * * *')
  async handleDailyExport(): Promise<void> {
    this.logger.log('Starting scheduled daily export...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      // Get all active companies (simplified: get distinct companyIds from recent payments)
      const companies = await this.paymentIntentRepository
        .createQueryBuilder('pi')
        .select('DISTINCT pi.societe_id', 'companyId')
        .where('pi.created_at >= :from', { from: yesterday })
        .andWhere('pi.created_at <= :to', { to: endOfYesterday })
        .getRawMany<{ companyId: string }>();

      for (const { companyId } of companies) {
        await this.createExportJob({
          companyId,
          periodFrom: yesterday,
          periodTo: endOfYesterday,
          format: ExportFormat.CSV,
          createdBy: 'SYSTEM_DAILY',
        });
      }

      this.logger.log(`Daily export: created ${companies.length} export jobs.`);
    } catch (error) {
      this.logger.error(
        `Daily export failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Weekly export at Monday 06:30 — generates export for the previous week.
   */
  @Cron('30 6 * * 1')
  async handleWeeklyExport(): Promise<void> {
    this.logger.log('Starting scheduled weekly export...');

    try {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const endOfLastWeek = new Date(now);
      endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
      endOfLastWeek.setHours(23, 59, 59, 999);

      const companies = await this.paymentIntentRepository
        .createQueryBuilder('pi')
        .select('DISTINCT pi.societe_id', 'companyId')
        .where('pi.created_at >= :from', { from: weekAgo })
        .andWhere('pi.created_at <= :to', { to: endOfLastWeek })
        .getRawMany<{ companyId: string }>();

      for (const { companyId } of companies) {
        await this.createExportJob({
          companyId,
          periodFrom: weekAgo,
          periodTo: endOfLastWeek,
          format: ExportFormat.CSV,
          createdBy: 'SYSTEM_WEEKLY',
        });
      }

      this.logger.log(`Weekly export: created ${companies.length} export jobs.`);
    } catch (error) {
      this.logger.error(
        `Weekly export failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Monthly export on the 1st at 07:00 — generates export for the previous month.
   */
  @Cron('0 7 1 * *')
  async handleMonthlyExport(): Promise<void> {
    this.logger.log('Starting scheduled monthly export...');

    try {
      const now = new Date();
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      const companies = await this.paymentIntentRepository
        .createQueryBuilder('pi')
        .select('DISTINCT pi.societe_id', 'companyId')
        .where('pi.created_at >= :from', { from: firstOfLastMonth })
        .andWhere('pi.created_at <= :to', { to: lastOfLastMonth })
        .getRawMany<{ companyId: string }>();

      for (const { companyId } of companies) {
        await this.createExportJob({
          companyId,
          periodFrom: firstOfLastMonth,
          periodTo: lastOfLastMonth,
          format: ExportFormat.CSV,
          createdBy: 'SYSTEM_MONTHLY',
        });
      }

      this.logger.log(`Monthly export: created ${companies.length} export jobs.`);
    } catch (error) {
      this.logger.error(
        `Monthly export failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

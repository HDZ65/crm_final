import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';

import {
  PaymentIntentEntity,
  PaymentIntentStatus,
} from '../entities/payment-intent.entity';
import { RetryScheduleEntity } from '../entities/retry-schedule.entity';
import { ReminderEntity } from '../entities/reminder.entity';
import { ExportConfigEntity } from '../entities/export-config.entity';
import { CompteComptableEntity } from '../entities/compte-comptable.entity';
import {
  FecEntry,
  FEC_COLUMNS,
  FEC_SEPARATOR,
  JournalType,
  JournalConfig,
  DEFAULT_JOURNAL_CONFIGS,
} from '../value-objects/fec-entry';
import { DEFAULT_ACCOUNT_MAPPINGS } from '../value-objects/account-mapping';

export type JournalExportFormat = 'csv' | 'fec';

/** Aging bucket labels for overdue analysis */
export enum AgingBucket {
  BUCKET_0_30 = '0-30j',
  BUCKET_31_60 = '31-60j',
  BUCKET_61_90 = '61-90j',
  BUCKET_OVER_90 = '>90j',
}

export interface AgingSummary {
  bucket: AgingBucket;
  count: number;
  totalAmount: number;
}

/**
 * JournalImpayesService — Génération du Journal des Impayés (FEC)
 *
 * Écritures comptables pour chaque paiement en échec (FAILED) + relances :
 *   - Débit 416000 (Clients douteux) pour le montant impayé
 *   - Crédit 411000 (Clients) pour le même montant
 *
 * Inclut une analyse par tranche d'ancienneté (aging) :
 *   - 0-30 jours, 31-60 jours, 61-90 jours, >90 jours
 *
 * Supporte la configuration par société (ExportConfig) et le mapping
 * dynamique des comptes comptables (CompteComptable).
 */
@Injectable()
export class JournalImpayesService {
  private readonly logger = new Logger(JournalImpayesService.name);
  private readonly defaultConfig = DEFAULT_JOURNAL_CONFIGS[JournalType.IMPAYES];

  constructor(
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepository: Repository<PaymentIntentEntity>,
    @InjectRepository(RetryScheduleEntity)
    private readonly retryScheduleRepository: Repository<RetryScheduleEntity>,
    @InjectRepository(ReminderEntity)
    private readonly reminderRepository: Repository<ReminderEntity>,
    @InjectRepository(ExportConfigEntity)
    private readonly exportConfigRepository: Repository<ExportConfigEntity>,
    @InjectRepository(CompteComptableEntity)
    private readonly compteComptableRepository: Repository<CompteComptableEntity>,
  ) {}

  /**
   * Generate the Journal des Impayés export for a given period.
   * Includes FAILED payments with reminder counts and aging analysis.
   * @returns Buffer containing the formatted export data
   */
  async generateJournalImpayes(
    societeId: string,
    periodFrom: Date,
    periodTo: Date,
    format: JournalExportFormat = 'csv',
  ): Promise<Buffer> {
    this.logger.log(
      `Generating Journal des Impayés for societe=${societeId} ` +
      `from=${periodFrom.toISOString()} to=${periodTo.toISOString()} format=${format}`,
    );

    // Load per-subsidiary config (fallback to defaults)
    const config = await this.loadJournalConfig(societeId);
    const accountMap = await this.loadAccountMap(societeId);

    // 1. Get all FAILED payments in the period
    const failedPayments = await this.paymentIntentRepository.find({
      where: {
        societeId,
        status: PaymentIntentStatus.FAILED,
        createdAt: Between(periodFrom, periodTo),
      },
      order: { createdAt: 'ASC' },
    });

    // 2. Batch-load reminder counts per payment (via retry_schedule)
    const reminderCountMap = await this.loadReminderCounts(
      failedPayments.map((p) => p.id),
    );

    // 3. Build FEC entries with aging analysis
    const now = new Date();
    const entries = this.buildFecEntries(failedPayments, reminderCountMap, now, config, accountMap);

    // 4. Log aging summary
    const agingSummary = this.computeAgingSummary(failedPayments, now);
    for (const bucket of agingSummary) {
      this.logger.log(
        `  Aging ${bucket.bucket}: ${bucket.count} impayés, ` +
        `total=${bucket.totalAmount.toFixed(2)} EUR`,
      );
    }

    this.logger.log(
      `Journal des Impayés: ${failedPayments.length} impayés → ${entries.length} écritures`,
    );

    return this.formatOutput(entries, format);
  }

  // ── Config loading ─────────────────────────────────────────────────

  /**
   * Load per-subsidiary journal config, fallback to DEFAULT_JOURNAL_CONFIGS.
   */
  private async loadJournalConfig(societeId: string): Promise<JournalConfig> {
    const exportConfig = await this.exportConfigRepository.findOne({
      where: { societeId },
    });

    if (exportConfig) {
      return {
        code: exportConfig.journalImpayesCode,
        libelle: this.defaultConfig.libelle,
        compte_debit_defaut: this.defaultConfig.compte_debit_defaut,
        compte_credit_defaut: this.defaultConfig.compte_credit_defaut,
      };
    }

    return this.defaultConfig;
  }

  /**
   * Load dynamic account mappings: subsidiary-specific first, then global defaults.
   */
  private async loadAccountMap(
    societeId: string,
  ): Promise<Map<string, string>> {
    const accounts = await this.compteComptableRepository.find({
      where: [
        { societeId, actif: true },
        { societeId: IsNull(), actif: true },
      ],
      order: { societeId: { direction: 'ASC', nulls: 'LAST' } },
    });

    const map = new Map<string, string>();
    // First load global defaults (societeId = null)
    for (const account of accounts) {
      if (account.societeId === null) {
        map.set(account.numero, account.libelle);
      }
    }
    // Then override with subsidiary-specific
    for (const account of accounts) {
      if (account.societeId !== null) {
        map.set(account.numero, account.libelle);
      }
    }

    // If no DB records found, fallback to DEFAULT_ACCOUNT_MAPPINGS
    if (map.size === 0) {
      for (const mapping of DEFAULT_ACCOUNT_MAPPINGS) {
        map.set(mapping.numero_compte, mapping.libelle_compte);
      }
    }

    return map;
  }

  // ── Reminder loading ───────────────────────────────────────────────

  /**
   * Load reminder counts per payment via retry_schedule → reminder join.
   */
  private async loadReminderCounts(
    paymentIds: string[],
  ): Promise<Map<string, number>> {
    if (paymentIds.length === 0) {
      return new Map();
    }

    const results = await this.retryScheduleRepository
      .createQueryBuilder('rs')
      .innerJoin(ReminderEntity, 'r', 'r.retry_schedule_id = rs.id')
      .select('rs.original_payment_id', 'paymentId')
      .addSelect('COUNT(r.id)', 'count')
      .where('rs.original_payment_id IN (:...ids)', { ids: paymentIds })
      .groupBy('rs.original_payment_id')
      .getRawMany<{ paymentId: string; count: string }>();

    return new Map(
      results.map((r) => [r.paymentId, parseInt(r.count, 10)]),
    );
  }

  // ── FEC entry mapping ──────────────────────────────────────────────

  private buildFecEntries(
    payments: PaymentIntentEntity[],
    reminderCountMap: Map<string, number>,
    referenceDate: Date,
    config: JournalConfig,
    accountMap: Map<string, string>,
  ): FecEntry[] {
    const entries: FecEntry[] = [];
    let ecritureNum = 1;

    const accountDouteux = accountMap.get('416000') ?? '416000';
    const accountClient = accountMap.get('411000') ?? '411000';

    for (const payment of payments) {
      const amount = Number(payment.amount);
      const dateStr = this.formatFecDate(payment.createdAt);
      const ecritureNumStr = String(ecritureNum).padStart(6, '0');
      const pieceRef = payment.providerPaymentId ?? payment.id;
      const reminderCount = reminderCountMap.get(payment.id) ?? 0;
      const agingBucket = this.getAgingBucket(payment.createdAt, referenceDate);
      const agingLabel = `[${agingBucket}]`;
      const relanceLabel = reminderCount > 0
        ? ` - ${reminderCount} relance${reminderCount > 1 ? 's' : ''}`
        : '';

      // Entry 1: Débit 416000 (Clients douteux)
      entries.push({
        JournalCode: config.code,
        JournalLib: config.libelle,
        EcritureNum: ecritureNumStr,
        EcritureDate: dateStr,
        CompteNum: config.compte_debit_defaut,
        CompteLib: accountDouteux,
        CompAuxNum: payment.clientId ?? '',
        CompAuxLib: '',
        PieceRef: pieceRef,
        PieceDate: dateStr,
        EcritureLib: `Impayé ${pieceRef} ${agingLabel}${relanceLabel}`,
        Debit: amount.toFixed(2),
        Credit: '',
        EcritureLet: '',
        DateLet: '',
        ValidDate: dateStr,
        Montantdevise: payment.currency !== 'EUR' ? amount.toFixed(2) : '',
        Idevise: payment.currency,
      });

      // Entry 2: Crédit 411000 (Clients)
      entries.push({
        JournalCode: config.code,
        JournalLib: config.libelle,
        EcritureNum: ecritureNumStr,
        EcritureDate: dateStr,
        CompteNum: config.compte_credit_defaut,
        CompteLib: accountClient,
        CompAuxNum: payment.clientId ?? '',
        CompAuxLib: '',
        PieceRef: pieceRef,
        PieceDate: dateStr,
        EcritureLib: `Impayé ${pieceRef} ${agingLabel}${relanceLabel}`,
        Debit: '',
        Credit: amount.toFixed(2),
        EcritureLet: '',
        DateLet: '',
        ValidDate: dateStr,
        Montantdevise: payment.currency !== 'EUR' ? amount.toFixed(2) : '',
        Idevise: payment.currency,
      });

      ecritureNum++;
    }

    return entries;
  }

  // ── Aging analysis ─────────────────────────────────────────────────

  /**
   * Compute aging summary by bucket for all failed payments.
   */
  computeAgingSummary(
    payments: PaymentIntentEntity[],
    referenceDate: Date = new Date(),
  ): AgingSummary[] {
    const buckets = new Map<AgingBucket, { count: number; totalAmount: number }>([
      [AgingBucket.BUCKET_0_30, { count: 0, totalAmount: 0 }],
      [AgingBucket.BUCKET_31_60, { count: 0, totalAmount: 0 }],
      [AgingBucket.BUCKET_61_90, { count: 0, totalAmount: 0 }],
      [AgingBucket.BUCKET_OVER_90, { count: 0, totalAmount: 0 }],
    ]);

    for (const payment of payments) {
      const bucket = this.getAgingBucket(payment.createdAt, referenceDate);
      const entry = buckets.get(bucket);
      if (entry) {
        entry.count++;
        entry.totalAmount += Number(payment.amount);
      }
    }

    return Array.from(buckets.entries()).map(([bucket, data]) => ({
      bucket,
      count: data.count,
      totalAmount: Math.round(data.totalAmount * 100) / 100,
    }));
  }

  /**
   * Determine aging bucket based on days between payment date and reference date.
   */
  private getAgingBucket(paymentDate: Date, referenceDate: Date): AgingBucket {
    const diffMs = referenceDate.getTime() - new Date(paymentDate).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) return AgingBucket.BUCKET_0_30;
    if (diffDays <= 60) return AgingBucket.BUCKET_31_60;
    if (diffDays <= 90) return AgingBucket.BUCKET_61_90;
    return AgingBucket.BUCKET_OVER_90;
  }

  // ── Format helpers ─────────────────────────────────────────────────

  private formatOutput(entries: FecEntry[], format: JournalExportFormat): Buffer {
    if (format === 'fec') {
      return this.formatFec(entries);
    }
    return this.formatCsv(entries);
  }

  /**
   * FEC format: tab separator, no BOM, windows-1252 encoding (latin1 approximation).
   */
  private formatFec(entries: FecEntry[]): Buffer {
    const header = FEC_COLUMNS.join(FEC_SEPARATOR);
    const rows = entries.map((entry) =>
      FEC_COLUMNS.map((col) => entry[col]).join(FEC_SEPARATOR),
    );
    const content = [header, ...rows].join('\r\n');
    return Buffer.from(content, 'latin1');
  }

  /**
   * CSV format: UTF-8 BOM + semicolon separator, header row.
   */
  private formatCsv(entries: FecEntry[]): Buffer {
    const BOM = '\uFEFF';
    const header = FEC_COLUMNS.join(';');
    const rows = entries.map((entry) =>
      FEC_COLUMNS.map((col) => {
        const value = entry[col];
        if (typeof value === 'string' && value.includes(';')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(';'),
    );
    const content = BOM + [header, ...rows].join('\r\n');
    return Buffer.from(content, 'utf-8');
  }

  // ── Utility ────────────────────────────────────────────────────────

  private formatFecDate(date: Date): string {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';

import {
  PaymentIntentEntity,
  PaymentIntentStatus,
} from '../entities/payment-intent.entity';
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

/**
 * JournalReglementsService — Génération du Journal des Règlements (FEC)
 *
 * Écritures comptables pour chaque paiement réussi (SUCCEEDED) :
 *   - Débit 512000 (Banque) pour le montant encaissé
 *   - Crédit 411000 (Clients) pour le même montant
 *
 * Supporte la configuration par société (ExportConfig) et le mapping
 * dynamique des comptes comptables (CompteComptable).
 */
@Injectable()
export class JournalReglementsService {
  private readonly logger = new Logger(JournalReglementsService.name);
  private readonly defaultConfig = DEFAULT_JOURNAL_CONFIGS[JournalType.REGLEMENTS];

  constructor(
    @InjectRepository(PaymentIntentEntity)
    private readonly paymentIntentRepository: Repository<PaymentIntentEntity>,
    @InjectRepository(ExportConfigEntity)
    private readonly exportConfigRepository: Repository<ExportConfigEntity>,
    @InjectRepository(CompteComptableEntity)
    private readonly compteComptableRepository: Repository<CompteComptableEntity>,
  ) {}

  /**
   * Generate the Journal des Règlements export for a given period.
   * Only includes payments with status SUCCEEDED.
   * @returns Buffer containing the formatted export data
   */
  async generateJournalReglements(
    societeId: string,
    periodFrom: Date,
    periodTo: Date,
    format: JournalExportFormat = 'csv',
  ): Promise<Buffer> {
    this.logger.log(
      `Generating Journal des Règlements for societe=${societeId} ` +
      `from=${periodFrom.toISOString()} to=${periodTo.toISOString()} format=${format}`,
    );

    // Load per-subsidiary config (fallback to defaults)
    const config = await this.loadJournalConfig(societeId);
    const accountMap = await this.loadAccountMap(societeId);

    const payments = await this.paymentIntentRepository.find({
      where: {
        societeId,
        status: PaymentIntentStatus.SUCCEEDED,
        createdAt: Between(periodFrom, periodTo),
      },
      order: { createdAt: 'ASC' },
    });

    const entries = this.buildFecEntries(payments, config, accountMap);

    this.logger.log(
      `Journal des Règlements: ${payments.length} paiements → ${entries.length} écritures`,
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
        code: exportConfig.journalReglementCode,
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

  // ── FEC entry mapping ──────────────────────────────────────────────

  private buildFecEntries(
    payments: PaymentIntentEntity[],
    config: JournalConfig,
    accountMap: Map<string, string>,
  ): FecEntry[] {
    const entries: FecEntry[] = [];
    let ecritureNum = 1;

    const accountBanque = accountMap.get('512000') ?? '512000';
    const accountClient = accountMap.get('411000') ?? '411000';

    for (const payment of payments) {
      const amount = Number(payment.amount);
      const dateStr = this.formatFecDate(payment.createdAt);
      const paidDateStr = payment.paidAt
        ? this.formatFecDate(payment.paidAt)
        : dateStr;
      const ecritureNumStr = String(ecritureNum).padStart(6, '0');
      const pieceRef = payment.providerPaymentId ?? payment.id;

      // Entry 1: Débit 512000 (Banque)
      entries.push({
        JournalCode: config.code,
        JournalLib: config.libelle,
        EcritureNum: ecritureNumStr,
        EcritureDate: paidDateStr,
        CompteNum: config.compte_debit_defaut,
        CompteLib: accountBanque,
        CompAuxNum: '',
        CompAuxLib: '',
        PieceRef: pieceRef,
        PieceDate: paidDateStr,
        EcritureLib: `Règlement ${pieceRef}`,
        Debit: amount.toFixed(2),
        Credit: '',
        EcritureLet: '',
        DateLet: '',
        ValidDate: paidDateStr,
        Montantdevise: payment.currency !== 'EUR' ? amount.toFixed(2) : '',
        Idevise: payment.currency,
      });

      // Entry 2: Crédit 411000 (Clients)
      entries.push({
        JournalCode: config.code,
        JournalLib: config.libelle,
        EcritureNum: ecritureNumStr,
        EcritureDate: paidDateStr,
        CompteNum: config.compte_credit_defaut,
        CompteLib: accountClient,
        CompAuxNum: payment.clientId ?? '',
        CompAuxLib: '',
        PieceRef: pieceRef,
        PieceDate: paidDateStr,
        EcritureLib: `Règlement ${pieceRef}`,
        Debit: '',
        Credit: amount.toFixed(2),
        EcritureLet: '',
        DateLet: '',
        ValidDate: paidDateStr,
        Montantdevise: payment.currency !== 'EUR' ? amount.toFixed(2) : '',
        Idevise: payment.currency,
      });

      ecritureNum++;
    }

    return entries;
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

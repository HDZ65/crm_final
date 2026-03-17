import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';

import { FactureEntity } from '../../factures/entities/facture.entity';
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
 * JournalVentesService — Génération du Journal des Ventes (FEC)
 *
 * Écritures comptables pour chaque facture émise :
 *   - Débit 411000 (Clients) pour le montant TTC
 *   - Crédit 706000 (Prestations de services) pour le montant HT
 *   - Crédit 445710 (TVA collectée) pour la TVA
 *
 * Supporte la configuration par société (ExportConfig) et le mapping
 * dynamique des comptes comptables (CompteComptable).
 */
@Injectable()
export class JournalVentesService {
  private readonly logger = new Logger(JournalVentesService.name);
  private readonly defaultConfig = DEFAULT_JOURNAL_CONFIGS[JournalType.VENTES];

  constructor(
    @InjectRepository(FactureEntity)
    private readonly factureRepository: Repository<FactureEntity>,
    @InjectRepository(ExportConfigEntity)
    private readonly exportConfigRepository: Repository<ExportConfigEntity>,
    @InjectRepository(CompteComptableEntity)
    private readonly compteComptableRepository: Repository<CompteComptableEntity>,
  ) {}

  /**
   * Generate the Journal des Ventes export for a given period.
   * @returns Buffer containing the formatted export data
   */
  async generateJournalVentes(
    societeId: string,
    periodFrom: Date,
    periodTo: Date,
    format: JournalExportFormat = 'csv',
  ): Promise<Buffer> {
    this.logger.log(
      `Generating Journal des Ventes for societe=${societeId} ` +
      `from=${periodFrom.toISOString()} to=${periodTo.toISOString()} format=${format}`,
    );

    // Load per-subsidiary config (fallback to defaults)
    const config = await this.loadJournalConfig(societeId);
    const accountMap = await this.loadAccountMap(societeId);

    const factures = await this.factureRepository.find({
      where: {
        organisationId: societeId,
        dateEmission: Between(periodFrom, periodTo),
      },
      order: { dateEmission: 'ASC', numero: 'ASC' },
    });

    const entries = this.buildFecEntries(factures, config, accountMap);

    this.logger.log(
      `Journal des Ventes: ${factures.length} factures → ${entries.length} écritures`,
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
        code: exportConfig.journalVenteCode,
        libelle: this.defaultConfig.libelle,
        compte_debit_defaut: this.defaultConfig.compte_debit_defaut,
        compte_credit_defaut: this.defaultConfig.compte_credit_defaut,
        compte_tva: this.defaultConfig.compte_tva,
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

    // Build map: subsidiary-specific entries override global defaults
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
    factures: FactureEntity[],
    config: JournalConfig,
    accountMap: Map<string, string>,
  ): FecEntry[] {
    const entries: FecEntry[] = [];
    let ecritureNum = 1;

    const accountClient = accountMap.get('411000') ?? '411000';
    const accountRevenu = accountMap.get('706000') ?? '706000';
    const accountTva = accountMap.get('445710') ?? '445710';

    for (const facture of factures) {
      const montantHT = Number(facture.montantHT);
      const montantTTC = Number(facture.montantTTC);
      const montantTVA = Math.round((montantTTC - montantHT) * 100) / 100;
      const dateStr = this.formatFecDate(facture.dateEmission);
      const pieceRef = facture.numero ?? facture.id;
      const ecritureNumStr = String(ecritureNum).padStart(6, '0');

      // Entry 1: Débit 411000 (Clients) — montant TTC
      entries.push({
        JournalCode: config.code,
        JournalLib: config.libelle,
        EcritureNum: ecritureNumStr,
        EcritureDate: dateStr,
        CompteNum: config.compte_debit_defaut,
        CompteLib: accountClient,
        CompAuxNum: facture.clientBaseId ?? '',
        CompAuxLib: '',
        PieceRef: pieceRef,
        PieceDate: dateStr,
        EcritureLib: `Facture ${pieceRef}`,
        Debit: montantTTC.toFixed(2),
        Credit: '',
        EcritureLet: '',
        DateLet: '',
        ValidDate: dateStr,
        Montantdevise: '',
        Idevise: 'EUR',
      });

      // Entry 2: Crédit 706000 (Prestations) — montant HT
      entries.push({
        JournalCode: config.code,
        JournalLib: config.libelle,
        EcritureNum: ecritureNumStr,
        EcritureDate: dateStr,
        CompteNum: config.compte_credit_defaut,
        CompteLib: accountRevenu,
        CompAuxNum: '',
        CompAuxLib: '',
        PieceRef: pieceRef,
        PieceDate: dateStr,
        EcritureLib: `Facture ${pieceRef}`,
        Debit: '',
        Credit: montantHT.toFixed(2),
        EcritureLet: '',
        DateLet: '',
        ValidDate: dateStr,
        Montantdevise: '',
        Idevise: 'EUR',
      });

      // Entry 3: Crédit 445710 (TVA collectée) — montant TVA (si > 0)
      if (montantTVA > 0 && config.compte_tva) {
        entries.push({
          JournalCode: config.code,
          JournalLib: config.libelle,
          EcritureNum: ecritureNumStr,
          EcritureDate: dateStr,
          CompteNum: config.compte_tva,
          CompteLib: accountTva,
          CompAuxNum: '',
          CompAuxLib: '',
          PieceRef: pieceRef,
          PieceDate: dateStr,
          EcritureLib: `TVA Facture ${pieceRef}`,
          Debit: '',
          Credit: montantTVA.toFixed(2),
          EcritureLet: '',
          DateLet: '',
          ValidDate: dateStr,
          Montantdevise: '',
          Idevise: 'EUR',
        });
      }

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

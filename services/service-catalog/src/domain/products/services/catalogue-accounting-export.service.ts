/* eslint-disable @typescript-eslint/no-require-imports */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AccountingExportFormat, AccountingExportLogEntity } from '../entities/accounting-export-log.entity';
import { ProductAccountingMappingEntity } from '../entities/product-accounting-mapping.entity';
import { AccountingNature } from '../enums/accounting-nature.enum';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccountingExportRow {
  date_operation: string; // DD/MM/YYYY
  societe: string;
  produit: string; // SKU
  partenaire: string; // '' si produit interne
  type_ecriture: 'CA' | 'Commission' | 'Frais' | 'TVA';
  compte_comptable: string;
  journal: string;
  centre_couts: string;
  debit: number;
  credit: number;
  tva: number;
  taux_tva: string; // '20%', '10%', '5,5%', '0%'
  reference_contrat: string;
  reference_client: string;
}

export interface GenerateExportParams {
  keycloak_group_id: string;
  company_name: string;
  period: string; // YYYY-MM
  format: 'csv' | 'xlsx';
  type_filter?: Array<'CA' | 'Commission' | 'Frais' | 'TVA'>;
  generated_by?: string;
}

export interface ExportResult {
  filename: string;
  buffer: Buffer;
  mime: string;
  rowCount: number;
  fileHash: string;
  logId: string;
}

// ---------------------------------------------------------------------------
// Default accounts by nature
// ---------------------------------------------------------------------------

const DEFAULT_ACCOUNTS: Record<AccountingNature, { glAccount: string; journal: string; costCenter: string }> = {
  [AccountingNature.REVENUE]: { glAccount: '706000', journal: 'VENTE', costCenter: '' },
  [AccountingNature.COMMISSION]: { glAccount: '756000', journal: 'VENTE', costCenter: '' },
  [AccountingNature.FEE]: { glAccount: '628000', journal: 'ACHAT', costCenter: '' },
  [AccountingNature.TAX]: { glAccount: '445700', journal: 'VENTE', costCenter: '' },
};

// Raw DB row returned by the bordereaux query
interface LigneBordereauRow {
  type_ligne: string;
  montant_brut: string;
  montant_reprise: string;
  montant_net: string;
  taux_applique: string | null;
  contrat_id: string;
  contrat_reference: string;
  client_nom: string | null;
  produit_nom: string | null;
  sku: string | null;
  partenaire_nom: string | null;
  revenue_model: string | null;
  produit_version_id: string | null;
  societe_nom: string;
  periode: string;
  bordereau_date: Date | null;
}

// CdC CSV column header labels (Annexe F)
const CSV_HEADERS = [
  'Date opération',
  'Société',
  'Produit',
  'Partenaire',
  'Type écriture',
  'Compte comptable',
  'Journal',
  'Centre de coûts',
  'Débit',
  'Crédit',
  'TVA',
  'Taux TVA',
  'Référence contrat',
  'Référence client',
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class CatalogueAccountingExportService {
  private readonly logger = new Logger(CatalogueAccountingExportService.name);

  constructor(
    @InjectRepository(AccountingExportLogEntity)
    private readonly exportLogRepo: Repository<AccountingExportLogEntity>,
    @InjectRepository(ProductAccountingMappingEntity)
    private readonly accountingMappingRepo: Repository<ProductAccountingMappingEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async generateExport(params: GenerateExportParams): Promise<ExportResult> {
    const rows = await this.buildRows(params);
    const filtered = params.type_filter?.length
      ? rows.filter((r) => params.type_filter?.includes(r.type_ecriture))
      : rows;

    let result: ExportResult;
    if (params.format === 'xlsx') {
      result = await this.buildXlsx(filtered, params);
    } else {
      result = this.buildCsv(filtered, params);
    }

    // Persist to log + optional storage
    const logId = await this.persistLog(params, result);
    return { ...result, logId };
  }

  async listExports(keycloakGroupId: string, periodFrom?: string, periodTo?: string) {
    const qb = this.exportLogRepo
      .createQueryBuilder('el')
      .where('el.keycloak_group_id = :org', { org: keycloakGroupId })
      .orderBy('el.generated_at', 'DESC');

    if (periodFrom) qb.andWhere('el.period >= :from', { from: periodFrom });
    if (periodTo) qb.andWhere('el.period <= :to', { to: periodTo });

    return qb.getMany();
  }

  async getExportLog(id: string): Promise<AccountingExportLogEntity | null> {
    return this.exportLogRepo.findOne({ where: { id } });
  }

  // -------------------------------------------------------------------------
  // Account resolution
  // -------------------------------------------------------------------------

  async resolveAccount(
    productVersionId: string,
    companyId: string,
    nature: AccountingNature,
  ): Promise<{ glAccount: string; journal: string; costCenter: string }> {
    const mapping = await this.accountingMappingRepo.findOne({
      where: { productVersionId, companyId, nature },
    });

    if (!mapping) {
      this.logger.warn(
        `No accounting mapping for version=${productVersionId} company=${companyId} nature=${nature}. Using defaults.`,
      );
      return DEFAULT_ACCOUNTS[nature];
    }

    return {
      glAccount: mapping.glAccount,
      journal: mapping.journal ?? DEFAULT_ACCOUNTS[nature].journal,
      costCenter: mapping.costCenter ?? '',
    };
  }

  // -------------------------------------------------------------------------
  // Row builder — queries commissions (bordereaux lines) for the given period
  // -------------------------------------------------------------------------

  private async buildRows(params: GenerateExportParams): Promise<AccountingExportRow[]> {
    const [year, month] = params.period.split('-').map(Number) as [number, number];

    // Period date boundaries for joins
    const periodStart = new Date(year, month - 1, 1);

    // Query commission lines via raw join for performance
    const lines = (await this.dataSource.query(
      `
      SELECT
        lb.type_ligne,
        lb.montant_brut,
        lb.montant_reprise,
        lb.montant_net,
        lb.taux_applique,
        lb.contrat_id,
        lb.contrat_reference,
        lb.client_nom,
        lb.produit_nom,
        p.sku,
        p.revenue_model,
        pv.id  AS produit_version_id,
        par.nom AS partenaire_nom,
        b.periode,
        b.created_at AS bordereau_date
      FROM lignes_bordereau lb
      JOIN bordereaux_commission b
        ON b.id = lb.bordereau_id
       AND b.keycloak_group_id = $1
       AND b.periode = $2
      LEFT JOIN baremes_commission bc
        ON bc.id = lb.bareme_id
      LEFT JOIN produit p
        ON p.id = bc.produit_id
      LEFT JOIN produit_versions pv
        ON pv.produit_id = p.id
       AND pv.effective_to IS NULL
      LEFT JOIN partenaire_commercial par
        ON par.id = bc.partenaire_id
      ORDER BY b.periode, lb.contrat_reference
    `,
      [params.keycloak_group_id, params.period],
    )) as LigneBordereauRow[];

    const rows: AccountingExportRow[] = [];

    for (const line of lines) {
      const dateStr = this.formatDate(line.bordereau_date ?? periodStart);
      const sku = line.sku ?? line.produit_nom ?? '';
      const partNom = line.partenaire_nom ?? '';
      const montant = Math.abs(parseFloat(line.montant_net ?? line.montant_brut));
      const revenueModel = line.revenue_model ?? 'revenue';

      // Resolve accounting for commission nature
      const commAcct = await this.resolveAccount(
        line.produit_version_id ?? '',
        params.keycloak_group_id,
        AccountingNature.COMMISSION,
      );

      const isReprise = line.type_ligne === 'REPRISE' || parseFloat(line.montant_reprise) > 0;

      // Commission or Clawback entry
      const commissionRow: AccountingExportRow = {
        date_operation: dateStr,
        societe: params.company_name,
        produit: sku,
        partenaire: partNom,
        type_ecriture: 'Commission',
        compte_comptable: commAcct.glAccount,
        journal: commAcct.journal,
        centre_couts: commAcct.costCenter,
        debit: isReprise ? montant : 0,
        credit: isReprise ? 0 : montant,
        tva: 0,
        taux_tva: '0%',
        reference_contrat: line.contrat_id,
        reference_client: line.client_nom ?? '',
      };
      rows.push(commissionRow);

      // For mixed products, also generate a CA entry
      if (revenueModel === 'mixed' || revenueModel === 'revenue') {
        const caAcct = await this.resolveAccount(
          line.produit_version_id ?? '',
          params.keycloak_group_id,
          AccountingNature.REVENUE,
        );
        const taxAcct = await this.resolveAccount(
          line.produit_version_id ?? '',
          params.keycloak_group_id,
          AccountingNature.TAX,
        );

        // Compute TVA from taux
        const tauxNum = parseFloat(line.taux_applique ?? '0') / 100;
        const tvaAmount = parseFloat(((montant * tauxNum) / (1 + tauxNum)).toFixed(2));
        const tauxLabel = this.formatTauxTva(parseFloat(line.taux_applique ?? '0'));

        rows.push({
          date_operation: dateStr,
          societe: params.company_name,
          produit: sku,
          partenaire: '',
          type_ecriture: 'CA',
          compte_comptable: caAcct.glAccount,
          journal: caAcct.journal,
          centre_couts: caAcct.costCenter,
          debit: 0,
          credit: montant,
          tva: tvaAmount,
          taux_tva: tauxLabel,
          reference_contrat: line.contrat_id,
          reference_client: line.client_nom ?? '',
        });

        // TVA collectée row
        if (tvaAmount > 0) {
          rows.push({
            date_operation: dateStr,
            societe: params.company_name,
            produit: sku,
            partenaire: '',
            type_ecriture: 'TVA',
            compte_comptable: taxAcct.glAccount,
            journal: taxAcct.journal,
            centre_couts: taxAcct.costCenter,
            debit: 0,
            credit: tvaAmount,
            tva: tvaAmount,
            taux_tva: tauxLabel,
            reference_contrat: line.contrat_id,
            reference_client: line.client_nom ?? '',
          });
        }
      }
    }

    return rows;
  }

  // -------------------------------------------------------------------------
  // CSV builder — CdC Annexe F compliant
  // -------------------------------------------------------------------------

  private buildCsv(rows: AccountingExportRow[], params: GenerateExportParams): ExportResult {
    const lines: string[] = [];

    // Header
    lines.push(CSV_HEADERS.join(';'));

    for (const r of rows) {
      lines.push(
        [
          r.date_operation,
          this.escapeCsv(r.societe),
          this.escapeCsv(r.produit),
          this.escapeCsv(r.partenaire),
          r.type_ecriture,
          r.compte_comptable,
          r.journal,
          r.centre_couts,
          this.frenchDecimal(r.debit),
          this.frenchDecimal(r.credit),
          this.frenchDecimal(r.tva),
          r.taux_tva,
          r.reference_contrat,
          this.escapeCsv(r.reference_client),
        ].join(';'),
      );
    }

    // UTF-8 BOM + content
    const content = `\uFEFF${lines.join('\r\n')}`;
    const buffer = Buffer.from(content, 'utf-8');
    const hash = this.sha256(buffer);
    const filename = `EXPORT_${this.sanitizeName(params.company_name)}_${params.period}.csv`;

    return { filename, buffer, mime: 'text/csv; charset=utf-8', rowCount: rows.length, fileHash: hash, logId: '' };
  }

  // -------------------------------------------------------------------------
  // XLSX builder — uses exceljs (available in service-commercial)
  // -------------------------------------------------------------------------

  private async buildXlsx(rows: AccountingExportRow[], params: GenerateExportParams): Promise<ExportResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ExcelJS = require('exceljs') as any;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Export comptable');

    worksheet.columns = CSV_HEADERS.map((h, i) => ({
      header: h,
      key: Object.keys({
        date_operation: 0,
        societe: 1,
        produit: 2,
        partenaire: 3,
        type_ecriture: 4,
        compte_comptable: 5,
        journal: 6,
        centre_couts: 7,
        debit: 8,
        credit: 9,
        tva: 10,
        taux_tva: 11,
        reference_contrat: 12,
        reference_client: 13,
      })[i],
      width: [14, 22, 18, 22, 14, 18, 10, 16, 10, 10, 10, 10, 36, 36][i],
    }));

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9EAD3' },
    };

    for (const r of rows) {
      worksheet.addRow({
        date_operation: r.date_operation,
        societe: r.societe,
        produit: r.produit,
        partenaire: r.partenaire,
        type_ecriture: r.type_ecriture,
        compte_comptable: r.compte_comptable,
        journal: r.journal,
        centre_couts: r.centre_couts,
        debit: r.debit,
        credit: r.credit,
        tva: r.tva,
        taux_tva: r.taux_tva,
        reference_contrat: r.reference_contrat,
        reference_client: r.reference_client,
      });
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const hash = this.sha256(buffer);
    const filename = `EXPORT_${this.sanitizeName(params.company_name)}_${params.period}.xlsx`;

    return {
      filename,
      buffer,
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      rowCount: rows.length,
      fileHash: hash,
      logId: '',
    };
  }

  // -------------------------------------------------------------------------
  // Persistence
  // -------------------------------------------------------------------------

  private async persistLog(params: GenerateExportParams, result: ExportResult): Promise<string> {
    const storagePath = await this.storeFile(result, params);

    const log = this.exportLogRepo.create({
      keycloakGroupId: params.keycloak_group_id,
      companyName: params.company_name,
      period: params.period,
      format: params.format === 'xlsx' ? AccountingExportFormat.XLSX : AccountingExportFormat.CSV,
      filename: result.filename,
      fileHash: result.fileHash,
      fileSizeBytes: result.buffer.length,
      rowCount: result.rowCount,
      storagePath: storagePath ?? null,
      generatedBy: params.generated_by ?? 'SYSTEM_CRON',
    });

    const saved = await this.exportLogRepo.save(log);
    return saved.id;
  }

  private async storeFile(result: ExportResult, params: GenerateExportParams): Promise<string | null> {
    const storagePath = process.env.EXPORT_STORAGE_PATH ?? './exports/accounting';

    try {
      const dir = path.join(storagePath, this.sanitizeName(params.company_name), params.period.split('-')[0]!);
      fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, result.filename);
      fs.writeFileSync(filePath, result.buffer);
      return filePath;
    } catch (err) {
      this.logger.warn(`Could not write export to disk: ${(err as Error).message}`);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private frenchDecimal(n: number): string {
    return n.toFixed(2).replace('.', ',');
  }

  private escapeCsv(s: string): string {
    if (s.includes(';') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 40);
  }

  private formatTauxTva(taux: number): string {
    if (taux === 5.5) return '5,5%';
    if (taux === 0) return '0%';
    return `${taux}%`;
  }

  sha256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}

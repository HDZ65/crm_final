import { Injectable } from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import type { CommissionEntity } from '../entities/commission.entity';
import type { RepriseCommissionEntity } from '../entities/reprise-commission.entity';
import type { CommissionRecurrenteEntity } from '../entities/commission-recurrente.entity';
import type { BordereauCommissionEntity } from '../entities/bordereau-commission.entity';

export interface DashboardKpiFilters {
  organisationId: string;
  periode?: string;
  apporteurId?: string;
  produitId?: string;
  dateDebut?: string;
  dateFin?: string;
}

export interface SnapshotKpiPayload {
  totalBrut: number;
  totalNet: number;
  totalReprises: number;
  totalRecurrence: number;
  tauxReprise: number;
  volume: number;
  delaiValidationMoyenJours: number;
  parProduit: Array<{
    produitId: string;
    totalBrut: number;
    totalNet: number;
    totalReprises: number;
    volume: number;
  }>;
}

export interface SnapshotKpiRecord {
  id: string;
  organisationId: string;
  periode: string;
  generatedAt: Date;
  source: 'manual' | 'auto' | 'computed';
  generatedBy: string | null;
  kpiJson: SnapshotKpiPayload;
  createdAt: Date;
}

export interface DashboardKpiResult extends SnapshotKpiPayload {
  periode: string;
  generatedAt: string;
  source: 'manual' | 'auto' | 'computed';
}

export interface ComparatifKpi {
  periode: string;
  totalBrut: number;
  totalNet: number;
  totalReprises: number;
  totalRecurrence: number;
  tauxReprise: number;
  volume: number;
  delaiValidationMoyenJours: number;
  variationBrutPct: number;
}

export interface ComparatifsResult {
  courant: ComparatifKpi;
  m1: ComparatifKpi;
  m3: ComparatifKpi;
  m12: ComparatifKpi;
}

export interface ExportAnalytiqueInput extends DashboardKpiFilters {
  format: 'csv' | 'excel';
  includeComparatifs?: boolean;
}

export interface ExportAnalytiqueResult {
  fileName: string;
  mimeType: string;
  content: string;
}

export interface SnapshotKpiDependencies {
  aggregateBrutNetReprises: (filters: DashboardKpiFilters) => Promise<{
    totalBrut: number;
    totalNet: number;
    totalReprises: number;
    volume: number;
  }>;
  aggregateRecurrence: (filters: DashboardKpiFilters) => Promise<{ totalRecurrence: number }>;
  aggregateValidationDelaiDays: (filters: DashboardKpiFilters) => Promise<{ moyenneJours: number }>;
  aggregateParProduit: (filters: DashboardKpiFilters) => Promise<Array<{
    produitId: string;
    totalBrut: number;
    totalNet: number;
    totalReprises: number;
    volume: number;
  }>>;
  saveSnapshot: (snapshot: {
    organisationId: string;
    periode: string;
    source: 'manual' | 'auto' | 'computed';
    generatedBy: string | null;
    kpiJson: SnapshotKpiPayload;
  }) => Promise<{ id: string; createdAt: Date }>;
  findLatestSnapshot: (filters: DashboardKpiFilters) => Promise<SnapshotKpiRecord | null>;
  findSnapshotByPeriode: (input: { organisationId: string; periode: string }) => Promise<SnapshotKpiRecord | null>;
}

const defaultDeps: SnapshotKpiDependencies = {
  aggregateBrutNetReprises: async () => ({ totalBrut: 0, totalNet: 0, totalReprises: 0, volume: 0 }),
  aggregateRecurrence: async () => ({ totalRecurrence: 0 }),
  aggregateValidationDelaiDays: async () => ({ moyenneJours: 0 }),
  aggregateParProduit: async () => [],
  saveSnapshot: async () => ({ id: 'computed-only', createdAt: new Date() }),
  findLatestSnapshot: async () => null,
  findSnapshotByPeriode: async () => null,
};

@Injectable()
export class SnapshotKpiService {
  constructor(private readonly deps: SnapshotKpiDependencies = defaultDeps) {}

  static fromRepositories(
    dataSource: DataSource,
    commissionRepository: Repository<CommissionEntity>,
    repriseRepository: Repository<RepriseCommissionEntity>,
    recurrenceRepository: Repository<CommissionRecurrenteEntity>,
    bordereauRepository: Repository<BordereauCommissionEntity>,
  ): SnapshotKpiService {
    const deps: SnapshotKpiDependencies = {
      aggregateBrutNetReprises: async (filters) => {
        const qb = commissionRepository
          .createQueryBuilder('c')
          .select('COALESCE(SUM(c.montantBrut), 0)', 'totalBrut')
          .addSelect('COALESCE(SUM(c.montantNetAPayer), 0)', 'totalNet')
          .addSelect('COALESCE(SUM(c.montantReprises), 0)', 'totalReprises')
          .addSelect('COUNT(c.id)', 'volume')
          .where('c.organisationId = :organisationId', { organisationId: filters.organisationId });

        applyCommonCommissionFilters(qb, filters);

        const row = await qb.getRawOne();
        return {
          totalBrut: toDecimal(row?.totalBrut),
          totalNet: toDecimal(row?.totalNet),
          totalReprises: toDecimal(row?.totalReprises),
          volume: Number(row?.volume || 0),
        };
      },
      aggregateRecurrence: async (filters) => {
        const qb = recurrenceRepository
          .createQueryBuilder('r')
          .select('COALESCE(SUM(r.montantCalcule), 0)', 'totalRecurrence')
          .where('r.organisationId = :organisationId', { organisationId: filters.organisationId });

        if (filters.apporteurId) {
          qb.andWhere('r.apporteurId = :apporteurId', { apporteurId: filters.apporteurId });
        }

        const range = resolveDateRange(filters);
        if (filters.periode) {
          qb.andWhere('r.periode = :periode', { periode: filters.periode });
        } else if (range) {
          qb.andWhere('r.createdAt >= :dateDebut', { dateDebut: range.dateDebut.toISOString() });
          qb.andWhere('r.createdAt <= :dateFin', { dateFin: range.dateFin.toISOString() });
        }

        const row = await qb.getRawOne();
        return { totalRecurrence: toDecimal(row?.totalRecurrence) };
      },
      aggregateValidationDelaiDays: async (filters) => {
        const qb = bordereauRepository
          .createQueryBuilder('b')
          .select("COALESCE(AVG(EXTRACT(EPOCH FROM (b.dateValidation - b.createdAt)) / 86400), 0)", 'moyenneJours')
          .where('b.organisationId = :organisationId', { organisationId: filters.organisationId })
          .andWhere('b.dateValidation IS NOT NULL');

        if (filters.apporteurId) {
          qb.andWhere('b.apporteurId = :apporteurId', { apporteurId: filters.apporteurId });
        }

        if (filters.periode) {
          qb.andWhere('b.periode = :periode', { periode: filters.periode });
        } else {
          const range = resolveDateRange(filters);
          if (range) {
            qb.andWhere('b.dateValidation >= :dateDebut', { dateDebut: range.dateDebut.toISOString() });
            qb.andWhere('b.dateValidation <= :dateFin', { dateFin: range.dateFin.toISOString() });
          }
        }

        const row = await qb.getRawOne();
        return { moyenneJours: toDecimal(row?.moyenneJours) };
      },
      aggregateParProduit: async (filters) => {
        const qb = commissionRepository
          .createQueryBuilder('c')
          .select("COALESCE(c.produitId, 'inconnu')", 'produitId')
          .addSelect('COALESCE(SUM(c.montantBrut), 0)', 'totalBrut')
          .addSelect('COALESCE(SUM(c.montantNetAPayer), 0)', 'totalNet')
          .addSelect('COALESCE(SUM(c.montantReprises), 0)', 'totalReprises')
          .addSelect('COUNT(c.id)', 'volume')
          .where('c.organisationId = :organisationId', { organisationId: filters.organisationId })
          .groupBy('c.produitId')
          .orderBy('totalBrut', 'DESC');

        applyCommonCommissionFilters(qb, filters);

        const rows = await qb.getRawMany();
        return rows.map((row) => ({
          produitId: String(row?.produitId || 'inconnu'),
          totalBrut: toDecimal(row?.totalBrut),
          totalNet: toDecimal(row?.totalNet),
          totalReprises: toDecimal(row?.totalReprises),
          volume: Number(row?.volume || 0),
        }));
      },
      saveSnapshot: async (snapshot) => {
        const rows = await dataSource.query(
          `
            INSERT INTO snapshots_kpi (
              organisation_id,
              periode,
              generated_at,
              source,
              generated_by,
              kpi_json
            ) VALUES ($1, $2, NOW(), $3, $4, $5::jsonb)
            RETURNING id, created_at
          `,
          [
            snapshot.organisationId,
            snapshot.periode,
            snapshot.source,
            snapshot.generatedBy,
            JSON.stringify(snapshot.kpiJson),
          ],
        );
        return {
          id: String(rows?.[0]?.id || ''),
          createdAt: rows?.[0]?.created_at ? new Date(rows[0].created_at) : new Date(),
        };
      },
      findLatestSnapshot: async (filters) => {
        const rows = await dataSource.query(
          `
            SELECT id, organisation_id, periode, generated_at, source, generated_by, kpi_json, created_at
            FROM snapshots_kpi
            WHERE organisation_id = $1
            ORDER BY generated_at DESC
            LIMIT 1
          `,
          [filters.organisationId],
        );
        return mapSnapshotRow(rows?.[0]);
      },
      findSnapshotByPeriode: async (input) => {
        const rows = await dataSource.query(
          `
            SELECT id, organisation_id, periode, generated_at, source, generated_by, kpi_json, created_at
            FROM snapshots_kpi
            WHERE organisation_id = $1
              AND periode = $2
            ORDER BY generated_at DESC
            LIMIT 1
          `,
          [input.organisationId, input.periode],
        );
        return mapSnapshotRow(rows?.[0]);
      },
    };

    void repriseRepository;

    return new SnapshotKpiService(deps);
  }

  async genererSnapshot(
    filters: DashboardKpiFilters,
    source: 'manual' | 'auto' | 'computed' = 'manual',
    generatedBy: string | null = null,
  ): Promise<SnapshotKpiPayload> {
    const periode = filters.periode || toPeriode(new Date());
    const [base, recurrence, delai, parProduit] = await Promise.all([
      this.deps.aggregateBrutNetReprises(filters),
      this.deps.aggregateRecurrence(filters),
      this.deps.aggregateValidationDelaiDays(filters),
      this.deps.aggregateParProduit(filters),
    ]);

    const tauxReprise = base.totalBrut > 0
      ? arrondirDecimal((base.totalReprises / base.totalBrut) * 100)
      : 0;

    const payload: SnapshotKpiPayload = {
      totalBrut: arrondirDecimal(base.totalBrut),
      totalNet: arrondirDecimal(base.totalNet),
      totalReprises: arrondirDecimal(base.totalReprises),
      totalRecurrence: arrondirDecimal(recurrence.totalRecurrence),
      tauxReprise,
      volume: Number(base.volume || 0),
      delaiValidationMoyenJours: arrondirDecimal(delai.moyenneJours),
      parProduit: parProduit.map((item) => ({
        produitId: item.produitId,
        totalBrut: arrondirDecimal(item.totalBrut),
        totalNet: arrondirDecimal(item.totalNet),
        totalReprises: arrondirDecimal(item.totalReprises),
        volume: Number(item.volume || 0),
      })),
    };

    if (source !== 'computed') {
      await this.deps.saveSnapshot({
        organisationId: filters.organisationId,
        periode,
        source,
        generatedBy,
        kpiJson: payload,
      });
    }

    return payload;
  }

  async getDashboardKpi(filters: DashboardKpiFilters): Promise<DashboardKpiResult> {
    const periode = filters.periode || toPeriode(new Date());
    const existing = filters.periode
      ? await this.deps.findSnapshotByPeriode({ organisationId: filters.organisationId, periode })
      : await this.deps.findLatestSnapshot(filters);

    if (existing) {
      return {
        ...existing.kpiJson,
        periode: existing.periode,
        generatedAt: existing.generatedAt.toISOString(),
        source: existing.source,
      };
    }

    const generated = await this.genererSnapshot({ ...filters, periode }, 'computed', null);
    return {
      ...generated,
      periode,
      generatedAt: new Date().toISOString(),
      source: 'computed',
    };
  }

  async getComparatifs(filters: DashboardKpiFilters): Promise<ComparatifsResult> {
    const basePeriode = filters.periode || toPeriode(new Date());
    const courant = await this.getDashboardKpi({ ...filters, periode: basePeriode });

    const m1Periode = shiftPeriode(basePeriode, -1);
    const m3Periode = shiftPeriode(basePeriode, -3);
    const m12Periode = shiftPeriode(basePeriode, -12);

    const [m1, m3, m12] = await Promise.all([
      this.resolveComparatif(filters.organisationId, m1Periode),
      this.resolveComparatif(filters.organisationId, m3Periode),
      this.resolveComparatif(filters.organisationId, m12Periode),
    ]);

    const courantComparatif = this.toComparatif(courant, 0);
    return {
      courant: courantComparatif,
      m1: this.toComparatif(m1, calculateVariationPct(courant.totalBrut, m1.totalBrut)),
      m3: this.toComparatif(m3, calculateVariationPct(courant.totalBrut, m3.totalBrut)),
      m12: this.toComparatif(m12, calculateVariationPct(courant.totalBrut, m12.totalBrut)),
    };
  }

  async exportAnalytique(input: ExportAnalytiqueInput): Promise<ExportAnalytiqueResult> {
    const dashboard = await this.getDashboardKpi(input);
    const comparatifs = input.includeComparatifs ? await this.getComparatifs(input) : null;
    const safePeriode = dashboard.periode.replace(/[^0-9-]/g, '');

    if (input.format === 'excel') {
      const excelContent = await this.buildExcelBase64(dashboard, comparatifs);
      return {
        fileName: `kpi-${safePeriode}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        content: excelContent,
      };
    }

    const csv = this.buildCsv(dashboard, comparatifs);
    return {
      fileName: `kpi-${safePeriode}.csv`,
      mimeType: 'text/csv',
      content: csv,
    };
  }

  private async resolveComparatif(
    organisationId: string,
    periode: string,
  ): Promise<DashboardKpiResult> {
    const snapshot = await this.deps.findSnapshotByPeriode({ organisationId, periode });
    if (snapshot) {
      return {
        ...snapshot.kpiJson,
        periode: snapshot.periode,
        generatedAt: snapshot.generatedAt.toISOString(),
        source: snapshot.source,
      };
    }
    const generated = await this.genererSnapshot({ organisationId, periode }, 'computed', null);
    return {
      ...generated,
      periode,
      generatedAt: new Date().toISOString(),
      source: 'computed',
    };
  }

  private toComparatif(input: DashboardKpiResult, variationBrutPct: number): ComparatifKpi {
    return {
      periode: input.periode,
      totalBrut: input.totalBrut,
      totalNet: input.totalNet,
      totalReprises: input.totalReprises,
      totalRecurrence: input.totalRecurrence,
      tauxReprise: input.tauxReprise,
      volume: input.volume,
      delaiValidationMoyenJours: input.delaiValidationMoyenJours,
      variationBrutPct,
    };
  }

  private buildCsv(dashboard: DashboardKpiResult, comparatifs: ComparatifsResult | null): string {
    const lines = [
      'periode,total_brut,total_net,total_reprises,total_recurrence,taux_reprise,volume,delai_validation',
      [
        dashboard.periode,
        formatMoney(dashboard.totalBrut),
        formatMoney(dashboard.totalNet),
        formatMoney(dashboard.totalReprises),
        formatMoney(dashboard.totalRecurrence),
        formatMoney(dashboard.tauxReprise),
        String(dashboard.volume),
        formatMoney(dashboard.delaiValidationMoyenJours),
      ].join(','),
    ];

    if (comparatifs) {
      lines.push('');
      lines.push('comparatif,periode,total_brut,variation_pct');
      lines.push(`M-1,${comparatifs.m1.periode},${formatMoney(comparatifs.m1.totalBrut)},${formatMoney(comparatifs.m1.variationBrutPct)}`);
      lines.push(`M-3,${comparatifs.m3.periode},${formatMoney(comparatifs.m3.totalBrut)},${formatMoney(comparatifs.m3.variationBrutPct)}`);
      lines.push(`M-12,${comparatifs.m12.periode},${formatMoney(comparatifs.m12.totalBrut)},${formatMoney(comparatifs.m12.variationBrutPct)}`);
    }

    return `${lines.join('\n')}\n`;
  }

  private async buildExcelBase64(
    dashboard: DashboardKpiResult,
    comparatifs: ComparatifsResult | null,
  ): Promise<string> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('KPI');
    sheet.addRow([
      'periode',
      'total_brut',
      'total_net',
      'total_reprises',
      'total_recurrence',
      'taux_reprise',
      'volume',
      'delai_validation',
    ]);
    sheet.addRow([
      dashboard.periode,
      dashboard.totalBrut,
      dashboard.totalNet,
      dashboard.totalReprises,
      dashboard.totalRecurrence,
      dashboard.tauxReprise,
      dashboard.volume,
      dashboard.delaiValidationMoyenJours,
    ]);

    if (comparatifs) {
      const comp = workbook.addWorksheet('Comparatifs');
      comp.addRow(['comparatif', 'periode', 'total_brut', 'variation_pct']);
      comp.addRow(['M-1', comparatifs.m1.periode, comparatifs.m1.totalBrut, comparatifs.m1.variationBrutPct]);
      comp.addRow(['M-3', comparatifs.m3.periode, comparatifs.m3.totalBrut, comparatifs.m3.variationBrutPct]);
      comp.addRow(['M-12', comparatifs.m12.periode, comparatifs.m12.totalBrut, comparatifs.m12.variationBrutPct]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer).toString('base64');
  }
}

function resolveDateRange(filters: DashboardKpiFilters): { dateDebut: Date; dateFin: Date } | null {
  if (filters.dateDebut && filters.dateFin) {
    return {
      dateDebut: new Date(filters.dateDebut),
      dateFin: new Date(filters.dateFin),
    };
  }

  if (filters.periode) {
    const [y, m] = filters.periode.split('-').map((value) => Number(value));
    if (Number.isInteger(y) && Number.isInteger(m) && m >= 1 && m <= 12) {
      const dateDebut = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const dateFin = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      return { dateDebut, dateFin };
    }
  }

  return null;
}

function applyCommonCommissionFilters(qb: any, filters: DashboardKpiFilters): void {
  if (filters.apporteurId) {
    qb.andWhere('c.apporteurId = :apporteurId', { apporteurId: filters.apporteurId });
  }
  if (filters.produitId) {
    qb.andWhere('c.produitId = :produitId', { produitId: filters.produitId });
  }

  if (filters.periode) {
    qb.andWhere('c.periode = :periode', { periode: filters.periode });
    return;
  }

  const range = resolveDateRange(filters);
  if (range) {
    qb.andWhere('c.dateCreation >= :dateDebut', { dateDebut: range.dateDebut.toISOString().slice(0, 10) });
    qb.andWhere('c.dateCreation <= :dateFin', { dateFin: range.dateFin.toISOString().slice(0, 10) });
  }
}

function mapSnapshotRow(row: any): SnapshotKpiRecord | null {
  if (!row) return null;
  const rawPayload = typeof row.kpi_json === 'string' ? JSON.parse(row.kpi_json) : row.kpi_json;
  return {
    id: String(row.id),
    organisationId: String(row.organisation_id),
    periode: String(row.periode),
    generatedAt: new Date(row.generated_at),
    source: ((row.source as string) || 'manual') as 'manual' | 'auto' | 'computed',
    generatedBy: row.generated_by ? String(row.generated_by) : null,
    kpiJson: {
      totalBrut: toDecimal(rawPayload?.totalBrut),
      totalNet: toDecimal(rawPayload?.totalNet),
      totalReprises: toDecimal(rawPayload?.totalReprises),
      totalRecurrence: toDecimal(rawPayload?.totalRecurrence),
      tauxReprise: toDecimal(rawPayload?.tauxReprise),
      volume: Number(rawPayload?.volume || 0),
      delaiValidationMoyenJours: toDecimal(rawPayload?.delaiValidationMoyenJours),
      parProduit: Array.isArray(rawPayload?.parProduit)
        ? rawPayload.parProduit.map((item: any) => ({
            produitId: String(item?.produitId || 'inconnu'),
            totalBrut: toDecimal(item?.totalBrut),
            totalNet: toDecimal(item?.totalNet),
            totalReprises: toDecimal(item?.totalReprises),
            volume: Number(item?.volume || 0),
          }))
        : [],
    },
    createdAt: new Date(row.created_at),
  };
}

function toDecimal(value: unknown): number {
  return arrondirDecimal(Number(value || 0));
}

function arrondirDecimal(value: number): number {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function toPeriode(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function shiftPeriode(periode: string, diffMois: number): string {
  const [y, m] = periode.split('-').map((value) => Number(value));
  if (!Number.isInteger(y) || !Number.isInteger(m)) {
    return periode;
  }
  const dt = new Date(Date.UTC(y, m - 1 + diffMois, 1));
  return toPeriode(dt);
}

function calculateVariationPct(current: number, previous: number): number {
  if (!previous) {
    return current ? 100 : 0;
  }
  return arrondirDecimal(((current - previous) / previous) * 100);
}

function formatMoney(value: number): string {
  return arrondirDecimal(value).toFixed(2);
}

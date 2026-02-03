import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface DashboardFilters {
  organisationId: string;
  societeId?: string;
  produitId?: string;
  canal?: string;
  dateDebut?: string;
  dateFin?: string;
  periodeRapide?: string;
}

export interface Variation {
  pourcentage: number;
  tendance: 'hausse' | 'baisse' | 'stable';
}

export interface KpisResult {
  contratsActifs: number;
  contratsActifsVariation: Variation;
  mrr: number;
  mrrVariation: Variation;
  tauxChurn: number;
  tauxChurnVariation: Variation;
  tauxImpayes: number;
  tauxImpayesVariation: Variation;
}

@Injectable()
export class KpisService {
  private readonly logger = new Logger(KpisService.name);

  constructor(
    @InjectDataSource()
    private readonly contratsDb: DataSource,
    @InjectDataSource('factures')
    private readonly facturesDb: DataSource,
  ) {}

  async getKpis(filters: DashboardFilters): Promise<KpisResult> {
    // Validate organisationId - return default values if empty
    if (!filters.organisationId || filters.organisationId.trim() === '') {
      this.logger.warn('organisationId is empty, returning default values');
      return {
        contratsActifs: 0,
        contratsActifsVariation: { pourcentage: 0, tendance: 'stable' },
        mrr: 0,
        mrrVariation: { pourcentage: 0, tendance: 'stable' },
        tauxChurn: 0,
        tauxChurnVariation: { pourcentage: 0, tendance: 'stable' },
        tauxImpayes: 0,
        tauxImpayesVariation: { pourcentage: 0, tendance: 'stable' },
      };
    }

    this.logger.log(`Calculating KPIs for org ${filters.organisationId}`);

    const { dateDebut, dateFin } = this.resolvePeriod(filters);
    const { dateDebutPrev, dateFinPrev } = this.getPreviousPeriod(dateDebut, dateFin);

    // Calculate current period KPIs
    const [contratsActifs, contratsPrev] = await Promise.all([
      this.countActiveContracts(filters.organisationId, filters.societeId, dateFin),
      this.countActiveContracts(filters.organisationId, filters.societeId, dateFinPrev),
    ]);

    const [mrr, mrrPrev] = await Promise.all([
      this.calculateMRR(filters.organisationId, filters.societeId, dateDebut, dateFin),
      this.calculateMRR(filters.organisationId, filters.societeId, dateDebutPrev, dateFinPrev),
    ]);

    const [tauxChurn, tauxChurnPrev] = await Promise.all([
      this.calculateChurnRate(filters.organisationId, filters.societeId, dateDebut, dateFin),
      this.calculateChurnRate(filters.organisationId, filters.societeId, dateDebutPrev, dateFinPrev),
    ]);

    const [tauxImpayes, tauxImpayesPrev] = await Promise.all([
      this.calculateUnpaidRate(filters.organisationId, filters.societeId, dateDebut, dateFin),
      this.calculateUnpaidRate(filters.organisationId, filters.societeId, dateDebutPrev, dateFinPrev),
    ]);

    return {
      contratsActifs,
      contratsActifsVariation: this.calculateVariation(contratsActifs, contratsPrev),
      mrr,
      mrrVariation: this.calculateVariation(mrr, mrrPrev),
      tauxChurn,
      tauxChurnVariation: this.calculateVariation(tauxChurn, tauxChurnPrev),
      tauxImpayes,
      tauxImpayesVariation: this.calculateVariation(tauxImpayes, tauxImpayesPrev),
    };
  }

  private resolvePeriod(filters: DashboardFilters): { dateDebut: string; dateFin: string } {
    const now = new Date();
    let dateDebut: string;
    let dateFin: string;

    switch (filters.periodeRapide) {
      case 'mois_courant':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateFin = now.toISOString().split('T')[0];
        break;
      case 'mois_dernier':
        dateDebut = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        dateFin = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'trimestre_courant':
        const quarter = Math.floor(now.getMonth() / 3);
        dateDebut = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        dateFin = now.toISOString().split('T')[0];
        break;
      case 'annee_courante':
        dateDebut = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        dateFin = now.toISOString().split('T')[0];
        break;
      default:
        dateDebut = filters.dateDebut || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateFin = filters.dateFin || now.toISOString().split('T')[0];
    }

    return { dateDebut, dateFin };
  }

  private getPreviousPeriod(dateDebut: string, dateFin: string): { dateDebutPrev: string; dateFinPrev: string } {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    const duration = end.getTime() - start.getTime();

    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);

    return {
      dateDebutPrev: prevStart.toISOString().split('T')[0],
      dateFinPrev: prevEnd.toISOString().split('T')[0],
    };
  }

  private calculateVariation(current: number, previous: number): Variation {
    if (previous === 0) {
      return { pourcentage: current > 0 ? 100 : 0, tendance: current > 0 ? 'hausse' : 'stable' };
    }

    const pourcentage = Math.round(((current - previous) / previous) * 100 * 100) / 100;
    let tendance: 'hausse' | 'baisse' | 'stable';

    if (pourcentage > 0) tendance = 'hausse';
    else if (pourcentage < 0) tendance = 'baisse';
    else tendance = 'stable';

    return { pourcentage: Math.abs(pourcentage), tendance };
  }

  private async countActiveContracts(organisationId: string, societeId: string | undefined, asOfDate: string): Promise<number> {
    let query = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM contrat c
      WHERE c.organisation_id = $1
        AND c.statut IN ('ACTIF', 'EN_COURS')
        AND c.date_debut <= $2
        AND (c.date_fin IS NULL OR c.date_fin >= $2)
    `;
    const params: any[] = [organisationId, asOfDate];

    if (societeId) {
      query += ' AND c.societe_id = $3';
      params.push(societeId);
    }

    const result = await this.contratsDb.query(query, params);
    return parseInt(result[0]?.count || '0', 10);
  }

  private async calculateMRR(organisationId: string, societeId: string | undefined, dateDebut: string, dateFin: string): Promise<number> {
    let query = `
      SELECT COALESCE(SUM(f.montant_ht), 0) as total
      FROM facture f
      WHERE f.organisation_id = $1
        AND f.date_emission BETWEEN $2 AND $3
    `;
    const params: any[] = [organisationId, dateDebut, dateFin];

    // Note: facture table doesn't have societe_id column, so we can't filter by société

    const result = await this.facturesDb.query(query, params);
    return Math.round(parseFloat(result[0]?.total || '0') * 100) / 100;
  }

  private async calculateChurnRate(organisationId: string, societeId: string | undefined, dateDebut: string, dateFin: string): Promise<number> {
    // Count cancelled contracts vs total active at start of period
    let queryTotal = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM contrat c
      WHERE c.organisation_id = $1
        AND c.date_debut <= $2
    `;
    let queryCancelled = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM contrat c
      WHERE c.organisation_id = $1
        AND c.statut IN ('RESILIE', 'ANNULE')
        AND c.date_fin BETWEEN $2 AND $3
    `;
    const paramsTotal: any[] = [organisationId, dateDebut];
    const paramsCancelled: any[] = [organisationId, dateDebut, dateFin];

    if (societeId) {
      queryTotal += ' AND c.societe_id = $3';
      queryCancelled += ' AND c.societe_id = $4';
      paramsTotal.push(societeId);
      paramsCancelled.push(societeId);
    }

    const [totalResult, cancelledResult] = await Promise.all([
      this.contratsDb.query(queryTotal, paramsTotal),
      this.contratsDb.query(queryCancelled, paramsCancelled),
    ]);

    const total = parseInt(totalResult[0]?.count || '0', 10);
    const cancelled = parseInt(cancelledResult[0]?.count || '0', 10);

    if (total === 0) return 0;
    return Math.round((cancelled / total) * 100 * 100) / 100;
  }

  private async calculateUnpaidRate(organisationId: string, societeId: string | undefined, dateDebut: string, dateFin: string): Promise<number> {
    let queryTotal = `
      SELECT COUNT(DISTINCT f.id) as count
      FROM facture f
      WHERE f.organisation_id = $1
        AND f.date_emission BETWEEN $2 AND $3
    `;
    let queryUnpaid = `
      SELECT COUNT(DISTINCT f.id) as count
      FROM facture f
      JOIN statut_facture sf ON f.statut_id = sf.id
      WHERE f.organisation_id = $1
        AND f.date_emission BETWEEN $2 AND $3
        AND sf.code IN ('IMPAYEE', 'EN_RETARD')
    `;
    const params: any[] = [organisationId, dateDebut, dateFin];

    // Note: facture table doesn't have societe_id column, so we can't filter by société

    const [totalResult, unpaidResult] = await Promise.all([
      this.facturesDb.query(queryTotal, params),
      this.facturesDb.query(queryUnpaid, params),
    ]);

    const total = parseInt(totalResult[0]?.count || '0', 10);
    const unpaid = parseInt(unpaidResult[0]?.count || '0', 10);

    if (total === 0) return 0;
    return Math.round((unpaid / total) * 100 * 100) / 100;
  }
}

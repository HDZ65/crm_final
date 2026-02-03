import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DashboardFilters } from '../kpis/kpis.service';

export interface StatsSociete {
  societeId: string;
  nomSociete: string;
  contratsActifs: number;
  mrr: number;
  arr: number;
  nouveauxClients: number;
  nouveauxClientsVariation: number;
  tauxChurn: number;
  tauxImpayes: number;
}

export interface StatsSocietesResult {
  societes: StatsSociete[];
  total: number;
}

@Injectable()
export class StatsSocietesService {
  private readonly logger = new Logger(StatsSocietesService.name);

  constructor(
    @InjectDataSource()
    private readonly contratsDb: DataSource,
    @InjectDataSource('factures')
    private readonly facturesDb: DataSource,
    @InjectDataSource('clients')
    private readonly clientsDb: DataSource,
    @InjectDataSource('organisations')
    private readonly organisationsDb: DataSource,
  ) {}

  async getStatsSocietes(filters: DashboardFilters): Promise<StatsSocietesResult> {
    // Validate organisationId - return empty result if empty
    if (!filters.organisationId || filters.organisationId.trim() === '') {
      this.logger.warn('organisationId is empty, returning empty stats');
      return { societes: [], total: 0 };
    }

    this.logger.log(`Getting company stats for org ${filters.organisationId}`);

    const { dateDebut, dateFin } = this.resolvePeriod(filters);

    // Get all companies for the organization from organisations_db
    let societesQuery = `
      SELECT id, raison_sociale as nom FROM societes WHERE organisation_id = $1
    `;
    const societeParams: any[] = [filters.organisationId];

    if (filters.societeId) {
      societesQuery += ' AND id = $2';
      societeParams.push(filters.societeId);
    }

    const societes = await this.organisationsDb.query(societesQuery, societeParams);

    const stats: StatsSociete[] = await Promise.all(
      societes.map(async (s: any) => this.getStatForSociete(s.id, s.nom, filters.organisationId, dateDebut, dateFin)),
    );

    return {
      societes: stats,
      total: stats.length,
    };
  }

  private async getStatForSociete(
    societeId: string,
    nomSociete: string,
    organisationId: string,
    dateDebut: string,
    dateFin: string,
  ): Promise<StatsSociete> {
    // Active contracts from contrats_db
    const contratsResult = await this.contratsDb.query(
      `
      SELECT COUNT(DISTINCT c.id) as count
      FROM contrat c
      WHERE c.organisation_id = $1
        AND c.societe_id = $2
        AND c.statut IN ('ACTIF', 'EN_COURS')
        AND c.date_debut <= $3
        AND (c.date_fin IS NULL OR c.date_fin >= $3)
    `,
      [organisationId, societeId, dateFin],
    );

    // MRR (Monthly Recurring Revenue) from factures_db
    // Note: facture table doesn't have societe_id column
    const mrrResult = await this.facturesDb.query(
      `
      SELECT COALESCE(SUM(f.montant_ht), 0) as total
      FROM facture f
      WHERE f.organisation_id = $1
        AND f.date_emission BETWEEN $2 AND $3
    `,
      [organisationId, dateDebut, dateFin],
    );

    // New clients from clients_db
    // Note: clientbases table doesn't have societe_id column
    const newClientsResult = await this.clientsDb.query(
      `
      SELECT COUNT(DISTINCT cb.id) as count
      FROM clientbases cb
      WHERE cb.organisation_id = $1
        AND cb.created_at BETWEEN $2 AND $3
    `,
      [organisationId, dateDebut, dateFin],
    );

    // Previous period new clients for variation
    const prevNewClientsResult = await this.clientsDb.query(
      `
      SELECT COUNT(DISTINCT cb.id) as count
      FROM clientbases cb
      WHERE cb.organisation_id = $1
        AND cb.created_at BETWEEN $2::date - INTERVAL '1 month' AND $2::date
    `,
      [organisationId, dateDebut],
    );

    // Churn rate from contrats_db
    const churnResult = await this.calculateChurnForSociete(organisationId, societeId, dateDebut, dateFin);

    // Unpaid rate from factures_db
    const unpaidResult = await this.calculateUnpaidForSociete(organisationId, societeId, dateDebut, dateFin);

    const contratsActifs = parseInt(contratsResult[0]?.count || '0', 10);
    const mrr = parseFloat(mrrResult[0]?.total || '0');
    const nouveauxClients = parseInt(newClientsResult[0]?.count || '0', 10);
    const prevClients = parseInt(prevNewClientsResult[0]?.count || '0', 10);

    return {
      societeId,
      nomSociete,
      contratsActifs,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      nouveauxClients,
      nouveauxClientsVariation: prevClients > 0 ? Math.round(((nouveauxClients - prevClients) / prevClients) * 100 * 100) / 100 : 0,
      tauxChurn: churnResult,
      tauxImpayes: unpaidResult,
    };
  }

  private async calculateChurnForSociete(organisationId: string, societeId: string, dateDebut: string, dateFin: string): Promise<number> {
    const [totalResult, cancelledResult] = await Promise.all([
      this.contratsDb.query(
        `SELECT COUNT(DISTINCT id) as count FROM contrat WHERE organisation_id = $1 AND societe_id = $2 AND date_debut <= $3`,
        [organisationId, societeId, dateDebut],
      ),
      this.contratsDb.query(
        `
        SELECT COUNT(DISTINCT c.id) as count
        FROM contrat c
        WHERE c.organisation_id = $1
          AND c.societe_id = $2
          AND c.statut IN ('RESILIE', 'ANNULE')
          AND c.date_fin BETWEEN $3 AND $4
      `,
        [organisationId, societeId, dateDebut, dateFin],
      ),
    ]);

    const total = parseInt(totalResult[0]?.count || '0', 10);
    const cancelled = parseInt(cancelledResult[0]?.count || '0', 10);

    return total > 0 ? Math.round((cancelled / total) * 100 * 100) / 100 : 0;
  }

  private async calculateUnpaidForSociete(organisationId: string, societeId: string, dateDebut: string, dateFin: string): Promise<number> {
    // Note: facture table doesn't have societe_id column
    const [totalResult, unpaidResult] = await Promise.all([
      this.facturesDb.query(
        `SELECT COUNT(id) as count FROM facture WHERE organisation_id = $1 AND date_emission BETWEEN $2 AND $3`,
        [organisationId, dateDebut, dateFin],
      ),
      this.facturesDb.query(
        `
        SELECT COUNT(f.id) as count
        FROM facture f
        JOIN statut_facture sf ON f.statut_id = sf.id
        WHERE f.organisation_id = $1
          AND f.date_emission BETWEEN $2 AND $3
          AND sf.code IN ('IMPAYEE', 'EN_RETARD')
      `,
        [organisationId, dateDebut, dateFin],
      ),
    ]);

    const total = parseInt(totalResult[0]?.count || '0', 10);
    const unpaid = parseInt(unpaidResult[0]?.count || '0', 10);

    return total > 0 ? Math.round((unpaid / total) * 100 * 100) / 100 : 0;
  }

  private resolvePeriod(filters: DashboardFilters): { dateDebut: string; dateFin: string } {
    const now = new Date();
    return {
      dateDebut: filters.dateDebut || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      dateFin: filters.dateFin || now.toISOString().split('T')[0],
    };
  }
}

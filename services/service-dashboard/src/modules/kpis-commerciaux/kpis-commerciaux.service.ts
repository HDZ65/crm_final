import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DashboardFilters, Variation } from '../kpis/kpis.service';

export interface ClassementCommercial {
  commercialId: string;
  nomComplet: string;
  valeur: number;
  rang: number;
}

export interface KpisCommerciauxResult {
  nouveauxClientsMois: number;
  nouveauxClientsVariation: Variation;
  tauxConversion: number;
  tauxConversionVariation: Variation;
  panierMoyen: number;
  panierMoyenVariation: Variation;
  caPrevisionnel3Mois: number;
  classementParVentes: ClassementCommercial[];
  classementParCA: ClassementCommercial[];
  classementParConversion: ClassementCommercial[];
}

@Injectable()
export class KpisCommerciauxService {
  private readonly logger = new Logger(KpisCommerciauxService.name);

  constructor(
    @InjectDataSource()
    private readonly contratsDb: DataSource,
    @InjectDataSource('factures')
    private readonly facturesDb: DataSource,
    @InjectDataSource('clients')
    private readonly clientsDb: DataSource,
    @InjectDataSource('commerciaux')
    private readonly commerciauxDb: DataSource,
  ) {}

  async getKpisCommerciaux(filters: DashboardFilters): Promise<KpisCommerciauxResult> {
    // Validate organisationId - return default values if empty
    if (!filters.organisationId || filters.organisationId.trim() === '') {
      this.logger.warn('organisationId is empty, returning default values');
      return {
        nouveauxClientsMois: 0,
        nouveauxClientsVariation: { pourcentage: 0, tendance: 'stable' },
        tauxConversion: 0,
        tauxConversionVariation: { pourcentage: 0, tendance: 'stable' },
        panierMoyen: 0,
        panierMoyenVariation: { pourcentage: 0, tendance: 'stable' },
        caPrevisionnel3Mois: 0,
        classementParVentes: [],
        classementParCA: [],
        classementParConversion: [],
      };
    }

    this.logger.log(`Getting commercial KPIs for org ${filters.organisationId}`);

    const now = new Date();
    const dateDebut = filters.dateDebut || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const dateFin = filters.dateFin || now.toISOString().split('T')[0];

    // Previous period
    const prevStart = new Date(new Date(dateDebut).getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevEnd = new Date(new Date(dateDebut).getTime() - 1);
    const dateDebutPrev = prevStart.toISOString().split('T')[0];
    const dateFinPrev = prevEnd.toISOString().split('T')[0];

    // Get all metrics in parallel
    const [
      nouveauxClients,
      nouveauxClientsPrev,
      tauxConversion,
      tauxConversionPrev,
      panierMoyen,
      panierMoyenPrev,
      caPrevisionnel,
      classementVentes,
      classementCA,
      classementConversion,
    ] = await Promise.all([
      this.countNewClients(filters.organisationId, filters.societeId, dateDebut, dateFin),
      this.countNewClients(filters.organisationId, filters.societeId, dateDebutPrev, dateFinPrev),
      this.calculateConversionRate(filters.organisationId, filters.societeId, dateDebut, dateFin),
      this.calculateConversionRate(filters.organisationId, filters.societeId, dateDebutPrev, dateFinPrev),
      this.calculateAverageBasket(filters.organisationId, filters.societeId, dateDebut, dateFin),
      this.calculateAverageBasket(filters.organisationId, filters.societeId, dateDebutPrev, dateFinPrev),
      this.calculateForecast3Months(filters.organisationId, filters.societeId),
      this.getClassementByVentes(filters.organisationId, filters.societeId, dateDebut, dateFin),
      this.getClassementByCA(filters.organisationId, filters.societeId, dateDebut, dateFin),
      this.getClassementByConversion(filters.organisationId, filters.societeId, dateDebut, dateFin),
    ]);

    return {
      nouveauxClientsMois: nouveauxClients,
      nouveauxClientsVariation: this.calculateVariation(nouveauxClients, nouveauxClientsPrev),
      tauxConversion,
      tauxConversionVariation: this.calculateVariation(tauxConversion, tauxConversionPrev),
      panierMoyen,
      panierMoyenVariation: this.calculateVariation(panierMoyen, panierMoyenPrev),
      caPrevisionnel3Mois: caPrevisionnel,
      classementParVentes: classementVentes,
      classementParCA: classementCA,
      classementParConversion: classementConversion,
    };
  }

  private calculateVariation(current: number, previous: number): Variation {
    if (previous === 0) {
      return { pourcentage: current > 0 ? 100 : 0, tendance: current > 0 ? 'hausse' : 'stable' };
    }
    const pourcentage = Math.round(((current - previous) / previous) * 100 * 100) / 100;
    return {
      pourcentage: Math.abs(pourcentage),
      tendance: pourcentage > 0 ? 'hausse' : pourcentage < 0 ? 'baisse' : 'stable',
    };
  }

  private async countNewClients(organisationId: string, societeId: string | undefined, dateDebut: string, dateFin: string): Promise<number> {
    let query = `
      SELECT COUNT(DISTINCT id) as count
      FROM clientbases
      WHERE organisation_id = $1
        AND created_at BETWEEN $2 AND $3
    `;
    const params: any[] = [organisationId, dateDebut, dateFin];

    if (societeId) {
      query += ' AND societe_id = $4';
      params.push(societeId);
    }

    const result = await this.clientsDb.query(query, params);
    return parseInt(result[0]?.count || '0', 10);
  }

  private async calculateConversionRate(organisationId: string, societeId: string | undefined, dateDebut: string, dateFin: string): Promise<number> {
    // Get contracts from contrats_db
    let queryContracts = `
      SELECT COUNT(DISTINCT id) as count
      FROM contrat
      WHERE organisation_id = $1
        AND created_at BETWEEN $2 AND $3
    `;
    const contractParams: any[] = [organisationId, dateDebut, dateFin];

    if (societeId) {
      queryContracts += ' AND societe_id = $4';
      contractParams.push(societeId);
    }

    // Get clients from clients_db
    let queryClients = `
      SELECT COUNT(DISTINCT id) as count
      FROM clientbases
      WHERE organisation_id = $1
        AND created_at <= $2
    `;
    const clientParams: any[] = [organisationId, dateFin];

    if (societeId) {
      queryClients += ' AND societe_id = $3';
      clientParams.push(societeId);
    }

    const [contractsResult, clientsResult] = await Promise.all([
      this.contratsDb.query(queryContracts, contractParams),
      this.clientsDb.query(queryClients, clientParams),
    ]);

    const contracts = parseInt(contractsResult[0]?.count || '0', 10);
    const clients = parseInt(clientsResult[0]?.count || '0', 10);

    return clients > 0 ? Math.round((contracts / clients) * 100 * 100) / 100 : 0;
  }

  private async calculateAverageBasket(organisationId: string, societeId: string | undefined, dateDebut: string, dateFin: string): Promise<number> {
    let query = `
      SELECT COALESCE(AVG(montant_ht), 0) as avg_basket
      FROM facture
      WHERE organisation_id = $1
        AND date_emission BETWEEN $2 AND $3
    `;
    const params: any[] = [organisationId, dateDebut, dateFin];

    if (societeId) {
      query += ' AND societe_id = $4';
      params.push(societeId);
    }

    const result = await this.facturesDb.query(query, params);
    return Math.round(parseFloat(result[0]?.avg_basket || '0') * 100) / 100;
  }

  private async calculateForecast3Months(organisationId: string, societeId: string | undefined): Promise<number> {
    // Based on average of last 3 months + growth trend
    let query = `
      SELECT
        COALESCE(AVG(monthly_ca), 0) as avg_ca,
        COALESCE(REGR_SLOPE(monthly_ca, month_num), 0) as trend
      FROM (
        SELECT
          SUM(montant_ht) as monthly_ca,
          EXTRACT(EPOCH FROM date_trunc('month', date_emission)) / 86400 as month_num
        FROM facture
        WHERE organisation_id = $1
          AND date_emission >= NOW() - INTERVAL '6 months'
    `;
    const params: any[] = [organisationId];

    if (societeId) {
      query += ' AND societe_id = $2';
      params.push(societeId);
    }

    query += ' GROUP BY date_trunc(\'month\', date_emission)) sub';

    const result = await this.facturesDb.query(query, params);
    const avgCa = parseFloat(result[0]?.avg_ca || '0');
    const trend = parseFloat(result[0]?.trend || '0');

    // Forecast: 3 months * (average + trend adjustment)
    const forecast = (avgCa + trend * 30) * 3;
    return Math.round(Math.max(forecast, 0) * 100) / 100;
  }

  private async getClassementByVentes(organisationId: string, societeId: string | undefined, dateDebut: string, dateFin: string): Promise<ClassementCommercial[]> {
    try {
      // Get apporteurs from commerciaux_db
      const apporteurs = await this.commerciauxDb.query(
        `SELECT id, CONCAT(prenom, ' ', nom) as nom_complet FROM apporteurs WHERE organisation_id = $1`,
        [organisationId],
      );

      // For each apporteur, count contracts from contrats_db
      const results: { commercialId: string; nomComplet: string; valeur: number }[] = [];

      for (const a of apporteurs) {
        let query = `SELECT COUNT(DISTINCT id) as count FROM contrat WHERE organisation_id = $1 AND apporteur_id = $2 AND created_at BETWEEN $3 AND $4`;
        const params: any[] = [organisationId, a.id, dateDebut, dateFin];

        if (societeId) {
          query += ' AND societe_id = $5';
          params.push(societeId);
        }

        const countResult = await this.contratsDb.query(query, params);
        results.push({
          commercialId: a.id,
          nomComplet: a.nom_complet || 'N/A',
          valeur: parseInt(countResult[0]?.count || '0', 10),
        });
      }

      // Sort by value descending and assign ranks
      results.sort((a, b) => b.valeur - a.valeur);
      return results.slice(0, 10).map((r, index) => ({ ...r, rang: index + 1 }));
    } catch (error) {
      this.logger.warn(`Failed to get classement by ventes: ${error.message}`);
      return [];
    }
  }

  private async getClassementByCA(organisationId: string, societeId: string | undefined, dateDebut: string, dateFin: string): Promise<ClassementCommercial[]> {
    try {
      // Get apporteurs from commerciaux_db
      const apporteurs = await this.commerciauxDb.query(
        `SELECT id, CONCAT(prenom, ' ', nom) as nom_complet FROM apporteurs WHERE organisation_id = $1`,
        [organisationId],
      );

      // For each apporteur, get their contracts from contrats_db
      const results: { commercialId: string; nomComplet: string; valeur: number }[] = [];

      for (const a of apporteurs) {
        // Get contracts for this apporteur
        let contractQuery = `SELECT id FROM contrat WHERE organisation_id = $1 AND apporteur_id = $2`;
        const contractParams: any[] = [organisationId, a.id];

        if (societeId) {
          contractQuery += ' AND societe_id = $3';
          contractParams.push(societeId);
        }

        const contracts = await this.contratsDb.query(contractQuery, contractParams);
        const contractIds = contracts.map((c: any) => c.id);

        // If no contracts, value is 0
        if (contractIds.length === 0) {
          results.push({ commercialId: a.id, nomComplet: a.nom_complet || 'N/A', valeur: 0 });
          continue;
        }

        // Get CA for these contracts from factures_db
        const caResult = await this.facturesDb.query(
          `SELECT COALESCE(SUM(montant_ht), 0) as ca FROM facture WHERE contrat_id = ANY($1) AND date_emission BETWEEN $2 AND $3`,
          [contractIds, dateDebut, dateFin],
        );

        results.push({
          commercialId: a.id,
          nomComplet: a.nom_complet || 'N/A',
          valeur: Math.round(parseFloat(caResult[0]?.ca || '0') * 100) / 100,
        });
      }

      // Sort by value descending and assign ranks
      results.sort((a, b) => b.valeur - a.valeur);
      return results.slice(0, 10).map((r, index) => ({ ...r, rang: index + 1 }));
    } catch (error) {
      this.logger.warn(`Failed to get classement by CA: ${error.message}`);
      return [];
    }
  }

  private async getClassementByConversion(organisationId: string, societeId: string | undefined, dateDebut: string, dateFin: string): Promise<ClassementCommercial[]> {
    try {
      // Get apporteurs from commerciaux_db
      const apporteurs = await this.commerciauxDb.query(
        `SELECT id, CONCAT(prenom, ' ', nom) as nom_complet FROM apporteurs WHERE organisation_id = $1`,
        [organisationId],
      );

      const results: { commercialId: string; nomComplet: string; valeur: number }[] = [];

      for (const a of apporteurs) {
        // Count clients assigned to this apporteur from clients_db
        let clientQuery = `SELECT COUNT(DISTINCT id) as count FROM clientbases WHERE organisation_id = $1 AND apporteur_id = $2`;
        const clientParams: any[] = [organisationId, a.id];

        if (societeId) {
          clientQuery += ' AND societe_id = $3';
          clientParams.push(societeId);
        }

        // Count contracts for this apporteur from contrats_db
        let contractQuery = `SELECT COUNT(DISTINCT id) as count FROM contrat WHERE organisation_id = $1 AND apporteur_id = $2 AND created_at BETWEEN $3 AND $4`;
        const contractParams: any[] = [organisationId, a.id, dateDebut, dateFin];

        if (societeId) {
          contractQuery += ' AND societe_id = $5';
          contractParams.push(societeId);
        }

        const [clientsResult, contractsResult] = await Promise.all([
          this.clientsDb.query(clientQuery, clientParams),
          this.contratsDb.query(contractQuery, contractParams),
        ]);

        const clients = parseInt(clientsResult[0]?.count || '0', 10);
        const contracts = parseInt(contractsResult[0]?.count || '0', 10);

        const conversionRate = clients > 0 ? (contracts / clients) * 100 : 0;

        results.push({
          commercialId: a.id,
          nomComplet: a.nom_complet || 'N/A',
          valeur: Math.round(conversionRate * 100) / 100,
        });
      }

      // Sort by value descending and assign ranks
      results.sort((a, b) => b.valeur - a.valeur);
      return results.slice(0, 10).map((r, index) => ({ ...r, rang: index + 1 }));
    } catch (error) {
      this.logger.warn(`Failed to get classement by conversion: ${error.message}`);
      return [];
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DashboardFilters } from '../kpis/kpis.service';

export interface EvolutionCaMensuelle {
  mois: string;
  caRealise: number;
  objectif: number;
}

export interface EvolutionCaResult {
  periodeDebut: string;
  periodeFin: string;
  donnees: EvolutionCaMensuelle[];
}

@Injectable()
export class EvolutionCaService {
  private readonly logger = new Logger(EvolutionCaService.name);

  constructor(
    @InjectDataSource('factures')
    private readonly facturesDb: DataSource,
  ) {}

  async getEvolutionCa(filters: DashboardFilters): Promise<EvolutionCaResult> {
    // Validate organisationId - return empty result if empty
    if (!filters.organisationId || filters.organisationId.trim() === '') {
      this.logger.warn('organisationId is empty, returning empty evolution');
      const now = new Date();
      return {
        periodeDebut: new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0],
        periodeFin: now.toISOString().split('T')[0],
        donnees: [],
      };
    }

    this.logger.log(`Getting CA evolution for org ${filters.organisationId}`);

    // Default to last 12 months
    const now = new Date();
    const periodeDebut = filters.dateDebut || new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0];
    const periodeFin = filters.dateFin || now.toISOString().split('T')[0];

    let query = `
      SELECT
        TO_CHAR(f.date_emission, 'YYYY-MM') as mois,
        COALESCE(SUM(f.montant_ht), 0) as ca_realise
      FROM facture f
      WHERE f.organisation_id = $1
        AND f.date_emission BETWEEN $2 AND $3
    `;
    const params: any[] = [filters.organisationId, periodeDebut, periodeFin];

    // Note: facture table doesn't have societe_id column

    query += ' GROUP BY TO_CHAR(f.date_emission, \'YYYY-MM\') ORDER BY mois';

    const results = await this.facturesDb.query(query, params);

    // Get objectives (simplified - could be fetched from a dedicated table)
    const objectifMensuel = await this.getMonthlyObjective(filters.organisationId, filters.societeId);

    // Generate all months in range
    const donnees: EvolutionCaMensuelle[] = [];
    const startDate = new Date(periodeDebut);
    const endDate = new Date(periodeFin);
    const caByMonth: Map<string, number> = new Map(results.map((r: any) => [r.mois, parseFloat(r.ca_realise)]));

    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (current <= endDate) {
      const mois = current.toISOString().slice(0, 7);
      const caValue = caByMonth.get(mois) ?? 0;
      donnees.push({
        mois,
        caRealise: Math.round(caValue * 100) / 100,
        objectif: objectifMensuel,
      });
      current.setMonth(current.getMonth() + 1);
    }

    return { periodeDebut, periodeFin, donnees };
  }

  private async getMonthlyObjective(organisationId: string, societeId?: string): Promise<number> {
    // In a real implementation, this would fetch from an objectives table
    // For now, return a calculated value based on historical average
    let query = `
      SELECT COALESCE(AVG(monthly_ca), 0) as avg_ca
      FROM (
        SELECT SUM(f.montant_ht) as monthly_ca
        FROM facture f
        WHERE f.organisation_id = $1
          AND f.date_emission >= NOW() - INTERVAL '12 months'
    `;
    const params: any[] = [organisationId];

    // Note: facture table doesn't have societe_id column

    query += ' GROUP BY TO_CHAR(f.date_emission, \'YYYY-MM\')) subq';

    const result = await this.facturesDb.query(query, params);
    // Add 10% growth target
    return Math.round(parseFloat(result[0]?.avg_ca || '0') * 1.1 * 100) / 100;
  }
}

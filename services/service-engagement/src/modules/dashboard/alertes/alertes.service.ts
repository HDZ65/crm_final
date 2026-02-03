import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

// Import types from proto definitions
import type {
  DashboardFilters,
  Alerte,
  AlertesResponse,
} from '@crm/proto/dashboard';

// Threshold configuration
const THRESHOLDS = {
  tauxImpayes: { critique: 15, avertissement: 10, info: 5 },
  tauxChurn: { critique: 10, avertissement: 5, info: 3 },
  objectifCa: { critique: 70, avertissement: 85, info: 95 }, // Percentage of objective reached
};

type NiveauAlerte = 'critique' | 'avertissement' | 'info';

@Injectable()
export class AlertesService {
  private readonly logger = new Logger(AlertesService.name);

  constructor(
    @InjectDataSource()
    private readonly contratsDb: DataSource,
    @InjectDataSource('factures')
    private readonly facturesDb: DataSource,
    @InjectDataSource('organisations')
    private readonly organisationsDb: DataSource,
  ) {}

  async getAlertes(filters: DashboardFilters): Promise<AlertesResponse> {
    // Validate organisationId - return empty result if empty
    if (!filters.organisationId || filters.organisationId.trim() === '') {
      this.logger.warn('organisationId is empty, returning empty alerts');
      return {
        alertes: [],
        total: 0,
        nombreCritiques: 0,
        nombreAvertissements: 0,
        nombreInfos: 0,
      };
    }

    this.logger.log(`Getting alerts for org ${filters.organisationId}`);

    const alertes: Alerte[] = [];

    // Check unpaid rate alerts
    const unpaidAlertes = await this.checkUnpaidAlerts(filters);
    alertes.push(...unpaidAlertes);

    // Check churn alerts
    const churnAlertes = await this.checkChurnAlerts(filters);
    alertes.push(...churnAlertes);

    // Check CA objective alerts
    const caAlertes = await this.checkCaObjectiveAlerts(filters);
    alertes.push(...caAlertes);

    // Sort by level (critique first)
    alertes.sort((a, b) => {
      const order: Record<string, number> = { critique: 0, avertissement: 1, info: 2 };
      return (order[a.niveau] ?? 3) - (order[b.niveau] ?? 3);
    });

    return {
      alertes,
      total: alertes.length,
      nombreCritiques: alertes.filter((a) => a.niveau === 'critique').length,
      nombreAvertissements: alertes.filter((a) => a.niveau === 'avertissement').length,
      nombreInfos: alertes.filter((a) => a.niveau === 'info').length,
    };
  }

  private async checkUnpaidAlerts(filters: DashboardFilters): Promise<Alerte[]> {
    const alertes: Alerte[] = [];
    const now = new Date();
    const dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const dateFin = now.toISOString().split('T')[0];

    // Get societes from organisations_db
    let societesQuery = `SELECT id, nom FROM societes WHERE organisation_id = $1`;
    const societeParams: any[] = [filters.organisationId];
    if (filters.societeId) {
      societesQuery += ' AND id = $2';
      societeParams.push(filters.societeId);
    }
    const societes = await this.organisationsDb.query(societesQuery, societeParams);

    // For each societe, calculate unpaid rate from factures_db
    for (const s of societes) {
      const [totalResult, unpaidResult] = await Promise.all([
        this.facturesDb.query(
          `SELECT COUNT(id) as count FROM facture WHERE organisation_id = $1 AND date_emission BETWEEN $2 AND $3`,
          [filters.organisationId, dateDebut, dateFin],
        ),
        this.facturesDb.query(
          `SELECT COUNT(f.id) as count FROM facture f JOIN statut_facture sf ON f.statut_id = sf.id
           WHERE f.organisation_id = $1 AND f.date_emission BETWEEN $2 AND $3
           AND sf.code IN ('IMPAYEE', 'EN_RETARD')`,
          [filters.organisationId, dateDebut, dateFin],
        ),
      ]);

      const total = parseInt(totalResult[0]?.count || '0', 10);
      const unpaid = parseInt(unpaidResult[0]?.count || '0', 10);

      if (total > 0) {
        const taux = (unpaid / total) * 100;
        const niveau = this.getNiveau(taux, THRESHOLDS.tauxImpayes);

        if (niveau) {
          alertes.push({
            id: randomUUID(),
            titre: `Taux d'impayés élevé`,
            description: `Le taux d'impayés de ${s.nom} est de ${taux.toFixed(1)}%`,
            niveau,
            type: 'taux_impayes',
            valeurActuelle: Math.round(taux * 100) / 100,
            seuil: THRESHOLDS.tauxImpayes[niveau],
            dateDetection: now.toISOString(),
            entiteConcernee: s.nom,
            entiteId: s.id,
          });
        }
      }
    }

    return alertes;
  }

  private async checkChurnAlerts(filters: DashboardFilters): Promise<Alerte[]> {
    const alertes: Alerte[] = [];
    const now = new Date();
    const dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const dateFin = now.toISOString().split('T')[0];

    // Get societes from organisations_db
    let societesQuery = `SELECT id, nom FROM societes WHERE organisation_id = $1`;
    const societeParams: any[] = [filters.organisationId];
    if (filters.societeId) {
      societesQuery += ' AND id = $2';
      societeParams.push(filters.societeId);
    }
    const societes = await this.organisationsDb.query(societesQuery, societeParams);

    // For each societe, calculate churn rate from contrats_db
    for (const s of societes) {
      const [totalResult, cancelledResult] = await Promise.all([
        this.contratsDb.query(
          `SELECT COUNT(DISTINCT id) as count FROM contrat WHERE organisation_id = $1 AND societe_id = $2 AND date_debut <= $3`,
          [filters.organisationId, s.id, dateDebut],
        ),
        this.contratsDb.query(
          `SELECT COUNT(DISTINCT c.id) as count FROM contrat c
           WHERE c.organisation_id = $1 AND c.societe_id = $2 AND c.statut IN ('RESILIE', 'ANNULE')
           AND c.date_fin BETWEEN $3 AND $4`,
          [filters.organisationId, s.id, dateDebut, dateFin],
        ),
      ]);

      const total = parseInt(totalResult[0]?.count || '0', 10);
      const cancelled = parseInt(cancelledResult[0]?.count || '0', 10);

      if (total > 0) {
        const taux = (cancelled / total) * 100;
        const niveau = this.getNiveau(taux, THRESHOLDS.tauxChurn);

        if (niveau) {
          alertes.push({
            id: randomUUID(),
            titre: 'Taux de churn élevé',
            description: `Le taux de churn de ${s.nom} est de ${taux.toFixed(1)}%`,
            niveau,
            type: 'taux_churn',
            valeurActuelle: Math.round(taux * 100) / 100,
            seuil: THRESHOLDS.tauxChurn[niveau],
            dateDetection: now.toISOString(),
            entiteConcernee: s.nom,
            entiteId: s.id,
          });
        }
      }
    }

    return alertes;
  }

  private async checkCaObjectiveAlerts(filters: DashboardFilters): Promise<Alerte[]> {
    const alertes: Alerte[] = [];
    const now = new Date();
    const dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const dateFin = now.toISOString().split('T')[0];

    // Get societes from organisations_db
    let societesQuery = `SELECT id, nom FROM societes WHERE organisation_id = $1`;
    const societeParams: any[] = [filters.organisationId];
    if (filters.societeId) {
      societesQuery += ' AND id = $2';
      societeParams.push(filters.societeId);
    }
    const societes = await this.organisationsDb.query(societesQuery, societeParams);

    // For each societe, calculate CA vs objective from factures_db
    for (const s of societes) {
      // Get average monthly CA from last 3 months as objective
      const avgResult = await this.facturesDb.query(
        `SELECT COALESCE(AVG(monthly_ca), 0) as objectif FROM (
          SELECT SUM(montant_ht) as monthly_ca FROM facture
          WHERE organisation_id = $1 AND societe_id = $2
          AND date_emission >= NOW() - INTERVAL '3 months' AND date_emission < $3
          GROUP BY TO_CHAR(date_emission, 'YYYY-MM')
        ) sub`,
        [filters.organisationId, s.id, dateDebut],
      );

      const objectif = parseFloat(avgResult[0]?.objectif || '0');

      if (objectif > 0) {
        // Get current month CA
        const caResult = await this.facturesDb.query(
          `SELECT COALESCE(SUM(montant_ht), 0) as ca_realise FROM facture
           WHERE organisation_id = $1 AND societe_id = $2 AND date_emission BETWEEN $3 AND $4`,
          [filters.organisationId, s.id, dateDebut, dateFin],
        );

        const caRealise = parseFloat(caResult[0]?.ca_realise || '0');
        const pourcentage = (caRealise / objectif) * 100;

        // Invert logic: lower percentage means worse performance
        let niveau: NiveauAlerte | null = null;
        if (pourcentage < THRESHOLDS.objectifCa.critique) niveau = 'critique';
        else if (pourcentage < THRESHOLDS.objectifCa.avertissement) niveau = 'avertissement';
        else if (pourcentage < THRESHOLDS.objectifCa.info) niveau = 'info';

        if (niveau) {
          alertes.push({
            id: randomUUID(),
            titre: 'Objectif CA non atteint',
            description: `${s.nom} n'atteint que ${pourcentage.toFixed(1)}% de l'objectif mensuel`,
            niveau,
            type: 'objectif_ca',
            valeurActuelle: Math.round(pourcentage * 100) / 100,
            seuil: THRESHOLDS.objectifCa[niveau],
            dateDetection: now.toISOString(),
            entiteConcernee: s.nom,
            entiteId: s.id,
          });
        }
      }
    }

    return alertes;
  }

  private getNiveau(value: number, thresholds: { critique: number; avertissement: number; info: number }): NiveauAlerte | null {
    if (value >= thresholds.critique) return 'critique';
    if (value >= thresholds.avertissement) return 'avertissement';
    if (value >= thresholds.info) return 'info';
    return null;
  }
}

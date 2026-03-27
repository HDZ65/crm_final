import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ContratEntity } from '../../../../../domain/contrats/entities/contrat.entity';
import { LigneContratEntity } from '../../../../../domain/contrats/entities/ligne-contrat.entity';
import { ProduitEntity } from '../../../../../domain/products/entities/produit.entity';
import type {
  AlertesResponse,
  Alerte as AlerteType,
  KpisCommerciauxResponse,
  Variation as VariationType,
  RepartitionProduitsResponse,
  RepartitionProduit as RepartitionProduitType,
  DashboardFilters,
} from '@proto/dashboard';

// Configurable thresholds
interface AlertThresholds {
  contratExpirationCritiqueDays: number;
  contratExpirationAvertissementDays: number;
  tauxImpayesCritiquePct: number;
  tauxImpayesAvertissementPct: number;
  tauxChurnCritiquePct: number;
  tauxChurnAvertissementPct: number;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  contratExpirationCritiqueDays: 7,
  contratExpirationAvertissementDays: 30,
  tauxImpayesCritiquePct: 15,
  tauxImpayesAvertissementPct: 10,
  tauxChurnCritiquePct: 10,
  tauxChurnAvertissementPct: 5,
};

// Color palette for product distribution chart
const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly thresholds: AlertThresholds;

  constructor(
    @InjectRepository(ContratEntity)
    private readonly contratRepository: Repository<ContratEntity>,
    @InjectRepository(LigneContratEntity)
    private readonly ligneContratRepository: Repository<LigneContratEntity>,
    @InjectRepository(ProduitEntity)
    private readonly produitRepository: Repository<ProduitEntity>,
    private readonly configService: ConfigService,
  ) {
    this.thresholds = {
      contratExpirationCritiqueDays: this.configService.get<number>(
        'ALERT_CONTRAT_EXPIRATION_CRITIQUE_DAYS',
        DEFAULT_THRESHOLDS.contratExpirationCritiqueDays,
      ),
      contratExpirationAvertissementDays: this.configService.get<number>(
        'ALERT_CONTRAT_EXPIRATION_AVERTISSEMENT_DAYS',
        DEFAULT_THRESHOLDS.contratExpirationAvertissementDays,
      ),
      tauxImpayesCritiquePct: this.configService.get<number>(
        'ALERT_TAUX_IMPAYES_CRITIQUE_PCT',
        DEFAULT_THRESHOLDS.tauxImpayesCritiquePct,
      ),
      tauxImpayesAvertissementPct: this.configService.get<number>(
        'ALERT_TAUX_IMPAYES_AVERTISSEMENT_PCT',
        DEFAULT_THRESHOLDS.tauxImpayesAvertissementPct,
      ),
      tauxChurnCritiquePct: this.configService.get<number>(
        'ALERT_TAUX_CHURN_CRITIQUE_PCT',
        DEFAULT_THRESHOLDS.tauxChurnCritiquePct,
      ),
      tauxChurnAvertissementPct: this.configService.get<number>(
        'ALERT_TAUX_CHURN_AVERTISSEMENT_PCT',
        DEFAULT_THRESHOLDS.tauxChurnAvertissementPct,
      ),
    };
  }

  // =========================================================================
  // GetAlertes
  // =========================================================================

  async getAlertes(filters: DashboardFilters): Promise<AlertesResponse> {
    const now = new Date();
    const alertes: AlerteType[] = [];

    // 1. Contracts expiring soon
    await this.detectExpiringContracts(filters, now, alertes);

    // 2. High unpaid rate detection
    await this.detectHighUnpaidRate(filters, now, alertes);

    // 3. Abnormal churn detection
    await this.detectAbnormalChurn(filters, now, alertes);

    const nombreCritiques = alertes.filter((a) => a.niveau === 'critique').length;
    const nombreAvertissements = alertes.filter((a) => a.niveau === 'avertissement').length;
    const nombreInfos = alertes.filter((a) => a.niveau === 'info').length;

    return {
      alertes,
      total: alertes.length,
      nombre_critiques: nombreCritiques,
      nombre_avertissements: nombreAvertissements,
      nombre_infos: nombreInfos,
    };
  }

  private async detectExpiringContracts(
    filters: DashboardFilters,
    now: Date,
    alertes: AlerteType[],
  ): Promise<void> {
    const critiqueCutoff = new Date(now);
    critiqueCutoff.setDate(critiqueCutoff.getDate() + this.thresholds.contratExpirationCritiqueDays);

    const avertissementCutoff = new Date(now);
    avertissementCutoff.setDate(
      avertissementCutoff.getDate() + this.thresholds.contratExpirationAvertissementDays,
    );

    // Query contracts expiring within the avertissement window
    const qb = this.contratRepository
      .createQueryBuilder('c')
      .where('c.organisation_id = :orgId', { orgId: filters.organisation_id })
      .andWhere('c.statut IN (:...statuts)', { statuts: ['actif', 'en_cours', 'signe'] })
      .andWhere('c.date_fin IS NOT NULL')
      .andWhere('c.date_fin <= :cutoff', { cutoff: avertissementCutoff.toISOString().split('T')[0] })
      .andWhere('c.date_fin >= :now', { now: now.toISOString().split('T')[0] });

    if (filters.societe_id) {
      qb.andWhere('c.societe_id = :societeId', { societeId: filters.societe_id });
    }

    const expiringContracts = await qb.getMany();

    // Critique: expiring within N days
    const critiques = expiringContracts.filter(
      (c) => c.dateFin && new Date(c.dateFin) <= critiqueCutoff,
    );
    if (critiques.length > 0) {
      alertes.push({
        id: `alerte-expiration-critique-${now.getTime()}`,
        titre: `${critiques.length} contrat(s) expirant dans ${this.thresholds.contratExpirationCritiqueDays} jours`,
        description: `${critiques.length} contrat(s) actif(s) arrivent a echeance dans les ${this.thresholds.contratExpirationCritiqueDays} prochains jours et necessitent une action immediate.`,
        niveau: 'critique',
        type: 'objectif_ca',
        valeur_actuelle: critiques.length,
        seuil: 0,
        date_detection: now.toISOString(),
        entite_concernee: 'contrat',
        entite_id: critiques[0].id,
      });
    }

    // Avertissement: expiring within wider window
    const avertissements = expiringContracts.filter(
      (c) => c.dateFin && new Date(c.dateFin) > critiqueCutoff,
    );
    if (avertissements.length > 0) {
      alertes.push({
        id: `alerte-expiration-avertissement-${now.getTime()}`,
        titre: `${avertissements.length} contrat(s) expirant dans ${this.thresholds.contratExpirationAvertissementDays} jours`,
        description: `${avertissements.length} contrat(s) actif(s) arrivent a echeance dans les ${this.thresholds.contratExpirationAvertissementDays} prochains jours.`,
        niveau: 'avertissement',
        type: 'objectif_ca',
        valeur_actuelle: avertissements.length,
        seuil: 0,
        date_detection: now.toISOString(),
        entite_concernee: 'contrat',
        entite_id: avertissements[0].id,
      });
    }
  }

  private async detectHighUnpaidRate(
    filters: DashboardFilters,
    now: Date,
    alertes: AlerteType[],
  ): Promise<void> {
    // Calculate unpaid rate: contracts with statut 'impaye' / total active
    const orgFilter = { organisationId: filters.organisation_id } as any;
    if (filters.societe_id) orgFilter.societeId = filters.societe_id;

    const totalActive = await this.contratRepository.count({
      where: { ...orgFilter, statut: In(['actif', 'en_cours', 'signe', 'impaye']) },
    });

    if (totalActive === 0) return;

    const impayeCount = await this.contratRepository.count({
      where: { ...orgFilter, statut: 'impaye' },
    });

    const tauxImpayes = (impayeCount / totalActive) * 100;

    if (tauxImpayes >= this.thresholds.tauxImpayesCritiquePct) {
      alertes.push({
        id: `alerte-impayes-critique-${now.getTime()}`,
        titre: `Taux d'impayes critique: ${tauxImpayes.toFixed(1)}%`,
        description: `Le taux d'impayes (${tauxImpayes.toFixed(1)}%) depasse le seuil critique de ${this.thresholds.tauxImpayesCritiquePct}%. ${impayeCount} contrat(s) en impaye sur ${totalActive} actifs.`,
        niveau: 'critique',
        type: 'taux_impayes',
        valeur_actuelle: Math.round(tauxImpayes * 100) / 100,
        seuil: this.thresholds.tauxImpayesCritiquePct,
        date_detection: now.toISOString(),
        entite_concernee: 'organisation',
        entite_id: filters.organisation_id,
      });
    } else if (tauxImpayes >= this.thresholds.tauxImpayesAvertissementPct) {
      alertes.push({
        id: `alerte-impayes-avertissement-${now.getTime()}`,
        titre: `Taux d'impayes eleve: ${tauxImpayes.toFixed(1)}%`,
        description: `Le taux d'impayes (${tauxImpayes.toFixed(1)}%) depasse le seuil d'avertissement de ${this.thresholds.tauxImpayesAvertissementPct}%.`,
        niveau: 'avertissement',
        type: 'taux_impayes',
        valeur_actuelle: Math.round(tauxImpayes * 100) / 100,
        seuil: this.thresholds.tauxImpayesAvertissementPct,
        date_detection: now.toISOString(),
        entite_concernee: 'organisation',
        entite_id: filters.organisation_id,
      });
    }
  }

  private async detectAbnormalChurn(
    filters: DashboardFilters,
    now: Date,
    alertes: AlerteType[],
  ): Promise<void> {
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const orgFilter = { organisationId: filters.organisation_id } as any;
    if (filters.societe_id) orgFilter.societeId = filters.societe_id;

    // Contracts cancelled/resilie this month
    const qbCurrentChurn = this.contratRepository
      .createQueryBuilder('c')
      .where('c.organisation_id = :orgId', { orgId: filters.organisation_id })
      .andWhere('c.statut IN (:...statuts)', { statuts: ['resilie', 'annule'] })
      .andWhere('c.updated_at >= :start', { start: currentMonthStart.toISOString() });

    if (filters.societe_id) {
      qbCurrentChurn.andWhere('c.societe_id = :societeId', { societeId: filters.societe_id });
    }

    const currentChurn = await qbCurrentChurn.getCount();

    // Total active at start of month (approximation)
    const totalAtStart = await this.contratRepository
      .createQueryBuilder('c')
      .where('c.organisation_id = :orgId', { orgId: filters.organisation_id })
      .andWhere('c.created_at < :start', { start: currentMonthStart.toISOString() })
      .andWhere(
        '(c.statut IN (:...activeStatuts) OR (c.statut IN (:...churnStatuts) AND c.updated_at >= :start2))',
        {
          activeStatuts: ['actif', 'en_cours', 'signe'],
          churnStatuts: ['resilie', 'annule'],
          start2: currentMonthStart.toISOString(),
        },
      )
      .getCount();

    if (totalAtStart === 0) return;

    const tauxChurn = (currentChurn / totalAtStart) * 100;

    if (tauxChurn >= this.thresholds.tauxChurnCritiquePct) {
      alertes.push({
        id: `alerte-churn-critique-${now.getTime()}`,
        titre: `Taux de churn critique: ${tauxChurn.toFixed(1)}%`,
        description: `Le taux de churn mensuel (${tauxChurn.toFixed(1)}%) depasse le seuil critique de ${this.thresholds.tauxChurnCritiquePct}%. ${currentChurn} resiliation(s) ce mois.`,
        niveau: 'critique',
        type: 'taux_churn',
        valeur_actuelle: Math.round(tauxChurn * 100) / 100,
        seuil: this.thresholds.tauxChurnCritiquePct,
        date_detection: now.toISOString(),
        entite_concernee: 'organisation',
        entite_id: filters.organisation_id,
      });
    } else if (tauxChurn >= this.thresholds.tauxChurnAvertissementPct) {
      alertes.push({
        id: `alerte-churn-avertissement-${now.getTime()}`,
        titre: `Taux de churn eleve: ${tauxChurn.toFixed(1)}%`,
        description: `Le taux de churn mensuel (${tauxChurn.toFixed(1)}%) depasse le seuil d'avertissement de ${this.thresholds.tauxChurnAvertissementPct}%.`,
        niveau: 'avertissement',
        type: 'taux_churn',
        valeur_actuelle: Math.round(tauxChurn * 100) / 100,
        seuil: this.thresholds.tauxChurnAvertissementPct,
        date_detection: now.toISOString(),
        entite_concernee: 'organisation',
        entite_id: filters.organisation_id,
      });
    }
  }

  // =========================================================================
  // GetKpisCommerciaux
  // =========================================================================

  async getKpisCommerciaux(filters: DashboardFilters): Promise<KpisCommerciauxResponse> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const orgId = filters.organisation_id;
    const societeId = filters.societe_id;

    // ------ nouveaux_clients_mois ------
    const nouveauxClientsMois = await this.countDistinctNewClients(
      orgId,
      societeId,
      currentMonthStart,
      now,
    );
    const nouveauxClientsMoisPrecedent = await this.countDistinctNewClients(
      orgId,
      societeId,
      previousMonthStart,
      previousMonthEnd,
    );

    // ------ taux_conversion ------
    const { tauxConversion, tauxConversionPrecedent } = await this.calculateConversionRate(
      orgId,
      societeId,
      currentMonthStart,
      previousMonthStart,
      previousMonthEnd,
      now,
    );

    // ------ panier_moyen ------
    const { panierMoyen, panierMoyenPrecedent } = await this.calculatePanierMoyen(
      orgId,
      societeId,
      currentMonthStart,
      previousMonthStart,
      previousMonthEnd,
      now,
    );

    // ------ ca_previsionnel_3_mois ------
    const caPrevisionnel = await this.calculateCaPrevisionnel3Mois(orgId, societeId, now);

    // ------ classements ------
    const classementParVentes = await this.getClassementCommercial(orgId, societeId, 'count');
    const classementParCa = await this.getClassementCommercial(orgId, societeId, 'ca');

    return {
      nouveaux_clients_mois: nouveauxClientsMois,
      nouveaux_clients_variation: this.computeVariation(
        nouveauxClientsMois,
        nouveauxClientsMoisPrecedent,
      ),
      taux_conversion: Math.round(tauxConversion * 100) / 100,
      taux_conversion_variation: this.computeVariation(tauxConversion, tauxConversionPrecedent),
      panier_moyen: Math.round(panierMoyen * 100) / 100,
      panier_moyen_variation: this.computeVariation(panierMoyen, panierMoyenPrecedent),
      ca_previsionnel_3_mois: Math.round(caPrevisionnel * 100) / 100,
      classement_par_ventes: classementParVentes,
      classement_par_ca: classementParCa,
      classement_par_conversion: [], // Requires cross-service data (leads), left empty
    };
  }

  private async countDistinctNewClients(
    orgId: string,
    societeId: string | undefined,
    from: Date,
    to: Date,
  ): Promise<number> {
    const qb = this.contratRepository
      .createQueryBuilder('c')
      .select('COUNT(DISTINCT c.client_id)', 'count')
      .where('c.organisation_id = :orgId', { orgId })
      .andWhere('c.created_at >= :from', { from: from.toISOString() })
      .andWhere('c.created_at <= :to', { to: to.toISOString() });

    if (societeId) {
      qb.andWhere('c.societe_id = :societeId', { societeId });
    }

    // Only count clients whose first contract in the org is within this window
    qb.andWhere((subQb) => {
      const subQuery = subQb
        .subQuery()
        .select('MIN(c2.created_at)')
        .from(ContratEntity, 'c2')
        .where('c2.client_id = c.client_id')
        .andWhere('c2.organisation_id = :orgId')
        .getQuery();
      return `${subQuery} >= :from`;
    });

    const result = await qb.getRawOne();
    return parseInt(result?.count || '0', 10);
  }

  private async calculateConversionRate(
    orgId: string,
    societeId: string | undefined,
    currentStart: Date,
    prevStart: Date,
    prevEnd: Date,
    now: Date,
  ): Promise<{ tauxConversion: number; tauxConversionPrecedent: number }> {
    // Conversion = signed contracts / total contracts created
    const currentSigned = await this.countContractsByStatut(
      orgId,
      societeId,
      ['signe', 'actif', 'en_cours'],
      currentStart,
      now,
    );
    const currentTotal = await this.countContractsCreated(orgId, societeId, currentStart, now);

    const prevSigned = await this.countContractsByStatut(
      orgId,
      societeId,
      ['signe', 'actif', 'en_cours'],
      prevStart,
      prevEnd,
    );
    const prevTotal = await this.countContractsCreated(orgId, societeId, prevStart, prevEnd);

    return {
      tauxConversion: currentTotal > 0 ? (currentSigned / currentTotal) * 100 : 0,
      tauxConversionPrecedent: prevTotal > 0 ? (prevSigned / prevTotal) * 100 : 0,
    };
  }

  private async countContractsByStatut(
    orgId: string,
    societeId: string | undefined,
    statuts: string[],
    from: Date,
    to: Date,
  ): Promise<number> {
    const qb = this.contratRepository
      .createQueryBuilder('c')
      .where('c.organisation_id = :orgId', { orgId })
      .andWhere('c.statut IN (:...statuts)', { statuts })
      .andWhere('c.created_at >= :from', { from: from.toISOString() })
      .andWhere('c.created_at <= :to', { to: to.toISOString() });

    if (societeId) qb.andWhere('c.societe_id = :societeId', { societeId });

    return qb.getCount();
  }

  private async countContractsCreated(
    orgId: string,
    societeId: string | undefined,
    from: Date,
    to: Date,
  ): Promise<number> {
    const qb = this.contratRepository
      .createQueryBuilder('c')
      .where('c.organisation_id = :orgId', { orgId })
      .andWhere('c.created_at >= :from', { from: from.toISOString() })
      .andWhere('c.created_at <= :to', { to: to.toISOString() });

    if (societeId) qb.andWhere('c.societe_id = :societeId', { societeId });

    return qb.getCount();
  }

  private async calculatePanierMoyen(
    orgId: string,
    societeId: string | undefined,
    currentStart: Date,
    prevStart: Date,
    prevEnd: Date,
    now: Date,
  ): Promise<{ panierMoyen: number; panierMoyenPrecedent: number }> {
    const currentPanier = await this.avgMontantContrats(orgId, societeId, currentStart, now);
    const prevPanier = await this.avgMontantContrats(orgId, societeId, prevStart, prevEnd);

    return {
      panierMoyen: currentPanier,
      panierMoyenPrecedent: prevPanier,
    };
  }

  private async avgMontantContrats(
    orgId: string,
    societeId: string | undefined,
    from: Date,
    to: Date,
  ): Promise<number> {
    const qb = this.contratRepository
      .createQueryBuilder('c')
      .select('COALESCE(AVG(c.montant), 0)', 'avg')
      .where('c.organisation_id = :orgId', { orgId })
      .andWhere('c.statut IN (:...statuts)', { statuts: ['signe', 'actif', 'en_cours'] })
      .andWhere('c.created_at >= :from', { from: from.toISOString() })
      .andWhere('c.created_at <= :to', { to: to.toISOString() })
      .andWhere('c.montant IS NOT NULL');

    if (societeId) qb.andWhere('c.societe_id = :societeId', { societeId });

    const result = await qb.getRawOne();
    return parseFloat(result?.avg || '0');
  }

  private async calculateCaPrevisionnel3Mois(
    orgId: string,
    societeId: string | undefined,
    now: Date,
  ): Promise<number> {
    // Simple projection: average monthly CA from last 3 months * 3
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const qb = this.contratRepository
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.montant), 0)', 'total')
      .where('c.organisation_id = :orgId', { orgId })
      .andWhere('c.statut IN (:...statuts)', { statuts: ['signe', 'actif', 'en_cours'] })
      .andWhere('c.created_at >= :from', { from: threeMonthsAgo.toISOString() })
      .andWhere('c.created_at <= :to', { to: now.toISOString() })
      .andWhere('c.montant IS NOT NULL');

    if (societeId) qb.andWhere('c.societe_id = :societeId', { societeId });

    const result = await qb.getRawOne();
    const totalLast3Months = parseFloat(result?.total || '0');

    // Projection: extrapolate the average monthly rate for 3 months forward
    // avgMonthly * 3 = forecast
    const avgMonthly = totalLast3Months / 3;
    return avgMonthly * 3;
  }

  private async getClassementCommercial(
    orgId: string,
    societeId: string | undefined,
    mode: 'count' | 'ca',
  ): Promise<Array<{ commercial_id: string; nom_complet: string; valeur: number; rang: number }>> {
    const selectExpr = mode === 'count' ? 'COUNT(c.id)' : 'COALESCE(SUM(c.montant), 0)';

    const qb = this.contratRepository
      .createQueryBuilder('c')
      .select('c.commercial_id', 'commercial_id')
      .addSelect(`${selectExpr}`, 'valeur')
      .where('c.organisation_id = :orgId', { orgId })
      .andWhere('c.statut IN (:...statuts)', { statuts: ['signe', 'actif', 'en_cours'] })
      .groupBy('c.commercial_id')
      .orderBy('valeur', 'DESC')
      .limit(10);

    if (societeId) qb.andWhere('c.societe_id = :societeId', { societeId });

    const results = await qb.getRawMany();

    return results.map((r, index) => ({
      commercial_id: r.commercial_id,
      nom_complet: '', // Would need cross-service call to get names
      valeur: parseFloat(r.valeur || '0'),
      rang: index + 1,
    }));
  }

  // =========================================================================
  // GetRepartitionProduits
  // =========================================================================

  async getRepartitionProduits(
    filters: DashboardFilters,
  ): Promise<RepartitionProduitsResponse> {
    const orgId = filters.organisation_id;

    // Aggregate CA by product through ligne_contrat joined with contrat
    const qb = this.ligneContratRepository
      .createQueryBuilder('lc')
      .select('lc.produit_id', 'produit_id')
      .addSelect('COALESCE(SUM(lc.prix_unitaire * lc.quantite), 0)', 'ca')
      .innerJoin('lc.contrat', 'c')
      .where('c.organisation_id = :orgId', { orgId })
      .andWhere('c.statut IN (:...statuts)', { statuts: ['signe', 'actif', 'en_cours'] })
      .groupBy('lc.produit_id')
      .orderBy('ca', 'DESC');

    if (filters.societe_id) {
      qb.andWhere('c.societe_id = :societeId', { societeId: filters.societe_id });
    }

    // Apply date filters if present
    if (filters.date_debut) {
      qb.andWhere('c.created_at >= :dateDebut', { dateDebut: filters.date_debut });
    }
    if (filters.date_fin) {
      qb.andWhere('c.created_at <= :dateFin', { dateFin: filters.date_fin });
    }

    const rawProducts = await qb.getRawMany();

    // Calculate total CA
    const caTotal = rawProducts.reduce(
      (sum: number, r: any) => sum + parseFloat(r.ca || '0'),
      0,
    );

    // Fetch product names
    const produitIds = rawProducts.map((r: any) => r.produit_id).filter(Boolean);
    const produits =
      produitIds.length > 0
        ? await this.produitRepository.find({
            where: { id: In(produitIds) },
            select: ['id', 'nom'],
          })
        : [];

    const produitMap = new Map(produits.map((p) => [p.id, p.nom]));

    const repartition: RepartitionProduitType[] = rawProducts.map((r: any, index: number) => {
      const ca = parseFloat(r.ca || '0');
      return {
        produit_id: r.produit_id,
        nom_produit: produitMap.get(r.produit_id) || 'Produit inconnu',
        ca: Math.round(ca * 100) / 100,
        pourcentage: caTotal > 0 ? Math.round((ca / caTotal) * 10000) / 100 : 0,
        couleur: CHART_COLORS[index % CHART_COLORS.length],
      };
    });

    return {
      ca_total: Math.round(caTotal * 100) / 100,
      produits: repartition,
    };
  }

  // =========================================================================
  // Utility
  // =========================================================================

  private computeVariation(current: number, previous: number): VariationType {
    if (previous === 0) {
      return {
        pourcentage: current > 0 ? 100 : 0,
        tendance: current > 0 ? 'hausse' : 'stable',
      };
    }

    const pct = ((current - previous) / previous) * 100;
    const rounded = Math.round(pct * 100) / 100;

    return {
      pourcentage: Math.abs(rounded),
      tendance: rounded > 1 ? 'hausse' : rounded < -1 ? 'baisse' : 'stable',
    };
  }
}

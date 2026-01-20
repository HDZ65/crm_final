import { Injectable, Inject } from '@nestjs/common';
import type { BaremeCommissionRepositoryPort } from '../../core/port/bareme-commission-repository.port';
import type { PalierCommissionRepositoryPort } from '../../core/port/palier-commission-repository.port';
import type { CommissionRepositoryPort } from '../../core/port/commission-repository.port';
import type { RepriseCommissionRepositoryPort } from '../../core/port/reprise-commission-repository.port';
import type { BordereauCommissionRepositoryPort } from '../../core/port/bordereau-commission-repository.port';
import type { LigneBordereauRepositoryPort } from '../../core/port/ligne-bordereau-repository.port';
import { CommissionEntity } from '../../core/domain/commission.entity';
import { RepriseCommissionEntity } from '../../core/domain/reprise-commission.entity';
import { BordereauCommissionEntity } from '../../core/domain/bordereau-commission.entity';
import { LigneBordereauEntity } from '../../core/domain/ligne-bordereau.entity';
import { BaremeCommissionEntity } from '../../core/domain/bareme-commission.entity';
import { PalierCommissionEntity } from '../../core/domain/palier-commission.entity';

export interface CalculCommissionInput {
  organisationId: string;
  contratId: string;
  apporteurId: string;
  produitId?: string;
  typeProduit?: string;
  profilRemuneration?: string;
  baseCalcul: number; // Cotisation HT ou CA HT selon le barème
  periode: string; // YYYY-MM
  referenceContrat: string;
  clientNom?: string;
  produitNom?: string;
  compagnie?: string;
}

export interface CalculCommissionResult {
  commission: CommissionEntity | null;
  bareme: BaremeCommissionEntity | null;
  primes: PalierCommissionEntity[];
  erreur?: string;
}

export interface GenerationBordereauInput {
  organisationId: string;
  apporteurId: string;
  periode: string;
  creePar?: string;
}

export interface GenerationBordereauResult {
  bordereau: BordereauCommissionEntity;
  lignes: LigneBordereauEntity[];
  nombreCommissions: number;
  nombreReprises: number;
  totalBrut: number;
  totalReprises: number;
  totalNet: number;
}

@Injectable()
export class CommissionEngineService {
  constructor(
    @Inject('BaremeCommissionRepositoryPort')
    private readonly baremeRepository: BaremeCommissionRepositoryPort,
    @Inject('PalierCommissionRepositoryPort')
    private readonly palierRepository: PalierCommissionRepositoryPort,
    @Inject('CommissionRepositoryPort')
    private readonly commissionRepository: CommissionRepositoryPort,
    @Inject('RepriseCommissionRepositoryPort')
    private readonly repriseRepository: RepriseCommissionRepositoryPort,
    @Inject('BordereauCommissionRepositoryPort')
    private readonly bordereauRepository: BordereauCommissionRepositoryPort,
    @Inject('LigneBordereauRepositoryPort')
    private readonly ligneRepository: LigneBordereauRepositoryPort,
  ) {}

  /**
   * Calcule une commission pour un contrat donné selon le barème applicable
   */
  async calculerCommission(
    input: CalculCommissionInput,
  ): Promise<CalculCommissionResult> {
    // 1. Trouver le barème applicable
    const bareme = await this.baremeRepository.findApplicable(
      input.organisationId,
      input.typeProduit,
      input.profilRemuneration,
    );

    if (!bareme) {
      return {
        commission: null,
        bareme: null,
        primes: [],
        erreur: 'Aucun barème applicable trouvé',
      };
    }

    // 2. Calculer le montant selon le type de calcul
    let montantBrut = 0;

    switch (bareme.typeCalcul) {
      case 'fixe':
        montantBrut = bareme.montantFixe ?? 0;
        break;

      case 'pourcentage':
        montantBrut = (input.baseCalcul * (bareme.tauxPourcentage ?? 0)) / 100;
        break;

      case 'palier':
        // Chercher le palier applicable
        const palier = await this.palierRepository.findPalierApplicable(
          bareme.id,
          'volume',
          input.baseCalcul,
        );
        if (palier) {
          montantBrut = palier.montantPrime;
        }
        break;

      case 'mixte':
        // Fixe + % selon le barème
        montantBrut =
          (bareme.montantFixe ?? 0) +
          (input.baseCalcul * (bareme.tauxPourcentage ?? 0)) / 100;
        break;
    }

    // 3. Calculer les primes paliers cumulables
    const primes: PalierCommissionEntity[] = [];
    const paliersProduit = await this.palierRepository.findActifsByBaremeId(
      bareme.id,
    );

    for (const p of paliersProduit) {
      if (p.typePalier === 'prime_produit' && p.cumulable) {
        // Vérifier si le seuil est atteint (logique simplifiée)
        // Dans une implémentation complète, on compterait les contrats par type
        primes.push(p);
      }
    }

    // 4. Créer l'entité commission
    const reference = this.genererReferenceCommission(
      input.organisationId,
      input.periode,
    );

    const commission = new CommissionEntity({
      organisationId: input.organisationId,
      reference,
      apporteurId: input.apporteurId,
      contratId: input.contratId,
      produitId: input.produitId ?? null,
      compagnie: input.compagnie ?? 'Non spécifié',
      typeBase: bareme.baseCalcul,
      montantBrut,
      montantReprises: 0,
      montantAcomptes: 0,
      montantNetAPayer: montantBrut,
      statutId: 'a_payer', // Statut par défaut
      periode: input.periode,
      dateCreation: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      commission,
      bareme,
      primes,
    };
  }

  /**
   * Génère automatiquement un bordereau pour un apporteur et une période
   */
  async genererBordereau(
    input: GenerationBordereauInput,
  ): Promise<GenerationBordereauResult> {
    // 1. Vérifier si un bordereau existe déjà
    const existant = await this.bordereauRepository.findByApporteurAndPeriode(
      input.apporteurId,
      input.periode,
    );

    if (existant && existant.statutBordereau !== 'brouillon') {
      throw new Error(
        'Un bordereau validé existe déjà pour cet apporteur et cette période',
      );
    }

    // 2. Récupérer les commissions de la période
    const commissions = await this.commissionRepository.findByPeriode(
      input.periode,
    );
    const commissionsApporteur = commissions.filter(
      (c) =>
        c.apporteurId === input.apporteurId &&
        c.organisationId === input.organisationId,
    );

    // 3. Récupérer les reprises en attente
    const reprises = await this.repriseRepository.findEnAttente(
      input.organisationId,
    );
    const reprisesApporteur = reprises.filter(
      (r) =>
        r.apporteurId === input.apporteurId &&
        r.periodeApplication === input.periode,
    );

    // 4. Créer ou mettre à jour le bordereau
    const reference = this.genererReferenceBordereau(
      input.organisationId,
      input.periode,
      input.apporteurId,
    );

    let bordereau: BordereauCommissionEntity;

    if (existant) {
      // Supprimer les anciennes lignes
      await this.ligneRepository.deleteByBordereauId(existant.id);
      bordereau = existant;
    } else {
      bordereau = new BordereauCommissionEntity({
        organisationId: input.organisationId,
        reference,
        periode: input.periode,
        apporteurId: input.apporteurId,
        totalBrut: 0,
        totalReprises: 0,
        totalAcomptes: 0,
        totalNetAPayer: 0,
        nombreLignes: 0,
        statutBordereau: 'brouillon',
        dateValidation: null,
        validateurId: null,
        dateExport: null,
        fichierPdfUrl: null,
        fichierExcelUrl: null,
        commentaire: null,
        creePar: input.creePar ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      bordereau = await this.bordereauRepository.create(bordereau);
    }

    // 5. Créer les lignes du bordereau
    const lignes: LigneBordereauEntity[] = [];
    let totalBrut = 0;
    let totalReprises = 0;
    let ordre = 0;

    // Lignes de commission
    for (const comm of commissionsApporteur) {
      const ligne = new LigneBordereauEntity({
        organisationId: input.organisationId,
        bordereauId: bordereau.id,
        commissionId: comm.id,
        repriseId: null,
        typeLigne: 'commission',
        contratId: comm.contratId,
        contratReference: comm.reference,
        clientNom: null, // À enrichir avec les données du contrat
        produitNom: null,
        montantBrut: comm.montantBrut,
        montantReprise: 0,
        montantNet: comm.montantBrut,
        baseCalcul: comm.typeBase,
        tauxApplique: null,
        baremeId: null,
        statutLigne: 'selectionnee',
        selectionne: true,
        motifDeselection: null,
        validateurId: null,
        dateValidation: null,
        ordre: ordre++,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedLigne = await this.ligneRepository.create(ligne);
      lignes.push(savedLigne);
      totalBrut += comm.montantBrut;
    }

    // Lignes de reprise
    for (const reprise of reprisesApporteur) {
      const ligne = new LigneBordereauEntity({
        organisationId: input.organisationId,
        bordereauId: bordereau.id,
        commissionId: null,
        repriseId: reprise.id,
        typeLigne: 'reprise',
        contratId: reprise.contratId,
        contratReference: reprise.reference,
        clientNom: null,
        produitNom: null,
        montantBrut: 0,
        montantReprise: Math.abs(reprise.montantReprise),
        montantNet: -Math.abs(reprise.montantReprise),
        baseCalcul: null,
        tauxApplique: reprise.tauxReprise,
        baremeId: null,
        statutLigne: 'selectionnee',
        selectionne: true,
        motifDeselection: null,
        validateurId: null,
        dateValidation: null,
        ordre: ordre++,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedLigne = await this.ligneRepository.create(ligne);
      lignes.push(savedLigne);
      totalReprises += Math.abs(reprise.montantReprise);
    }

    // 6. Mettre à jour les totaux du bordereau
    const totalNet = totalBrut - totalReprises;

    bordereau.totalBrut = totalBrut;
    bordereau.totalReprises = totalReprises;
    bordereau.totalNetAPayer = totalNet;
    bordereau.nombreLignes = lignes.length;
    bordereau.updatedAt = new Date();

    await this.bordereauRepository.update(bordereau.id, bordereau);

    return {
      bordereau,
      lignes,
      nombreCommissions: commissionsApporteur.length,
      nombreReprises: reprisesApporteur.length,
      totalBrut,
      totalReprises,
      totalNet,
    };
  }

  /**
   * Déclenche une reprise automatique suite à résiliation/impayé
   */
  async declencherReprise(
    commissionId: string,
    typeReprise: 'resiliation' | 'impaye' | 'annulation',
    dateEvenement: Date,
    motif?: string,
  ): Promise<RepriseCommissionEntity | null> {
    const commission = await this.commissionRepository.findById(commissionId);
    if (!commission) {
      return null;
    }

    // Trouver le barème pour connaître la durée et taux de reprise
    const bareme = await this.baremeRepository.findApplicable(
      commission.organisationId,
    );

    const dureeReprisesMois = bareme?.dureeReprisesMois ?? 3;
    const tauxReprise = bareme?.tauxReprise ?? 100;

    // Vérifier si la commission est dans la fenêtre de reprise
    const dateCommission = new Date(commission.dateCreation);
    const dateLimite = new Date(dateCommission);
    dateLimite.setMonth(dateLimite.getMonth() + dureeReprisesMois);

    if (dateEvenement > dateLimite) {
      // Hors fenêtre de reprise
      return null;
    }

    // Calculer le montant de reprise
    const montantReprise = -(commission.montantBrut * tauxReprise) / 100;

    // Période d'application = mois suivant
    const periodeApplication = this.getPeriodeSuivante(
      this.formatPeriode(dateEvenement),
    );

    const reference = this.genererReferenceReprise(
      commission.organisationId,
      periodeApplication,
    );

    const reprise = new RepriseCommissionEntity({
      organisationId: commission.organisationId,
      commissionOriginaleId: commissionId,
      contratId: commission.contratId,
      apporteurId: commission.apporteurId,
      reference,
      typeReprise,
      montantReprise,
      tauxReprise,
      montantOriginal: commission.montantBrut,
      periodeOrigine: commission.periode,
      periodeApplication,
      dateEvenement,
      dateLimite,
      dateApplication: null,
      statutReprise: 'en_attente',
      bordereauId: null,
      motif: motif ?? null,
      commentaire: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.repriseRepository.create(reprise);
  }

  // ========== Méthodes utilitaires ==========

  private genererReferenceCommission(
    organisationId: string,
    periode: string,
  ): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `COM-${periode}-${timestamp}`;
  }

  private genererReferenceBordereau(
    organisationId: string,
    periode: string,
    apporteurId: string,
  ): string {
    const shortApporteur = apporteurId.substring(0, 4).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `BRD-${periode}-${shortApporteur}-${timestamp}`;
  }

  private genererReferenceReprise(
    organisationId: string,
    periode: string,
  ): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `REP-${periode}-${timestamp}`;
  }

  private formatPeriode(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  private getPeriodeSuivante(periode: string): string {
    const [year, month] = periode.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
  }
}

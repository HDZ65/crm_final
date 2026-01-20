import { Injectable, Logger } from '@nestjs/common';
import { CommissionService } from '../commission/commission.service';
import { BaremeService } from '../bareme/bareme.service';
import { BordereauService } from '../bordereau/bordereau.service';
import { LigneBordereauService } from '../ligne-bordereau/ligne-bordereau.service';
import { RepriseService } from '../reprise/reprise.service';
import { StatutService } from '../statut/statut.service';
import { CommissionEntity } from '../commission/entities/commission.entity';
import { BaremeCommissionEntity, TypeCalcul } from '../bareme/entities/bareme-commission.entity';
import { BordereauCommissionEntity } from '../bordereau/entities/bordereau-commission.entity';
import { TypeLigne } from '../ligne-bordereau/entities/ligne-bordereau.entity';
import { TypeReprise, StatutReprise } from '../reprise/entities/reprise-commission.entity';

export interface CalculerCommissionInput {
  organisationId: string;
  apporteurId: string;
  contratId: string;
  produitId?: string;
  typeProduit: string;
  profilRemuneration: string;
  societeId?: string;
  canalVente?: string;
  montantBase: number;
  periode: string;
}

export interface PrimeApplicable {
  palierId: string;
  palierNom: string;
  montant: number;
  type: string;
}

export interface CalculerCommissionResult {
  commission: CommissionEntity;
  baremeApplique: BaremeCommissionEntity;
  primes: PrimeApplicable[];
  montantTotal: number;
}

export interface GenererBordereauResult {
  bordereau: BordereauCommissionEntity;
  summary: {
    nombreCommissions: number;
    nombreReprises: number;
    nombrePrimes: number;
    totalBrut: number;
    totalReprises: number;
    totalNet: number;
  };
}

@Injectable()
export class CommissionEngineService {
  private readonly logger = new Logger(CommissionEngineService.name);

  constructor(
    private readonly commissionService: CommissionService,
    private readonly baremeService: BaremeService,
    private readonly bordereauService: BordereauService,
    private readonly ligneService: LigneBordereauService,
    private readonly repriseService: RepriseService,
    private readonly statutService: StatutService,
  ) {}

  async calculerCommission(input: CalculerCommissionInput): Promise<CalculerCommissionResult> {
    // 1. Find applicable bareme
    const bareme = await this.baremeService.findApplicable(input.organisationId, {
      typeProduit: input.typeProduit,
      profilRemuneration: input.profilRemuneration,
      societeId: input.societeId,
      canalVente: input.canalVente,
      date: new Date().toISOString(),
    });

    if (!bareme) {
      throw new Error('No applicable bareme found');
    }

    // 2. Calculate gross amount based on type
    let montantBrut = 0;
    switch (bareme.typeCalcul) {
      case TypeCalcul.FIXE:
        montantBrut = Number(bareme.montantFixe) || 0;
        break;
      case TypeCalcul.POURCENTAGE:
        montantBrut = input.montantBase * (Number(bareme.tauxPourcentage) / 100);
        break;
      case TypeCalcul.PALIER:
      case TypeCalcul.MIXTE:
        // For palier/mixte, start with percentage if available
        if (bareme.tauxPourcentage) {
          montantBrut = input.montantBase * (Number(bareme.tauxPourcentage) / 100);
        } else if (bareme.montantFixe) {
          montantBrut = Number(bareme.montantFixe);
        }
        break;
    }

    // 3. Find applicable primes (paliers)
    const primes: PrimeApplicable[] = [];
    if (bareme.paliers && bareme.paliers.length > 0) {
      for (const palier of bareme.paliers) {
        if (!palier.actif) continue;
        // Simplified check - in real implementation, would check accumulated values
        if (input.montantBase >= Number(palier.seuilMin)) {
          if (!palier.seuilMax || input.montantBase <= Number(palier.seuilMax)) {
            primes.push({
              palierId: palier.id,
              palierNom: palier.nom,
              montant: Number(palier.montantPrime),
              type: palier.typePalier,
            });
          }
        }
      }
    }

    // 4. Calculate total with primes
    const totalPrimes = primes.reduce((sum, p) => sum + p.montant, 0);
    const montantTotal = montantBrut + totalPrimes;

    // 5. Get default status
    const statutEnAttente = await this.statutService.findByCode('en_attente').catch(() => null);

    // 6. Create commission
    const reference = `COM-${input.periode}-${Date.now().toString(36).toUpperCase()}`;
    const commission = await this.commissionService.create({
      organisationId: input.organisationId,
      reference,
      apporteurId: input.apporteurId,
      contratId: input.contratId,
      produitId: input.produitId || null,
      compagnie: input.typeProduit,
      typeBase: bareme.baseCalcul,
      montantBrut,
      montantReprises: 0,
      montantAcomptes: 0,
      montantNetAPayer: montantTotal,
      statutId: statutEnAttente?.id || '',
      periode: input.periode,
      dateCreation: new Date(),
    });

    this.logger.log(`Calculated commission ${commission.id}: ${montantTotal}€`);

    return {
      commission,
      baremeApplique: bareme,
      primes,
      montantTotal,
    };
  }

  async genererBordereau(
    organisationId: string,
    apporteurId: string,
    periode: string,
    creePar?: string,
  ): Promise<GenererBordereauResult> {
    // 1. Check if bordereau already exists
    let bordereau = await this.bordereauService.findByApporteurAndPeriode(
      organisationId,
      apporteurId,
      periode,
    );

    if (!bordereau) {
      const reference = `BRD-${periode}-${apporteurId.substring(0, 8).toUpperCase()}`;
      bordereau = await this.bordereauService.create({
        organisationId,
        reference,
        periode,
        apporteurId,
        creePar,
      });
    } else {
      // Clear existing lines
      await this.ligneService.deleteByBordereau(bordereau.id);
    }

    // 2. Get all commissions for this period
    const { commissions } = await this.commissionService.findByOrganisation(organisationId, {
      apporteurId,
      periode,
    });

    // 3. Get pending reprises
    const reprises = await this.repriseService.findPending(organisationId, apporteurId, periode);

    // 4. Create ligne for each commission
    let ordre = 0;
    let totalBrut = 0;
    let totalReprises = 0;

    for (const commission of commissions) {
      await this.ligneService.create({
        organisationId,
        bordereauId: bordereau.id,
        commissionId: commission.id,
        typeLigne: TypeLigne.COMMISSION,
        contratId: commission.contratId,
        contratReference: commission.reference,
        produitNom: commission.compagnie,
        montantBrut: commission.montantBrut,
        montantReprise: 0,
        montantNet: commission.montantNetAPayer,
        baseCalcul: commission.typeBase,
        ordre: ordre++,
      });
      totalBrut += Number(commission.montantBrut);
    }

    // 5. Create ligne for each reprise
    for (const reprise of reprises) {
      await this.ligneService.create({
        organisationId,
        bordereauId: bordereau.id,
        repriseId: reprise.id,
        typeLigne: TypeLigne.REPRISE,
        contratId: reprise.contratId,
        contratReference: reprise.reference,
        montantBrut: 0,
        montantReprise: reprise.montantReprise,
        montantNet: -reprise.montantReprise,
        ordre: ordre++,
      });
      totalReprises += Number(reprise.montantReprise);

      // Mark reprise as applied
      await this.repriseService.apply(reprise.id, bordereau.id);
    }

    // 6. Update bordereau totals
    const totalNet = totalBrut - totalReprises;
    await this.bordereauService.updateTotals(bordereau.id, {
      totalBrut,
      totalReprises,
      totalAcomptes: 0,
      totalNetAPayer: totalNet,
      nombreLignes: ordre,
    });

    // 7. Reload bordereau with lines
    bordereau = await this.bordereauService.findById(bordereau.id);

    const summary = {
      nombreCommissions: commissions.length,
      nombreReprises: reprises.length,
      nombrePrimes: 0,
      totalBrut,
      totalReprises,
      totalNet,
    };

    this.logger.log(`Generated bordereau ${bordereau.id} with ${ordre} lines, net: ${totalNet}€`);

    return { bordereau, summary };
  }

  async declencherReprise(
    commissionId: string,
    typeReprise: TypeReprise,
    dateEvenement: Date,
    motif?: string,
  ) {
    // 1. Get original commission
    const commission = await this.commissionService.findById(commissionId);

    // 2. Calculate reprise amount (100% by default)
    const montantReprise = Number(commission.montantNetAPayer);

    // 3. Calculate deadline based on bareme (default 3 months)
    const dateLimite = new Date(commission.dateCreation);
    dateLimite.setMonth(dateLimite.getMonth() + 3);

    // 4. Check if still within reprise window
    if (dateEvenement > dateLimite) {
      throw new Error('Reprise window has expired');
    }

    // 5. Calculate application period (next month)
    const now = new Date();
    const periodeApplication = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;

    // 6. Create reprise
    const reference = `REP-${periodeApplication}-${Date.now().toString(36).toUpperCase()}`;
    const reprise = await this.repriseService.create({
      organisationId: commission.organisationId,
      commissionOriginaleId: commissionId,
      contratId: commission.contratId,
      apporteurId: commission.apporteurId,
      reference,
      typeReprise,
      montantReprise,
      tauxReprise: 100,
      montantOriginal: montantReprise,
      periodeOrigine: commission.periode,
      periodeApplication,
      dateEvenement,
      dateLimite,
      motif,
    });

    this.logger.log(`Created reprise ${reprise.id} for commission ${commissionId}`);

    return reprise;
  }
}

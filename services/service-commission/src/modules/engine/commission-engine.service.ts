import { Injectable, Logger } from '@nestjs/common';
import { CommissionService } from '../commission/commission.service';
import { BaremeService } from '../bareme/bareme.service';
import { BordereauService } from '../bordereau/bordereau.service';
import { LigneBordereauService } from '../ligne-bordereau/ligne-bordereau.service';
import { RepriseService } from '../reprise/reprise.service';
import { StatutService } from '../statut/statut.service';
import { CommissionAuditService } from '../audit/audit.service';
import { RecurrenceService } from '../recurrence/recurrence.service';
import { ReportNegatifService } from '../report/report.service';
import { CommissionEntity } from '../commission/entities/commission.entity';
import { BaremeCommissionEntity, TypeCalcul } from '../bareme/entities/bareme-commission.entity';
import { BordereauCommissionEntity } from '../bordereau/entities/bordereau-commission.entity';
import { TypeLigne } from '../ligne-bordereau/entities/ligne-bordereau.entity';
import { TypeReprise } from '../reprise/entities/reprise-commission.entity';
import { AuditAction, AuditScope } from '../audit/entities/commission-audit-log.entity';

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
  echeanceId?: string;
  dateEncaissement?: Date;
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
  recurrenceGeneree?: boolean;
}

export interface GenererBordereauResult {
  bordereau: BordereauCommissionEntity;
  summary: {
    nombreCommissions: number;
    nombreReprises: number;
    nombreRecurrences: number;
    nombrePrimes: number;
    totalBrut: number;
    totalReprises: number;
    totalReportsAppliques: number;
    totalNet: number;
    reportNegatifGenere: number;
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
    private readonly auditService: CommissionAuditService,
    private readonly recurrenceService: RecurrenceService,
    private readonly reportService: ReportNegatifService,
  ) {}

  async calculerCommission(input: CalculerCommissionInput): Promise<CalculerCommissionResult> {
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

    let montantBrut = 0;
    const calculDetails: Record<string, any> = {
      typeCalcul: bareme.typeCalcul,
      baseCalcul: bareme.baseCalcul,
      montantBase: input.montantBase,
    };

    switch (bareme.typeCalcul) {
      case TypeCalcul.FIXE:
        montantBrut = Number(bareme.montantFixe) || 0;
        calculDetails.montantFixe = bareme.montantFixe;
        break;
      case TypeCalcul.POURCENTAGE:
        montantBrut = this.round(input.montantBase * (Number(bareme.tauxPourcentage) / 100));
        calculDetails.tauxPourcentage = bareme.tauxPourcentage;
        break;
      case TypeCalcul.PALIER:
      case TypeCalcul.MIXTE:
        if (bareme.tauxPourcentage) {
          montantBrut = this.round(input.montantBase * (Number(bareme.tauxPourcentage) / 100));
          calculDetails.tauxPourcentage = bareme.tauxPourcentage;
        }
        if (bareme.montantFixe && bareme.typeCalcul === TypeCalcul.MIXTE) {
          montantBrut += Number(bareme.montantFixe);
          calculDetails.montantFixe = bareme.montantFixe;
        }
        break;
    }

    const primes: PrimeApplicable[] = [];
    if (bareme.paliers && bareme.paliers.length > 0) {
      for (const palier of bareme.paliers) {
        if (!palier.actif) continue;
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

    const totalPrimes = primes.reduce((sum, p) => sum + p.montant, 0);
    const montantTotal = this.round(montantBrut + totalPrimes);

    calculDetails.montantBrut = montantBrut;
    calculDetails.primes = primes;
    calculDetails.montantTotal = montantTotal;

    const statutEnAttente = await this.statutService.findByCode('en_attente').catch(() => null);

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

    await this.auditService.logCalculation(
      input.organisationId,
      commission.id,
      bareme.id,
      bareme.version,
      input.contratId,
      input.apporteurId,
      input.periode,
      montantTotal,
      calculDetails,
    );

    let recurrenceGeneree = false;
    if (bareme.recurrenceActive && bareme.tauxRecurrence) {
      recurrenceGeneree = await this.genererRecurrenceSiEligible(
        input,
        commission.id,
        bareme,
      );
    }

    this.logger.log(`Calculated commission ${commission.id}: ${montantTotal}EUR`);

    return {
      commission,
      baremeApplique: bareme,
      primes,
      montantTotal,
      recurrenceGeneree,
    };
  }

  private async genererRecurrenceSiEligible(
    input: CalculerCommissionInput,
    commissionId: string,
    bareme: BaremeCommissionEntity,
  ): Promise<boolean> {
    if (!input.echeanceId || !input.dateEncaissement) {
      return false;
    }

    const exists = await this.recurrenceService.existsForPeriode(
      input.organisationId,
      input.contratId,
      input.echeanceId,
      input.periode,
    );
    if (exists) {
      return false;
    }

    const lastNumero = await this.recurrenceService.getLastNumeroMois(
      input.organisationId,
      input.contratId,
    );
    const numeroMois = lastNumero + 1;

    if (bareme.dureeRecurrenceMois && numeroMois > bareme.dureeRecurrenceMois) {
      this.logger.log(`Recurrence limit reached for contrat ${input.contratId}: ${numeroMois} > ${bareme.dureeRecurrenceMois}`);
      return false;
    }

    await this.recurrenceService.generate({
      organisationId: input.organisationId,
      commissionInitialeId: commissionId,
      contratId: input.contratId,
      echeanceId: input.echeanceId,
      apporteurId: input.apporteurId,
      baremeId: bareme.id,
      baremeVersion: bareme.version,
      periode: input.periode,
      numeroMois,
      montantBase: input.montantBase,
      tauxRecurrence: Number(bareme.tauxRecurrence),
      dateEncaissement: input.dateEncaissement,
    });

    await this.auditService.logRecurrence(
      input.organisationId,
      commissionId,
      input.contratId,
      input.apporteurId,
      input.periode,
      this.round(input.montantBase * (Number(bareme.tauxRecurrence) / 100)),
      input.echeanceId,
      numeroMois,
    );

    return true;
  }

  async genererBordereau(
    organisationId: string,
    apporteurId: string,
    periode: string,
    creePar?: string,
  ): Promise<GenererBordereauResult> {
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

      await this.auditService.logBordereau(
        organisationId,
        bordereau.id,
        AuditAction.BORDEREAU_CREATED,
        creePar,
      );
    } else {
      await this.ligneService.deleteByBordereau(bordereau.id);
    }

    const { commissions } = await this.commissionService.findByOrganisation(organisationId, {
      apporteurId,
      periode,
    });

    const reprises = await this.repriseService.findPending(organisationId, apporteurId, periode);
    const recurrences = await this.recurrenceService.findNonIncluses(organisationId, apporteurId, periode);

    let ordre = 0;
    let totalBrut = 0;
    let totalReprises = 0;
    let totalRecurrences = 0;

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

    for (const recurrence of recurrences) {
      await this.ligneService.create({
        organisationId,
        bordereauId: bordereau.id,
        typeLigne: TypeLigne.COMMISSION,
        contratId: recurrence.contratId,
        contratReference: `REC-${recurrence.periode}-${recurrence.numeroMois}`,
        montantBrut: recurrence.montantCalcule,
        montantReprise: 0,
        montantNet: recurrence.montantCalcule,
        ordre: ordre++,
      });
      totalRecurrences += Number(recurrence.montantCalcule);
    }
    totalBrut += totalRecurrences;

    if (recurrences.length > 0) {
      await this.recurrenceService.marquerIncluses(
        recurrences.map(r => r.id),
        bordereau.id,
      );
    }

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
        montantNet: -Number(reprise.montantReprise),
        ordre: ordre++,
      });
      totalReprises += Number(reprise.montantReprise);

      await this.repriseService.apply(reprise.id, bordereau.id);
      
      await this.auditService.logReprise(
        organisationId,
        reprise.id,
        AuditAction.REPRISE_APPLIED,
        reprise.contratId,
        apporteurId,
        reprise.periodeOrigine,
        periode,
        Number(reprise.montantReprise),
      );
    }

    let netAvantReports = totalBrut - totalReprises;
    let totalReportsAppliques = 0;
    let reportNegatifGenere = 0;

    const { montantApresReports, reportsAppliques } = await this.reportService.appliquerSurMontant(
      organisationId,
      apporteurId,
      netAvantReports,
      periode,
    );

    for (const report of reportsAppliques) {
      const montantApplique = Number(report.montantInitial) - Number(report.montantRestant);
      totalReportsAppliques += montantApplique;

      await this.auditService.logReportNegatif(
        organisationId,
        apporteurId,
        report.periodeOrigine,
        periode,
        montantApplique,
        AuditAction.REPORT_NEGATIF_APPLIED,
      );
    }

    const totalNet = montantApresReports;

    if (totalNet < 0) {
      const report = await this.reportService.create({
        organisationId,
        apporteurId,
        periodeOrigine: periode,
        montantInitial: Math.abs(totalNet),
        bordereauOrigineId: bordereau.id,
        motif: 'Solde negatif apres reprises',
      });
      reportNegatifGenere = Math.abs(totalNet);

      await this.auditService.logReportNegatif(
        organisationId,
        apporteurId,
        periode,
        periode,
        reportNegatifGenere,
        AuditAction.REPORT_NEGATIF_CREATED,
      );
    }

    const netFinal = Math.max(0, totalNet);

    await this.bordereauService.updateTotals(bordereau.id, {
      totalBrut,
      totalReprises,
      totalAcomptes: totalReportsAppliques,
      totalNetAPayer: netFinal,
      nombreLignes: ordre,
    });

    bordereau = await this.bordereauService.findById(bordereau.id);

    const summary = {
      nombreCommissions: commissions.length,
      nombreReprises: reprises.length,
      nombreRecurrences: recurrences.length,
      nombrePrimes: 0,
      totalBrut,
      totalReprises,
      totalReportsAppliques,
      totalNet: netFinal,
      reportNegatifGenere,
    };

    this.logger.log(`Generated bordereau ${bordereau.id} with ${ordre} lines, net: ${netFinal}EUR`);

    return { bordereau, summary };
  }

  async declencherReprise(
    commissionId: string,
    typeReprise: TypeReprise,
    dateEvenement: Date,
    motif?: string,
  ) {
    const commission = await this.commissionService.findById(commissionId);

    const bareme = await this.baremeService.findApplicable(commission.organisationId, {
      date: commission.dateCreation.toISOString(),
    });
    
    const dureeReprisesMois = bareme?.dureeReprisesMois || 3;
    const tauxReprise = bareme?.tauxReprise || 100;

    const dateLimite = new Date(commission.dateCreation);
    dateLimite.setMonth(dateLimite.getMonth() + dureeReprisesMois);

    if (dateEvenement > dateLimite) {
      throw new Error(`Reprise window has expired (${dureeReprisesMois} months)`);
    }

    const montantReprise = this.round(Number(commission.montantNetAPayer) * (tauxReprise / 100));

    const now = new Date();
    const periodeApplication = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;

    const reference = `REP-${periodeApplication}-${Date.now().toString(36).toUpperCase()}`;
    const reprise = await this.repriseService.create({
      organisationId: commission.organisationId,
      commissionOriginaleId: commissionId,
      contratId: commission.contratId,
      apporteurId: commission.apporteurId,
      reference,
      typeReprise,
      montantReprise,
      tauxReprise,
      montantOriginal: Number(commission.montantNetAPayer),
      periodeOrigine: commission.periode,
      periodeApplication,
      dateEvenement,
      dateLimite,
      motif,
    });

    await this.auditService.logReprise(
      commission.organisationId,
      reprise.id,
      AuditAction.REPRISE_CREATED,
      commission.contratId,
      commission.apporteurId,
      commission.periode,
      periodeApplication,
      montantReprise,
      motif,
    );

    if (typeReprise === TypeReprise.IMPAYE || typeReprise === TypeReprise.RESILIATION) {
      await this.recurrenceService.suspendre(commission.contratId);
      
      await this.auditService.log({
        organisationId: commission.organisationId,
        scope: AuditScope.RECURRENCE,
        action: AuditAction.RECURRENCE_STOPPED,
        contratId: commission.contratId,
        apporteurId: commission.apporteurId,
        motif: `Suspension suite a ${typeReprise}`,
      });
    }

    this.logger.log(`Created reprise ${reprise.id} for commission ${commissionId}: ${montantReprise}EUR`);

    return reprise;
  }

  async regulariserReprise(
    repriseId: string,
    dateRegularisation: Date,
  ) {
    const reprise = await this.repriseService.findById(repriseId);
    
    await this.repriseService.cancel(repriseId);

    await this.recurrenceService.reprendre(reprise.contratId);

    await this.auditService.logReprise(
      reprise.organisationId,
      repriseId,
      AuditAction.REPRISE_REGULARIZED,
      reprise.contratId,
      reprise.apporteurId,
      reprise.periodeOrigine,
      reprise.periodeApplication,
      Number(reprise.montantReprise),
      'Regularisation apres recouvrement',
    );

    this.logger.log(`Regularized reprise ${repriseId}`);

    return reprise;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

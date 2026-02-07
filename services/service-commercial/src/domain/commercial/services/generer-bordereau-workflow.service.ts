import { Injectable } from '@nestjs/common';
import { TypeCalcul, type BaremeForCalculation, type CommissionResult } from './commission-calculation.service';
import { TypeReprise, type TypeReprise as TypeRepriseType } from '../entities/reprise-commission.entity';
import { TypeLigne, StatutLigne } from '../entities/ligne-bordereau.entity';

export interface GenererBordereauInput {
  organisationId: string;
  apporteurId: string;
  periode: string;
  creePar?: string | null;
}

export interface GenererBordereauCommission {
  id: string;
  organisationId: string;
  apporteurId: string;
  contratId: string;
  reference: string;
  montantBrut: number;
  montantReprises: number;
  montantAcomptes: number;
  montantNetAPayer: number;
  statutId: string;
  periode: string;
  dateCreation: Date;
  contratValideCq?: boolean;
  echeanceEncaissee?: boolean;
}

export interface GenererBordereauReprise {
  id: string;
  commissionOriginaleId: string;
  contratId: string;
  apporteurId: string;
  typeReprise: TypeRepriseType | string;
  periodeApplication: string;
}

export interface GenererBordereauRecurrence {
  id: string;
  contratId: string;
  echeanceId: string | null;
  dateEncaissement: Date | null;
  montantCalcule: number;
}

export interface GenererBordereauReportNegatif {
  id: string;
  periodeOrigine: string;
  montantRestant: number;
}

export interface GenererBordereauDeps {
  state?: Record<string, unknown>;
  findCommissionsForPeriode(input: GenererBordereauInput): Promise<GenererBordereauCommission[]>;
  findBaremeForCommission(commission: GenererBordereauCommission): Promise<BaremeForCalculation>;
  calculerCommission(contrat: unknown, bareme: BaremeForCalculation, montantBase: number): CommissionResult;
  findStatutAPayer(): Promise<{ id: string; code: string } | null>;
  findReprisesForPeriode(input: GenererBordereauInput): Promise<GenererBordereauReprise[]>;
  calculerReprise(
    contratId: string,
    typeReprise: TypeRepriseType,
    fenetreMois: number,
    periode: string,
  ): Promise<{ montantReprise: number; suspendRecurrence: boolean; creerLigneReprise: boolean }>;
  updateReprise(id: string, payload: Record<string, unknown>): Promise<void>;
  findRecurrencesForPeriode(input: GenererBordereauInput): Promise<GenererBordereauRecurrence[]>;
  genererRecurrence(contratId: string, echeanceId: string, dateEncaissement: string): Promise<{
    creee: boolean;
    recurrence: { montantCalcule: number } | null;
  }>;
  findReportsNegatifs(input: GenererBordereauInput): Promise<GenererBordereauReportNegatif[]>;
  createBordereau(input: GenererBordereauInput & { reference: string }): Promise<{ id: string; reference: string }>;
  createLigne(payload: Record<string, unknown>): Promise<{ id: string }>;
  updateBordereau(id: string, payload: Record<string, unknown>): Promise<unknown>;
  audit(payload: Record<string, unknown>): Promise<void>;
}

export interface GenererBordereauOutput {
  bordereau: unknown;
  summary: {
    nombre_commissions: number;
    nombre_reprises: number;
    nombre_primes: number;
    total_brut: string;
    total_reprises: string;
    total_net: string;
  };
  totaux: {
    totalBrut: number;
    totalReprises: number;
    totalAcomptes: number;
    totalNet: number;
  };
}

@Injectable()
export class GenererBordereauWorkflowService {
  constructor(private readonly deps: GenererBordereauDeps) {}

  async execute(input: GenererBordereauInput): Promise<GenererBordereauOutput> {
    const reference = `BRD-${input.periode}-${Date.now()}`;
    const bordereau = await this.deps.createBordereau({ ...input, reference });

    await this.deps.audit({
      organisationId: input.organisationId,
      scope: 'bordereau',
      action: 'bordereau_created',
      refId: bordereau.id,
      afterData: { reference, periode: input.periode },
    });

    const statutAPayer = await this.deps.findStatutAPayer();
    const commissions = await this.deps.findCommissionsForPeriode(input);

    let ordre = 0;
    let nombreCommissions = 0;
    let nombreReprises = 0;
    let nombrePrimes = 0;

    let totalBrut = 0;
    let totalReprises = 0;
    let totalAcomptes = 0;

    for (const commission of commissions) {
      const bareme = await this.deps.findBaremeForCommission(commission);
      const calcul = this.deps.calculerCommission(
        { id: commission.contratId },
        bareme,
        Number(commission.montantBrut || 0),
      );

      const montantBrut = this.round2(calcul.montantCalcule);
      const montantReprise = this.round2(Number(commission.montantReprises || 0));
      const montantAcompte = this.round2(Number(commission.montantAcomptes || 0));
      const montantNet = this.round2(montantBrut - montantReprise - montantAcompte);

      const isEligible =
        commission.statutId === (statutAPayer?.id || '') &&
        commission.contratValideCq !== false &&
        commission.echeanceEncaissee !== false;

      await this.deps.createLigne({
        organisationId: input.organisationId,
        bordereauId: bordereau.id,
        commissionId: commission.id,
        typeLigne: TypeLigne.COMMISSION,
        contratId: commission.contratId,
        contratReference: commission.reference,
        montantBrut,
        montantReprise,
        montantNet,
        baseCalcul: bareme.typeCalcul || TypeCalcul.POURCENTAGE,
        tauxApplique: Number(bareme.tauxPourcentage || 0),
        baremeId: (bareme as any).id || null,
        statutLigne: isEligible ? StatutLigne.SELECTIONNEE : StatutLigne.DESELECTIONNEE,
        selectionne: isEligible,
        motifDeselection: isEligible ? null : 'NON_ELIGIBLE_ADV',
        ordre,
      });
      ordre += 1;

      nombreCommissions += 1;
      totalBrut = this.round2(totalBrut + montantBrut);

      await this.deps.audit({
        organisationId: input.organisationId,
        scope: 'engine',
        action: 'commission_calculated',
        refId: commission.id,
        contratId: commission.contratId,
        apporteurId: commission.apporteurId,
        periode: input.periode,
        afterData: {
          montantCalcule: montantBrut,
          typeCalcul: calcul.typeCalcul,
          details: calcul.details,
        },
      });
    }

    const reprises = await this.deps.findReprisesForPeriode(input);
    for (const reprise of reprises) {
      const type = this.toTypeReprise(reprise.typeReprise);
      const fenetre = type === TypeReprise.RESILIATION ? 12 : 3;
      const calculReprise = await this.deps.calculerReprise(reprise.contratId, type, fenetre, input.periode);
      const montantReprise = this.round2(calculReprise.montantReprise);

      await this.deps.updateReprise(reprise.id, {
        montantReprise,
        statutReprise: 'appliquee',
        dateApplication: new Date(),
      });

      await this.deps.createLigne({
        organisationId: input.organisationId,
        bordereauId: bordereau.id,
        repriseId: reprise.id,
        typeLigne: TypeLigne.REPRISE,
        contratId: reprise.contratId,
        contratReference: reprise.id,
        montantBrut: 0,
        montantReprise,
        montantNet: this.round2(-montantReprise),
        statutLigne: StatutLigne.SELECTIONNEE,
        selectionne: true,
        ordre,
      });
      ordre += 1;

      nombreReprises += 1;
      totalReprises = this.round2(totalReprises + montantReprise);

      await this.deps.audit({
        organisationId: input.organisationId,
        scope: 'reprise',
        action: 'reprise_applied',
        refId: reprise.id,
        periode: input.periode,
        afterData: { montantReprise },
      });
    }

    const recurrences = await this.deps.findRecurrencesForPeriode(input);
    for (const recurrence of recurrences) {
      const dateEncaissement = recurrence.dateEncaissement || new Date();
      const result = await this.deps.genererRecurrence(
        recurrence.contratId,
        recurrence.echeanceId || recurrence.id,
        dateEncaissement.toISOString(),
      );

      if (!result.creee || !result.recurrence) {
        continue;
      }

      await this.deps.createLigne({
        organisationId: input.organisationId,
        bordereauId: bordereau.id,
        typeLigne: TypeLigne.PRIME,
        contratId: recurrence.contratId,
        contratReference: recurrence.id,
        montantBrut: this.round2(Number(result.recurrence.montantCalcule || 0)),
        montantReprise: 0,
        montantNet: this.round2(Number(result.recurrence.montantCalcule || 0)),
        statutLigne: StatutLigne.SELECTIONNEE,
        selectionne: true,
        ordre,
      });
      ordre += 1;
      nombrePrimes += 1;

      await this.deps.audit({
        organisationId: input.organisationId,
        scope: 'recurrence',
        action: 'recurrence_generated',
        refId: recurrence.id,
        periode: input.periode,
        afterData: { montantCalcule: result.recurrence.montantCalcule },
      });
    }

    const reports = await this.deps.findReportsNegatifs(input);
    for (const report of reports) {
      const montantAcompte = this.round2(Number(report.montantRestant || 0));
      await this.deps.createLigne({
        organisationId: input.organisationId,
        bordereauId: bordereau.id,
        typeLigne: TypeLigne.ACOMPTE,
        contratId: `report-${report.id}`,
        contratReference: `REPORT-${report.periodeOrigine}`,
        montantBrut: 0,
        montantReprise: 0,
        montantNet: this.round2(-montantAcompte),
        statutLigne: StatutLigne.SELECTIONNEE,
        selectionne: true,
        ordre,
      });
      ordre += 1;
      totalAcomptes = this.round2(totalAcomptes + montantAcompte);

      await this.deps.audit({
        organisationId: input.organisationId,
        scope: 'report',
        action: 'report_negatif_applied',
        refId: report.id,
        periode: input.periode,
        afterData: { montantAcompte, periodeOrigine: report.periodeOrigine },
      });
    }

    const totalNet = this.round2(totalBrut - totalReprises - totalAcomptes);
    const updated = await this.deps.updateBordereau(bordereau.id, {
      nombreLignes: ordre,
      totalBrut,
      totalReprises,
      totalAcomptes,
      totalNetAPayer: totalNet,
    });

    await this.deps.audit({
      organisationId: input.organisationId,
      scope: 'bordereau',
      action: 'bordereau_created',
      refId: bordereau.id,
      periode: input.periode,
      afterData: {
        nombreLignes: ordre,
        totalBrut,
        totalReprises,
        totalAcomptes,
        totalNet,
      },
    });

    return {
      bordereau: updated,
      summary: {
        nombre_commissions: nombreCommissions,
        nombre_reprises: nombreReprises,
        nombre_primes: nombrePrimes,
        total_brut: this.toMoney(totalBrut),
        total_reprises: this.toMoney(totalReprises),
        total_net: this.toMoney(totalNet),
      },
      totaux: {
        totalBrut,
        totalReprises,
        totalAcomptes,
        totalNet,
      },
    };
  }

  private toTypeReprise(value: TypeRepriseType | string): TypeRepriseType {
    if (value === TypeReprise.ANNULATION || value === 'annulation') return TypeReprise.ANNULATION;
    if (value === TypeReprise.IMPAYE || value === 'impaye') return TypeReprise.IMPAYE;
    if (value === TypeReprise.REGULARISATION || value === 'regularisation') return TypeReprise.REGULARISATION;
    return TypeReprise.RESILIATION;
  }

  private round2(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  private toMoney(value: number): string {
    return this.round2(value).toFixed(2);
  }
}

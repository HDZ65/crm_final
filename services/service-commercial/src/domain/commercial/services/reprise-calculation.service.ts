import { Injectable } from '@nestjs/common';
import { DomainException } from '@crm/shared-kernel';
import { TypeReprise } from '../entities/reprise-commission.entity';

export interface RepriseDependencies {
  findCommissionsVerseesDansFenetre: (
    contratId: string,
    fenetreMois: number,
    periodeActuelle: string,
  ) => Promise<number[]>;
  findCommissionDuePeriode: (contratId: string, periodeActuelle: string) => Promise<number>;
  now: () => Date;
}

export interface RepriseInput {
  id: string;
  contratId: string;
  typeReprise: TypeReprise;
  montantReprise: number;
  motif: string;
  impayeSolde: boolean;
  periodeApplication: string;
}

export interface RepriseCalculationResult {
  totalCommissionsFenetre: number;
  commissionDuePeriode: number;
  montantReprise: number;
  suspendRecurrence: boolean;
  creerLigneReprise: boolean;
}

export interface ReportNegatifResult {
  hasReport: boolean;
  soldeAvantReport: number;
  montantReport: number;
  periodeSuivante: string;
}

export interface RegularisationFromRepriseResult {
  creerLignePositive: boolean;
  typeReprise: TypeReprise;
  montantRegularisation: number;
  periodeApplication: string;
}

export interface ContestationRegularisationInput {
  organisationId: string;
  bordereauId: string;
  commissionId: string;
  contratId: string;
  apporteurId: string;
  referenceContrat: string;
  montantNetCommission: number;
  motif: string;
}

export interface ContestationRegularisationResult {
  organisationId: string;
  bordereauId: string;
  commissionId: string;
  typeLigne: 'regularisation';
  contratId: string;
  contratReference: string;
  montantBrut: number;
  montantReprise: number;
  montantNet: number;
  motif: string;
}

@Injectable()
export class RepriseCalculationService {
  private readonly deps: Partial<RepriseDependencies> = {};

  constructor() {}

  async calculerReprise(
    contratId: string,
    typeReprise: TypeReprise,
    fenetreMois: number,
    periodeActuelle: string,
  ): Promise<RepriseCalculationResult> {
    if (fenetreMois <= 0) {
      throw new DomainException('La fenetre de reprise doit etre strictement positive', 'INVALID_FENETRE');
    }

    const commissionsVersees = await this.getCommissionsVersees(contratId, fenetreMois, periodeActuelle);
    const commissionDuePeriode = await this.getCommissionDuePeriode(contratId, periodeActuelle);

    const totalCommissionsFenetre = this.arrondir(
      commissionsVersees.reduce((sum, value) => sum + Number(value || 0), 0),
    );
    const montantReprise = this.arrondir(Math.min(totalCommissionsFenetre, Number(commissionDuePeriode || 0)));

    return {
      totalCommissionsFenetre,
      commissionDuePeriode: this.arrondir(commissionDuePeriode),
      montantReprise,
      suspendRecurrence: typeReprise === TypeReprise.IMPAYE,
      creerLigneReprise: true,
    };
  }

  calculerReportNegatif(
    apporteurId: string,
    periode: string,
    brut: number,
    reprises: number,
    acomptes: number,
  ): ReportNegatifResult {
    void apporteurId;

    const soldeAvantReport = this.arrondir(Number(brut) - Number(reprises) - Number(acomptes));
    const hasReport = soldeAvantReport < 0;

    return {
      hasReport,
      soldeAvantReport,
      montantReport: hasReport ? this.arrondir(Math.abs(soldeAvantReport)) : 0,
      periodeSuivante: this.nextPeriode(periode),
    };
  }

  genererRegularisation(input: RepriseInput): RegularisationFromRepriseResult;
  genererRegularisation(input: ContestationRegularisationInput): ContestationRegularisationResult;
  genererRegularisation(
    input: RepriseInput | ContestationRegularisationInput,
  ): RegularisationFromRepriseResult | ContestationRegularisationResult {
    if ('impayeSolde' in input) {
      const shouldCreate = input.typeReprise === TypeReprise.IMPAYE && input.impayeSolde;
      return {
        creerLignePositive: shouldCreate,
        typeReprise: TypeReprise.REGULARISATION,
        montantRegularisation: shouldCreate ? this.arrondir(input.montantReprise) : 0,
        periodeApplication: input.periodeApplication,
      };
    }

    const montantNet = this.arrondir(input.montantNetCommission);
    return {
      organisationId: input.organisationId,
      bordereauId: input.bordereauId,
      commissionId: input.commissionId,
      typeLigne: 'regularisation',
      contratId: input.contratId,
      contratReference: input.referenceContrat,
      montantBrut: montantNet,
      montantReprise: 0,
      montantNet,
      motif: input.motif,
    };
  }

  private async getCommissionsVersees(
    contratId: string,
    fenetreMois: number,
    periodeActuelle: string,
  ): Promise<number[]> {
    if (this.deps?.findCommissionsVerseesDansFenetre) {
      return this.deps.findCommissionsVerseesDansFenetre(contratId, fenetreMois, periodeActuelle);
    }
    return [];
  }

  private async getCommissionDuePeriode(contratId: string, periodeActuelle: string): Promise<number> {
    if (this.deps?.findCommissionDuePeriode) {
      return this.deps.findCommissionDuePeriode(contratId, periodeActuelle);
    }
    return 0;
  }

  private nextPeriode(periode: string): string {
    const [yearText, monthText] = periode.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return periode;
    }

    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  }

  private arrondir(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}

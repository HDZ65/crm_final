import { Injectable } from '@nestjs/common';
import { StatutRecurrence } from '../entities/commission-recurrente.entity';

export interface ContratForRecurrence {
  id: string;
  organisationId: string;
  statut: string;
  dateFin: Date | string | null;
  montantHT: number;
}

export interface BaremeForRecurrence {
  id: string;
  version: number;
  recurrenceActive: boolean;
  tauxRecurrence: number | null;
  dureeRecurrenceMois: number | null;
}

export interface RecurrenceLine {
  contratId: string;
  echeanceId: string;
  dateEncaissement: Date;
  periode: string;
  numeroMois: number;
  baremeId: string;
  baremeVersion: number;
  montantBase: number;
  tauxRecurrence: number;
  montantCalcule: number;
  statutRecurrence: StatutRecurrence;
}

export interface RecurrenceResult {
  creee: boolean;
  raison: string | null;
  recurrence: RecurrenceLine | null;
}

export interface RecurrenceDependencies {
  findContratById: (contratId: string) => Promise<ContratForRecurrence>;
  findBaremeAtDate: (contratId: string, dateEncaissement: Date) => Promise<BaremeForRecurrence>;
  isEcheanceReglee: (echeanceId: string) => Promise<boolean>;
  getRecurrenceMonthNumber: (contratId: string, dateEncaissement: Date) => Promise<number>;
  persistRecurrence: (line: RecurrenceLine) => Promise<void>;
  suspendRecurrences: (contratId: string, motif: string) => Promise<void>;
}

const defaultDeps: RecurrenceDependencies = {
  findContratById: async (contratId: string) => ({
    id: contratId,
    organisationId: '',
    statut: 'VALIDE',
    dateFin: null,
    montantHT: 0,
  }),
  findBaremeAtDate: async () => ({
    id: '',
    version: 1,
    recurrenceActive: false,
    tauxRecurrence: null,
    dureeRecurrenceMois: null,
  }),
  isEcheanceReglee: async () => false,
  getRecurrenceMonthNumber: async () => 1,
  persistRecurrence: async () => undefined,
  suspendRecurrences: async () => undefined,
};

@Injectable()
export class RecurrenceGenerationService {
  constructor(private readonly deps: RecurrenceDependencies = defaultDeps) {}

  async genererRecurrence(
    contratId: string,
    echeanceId: string,
    dateEncaissement: string,
  ): Promise<RecurrenceResult> {
    const encaissementDate = new Date(dateEncaissement);
    const echeanceReglee = await this.deps.isEcheanceReglee(echeanceId);
    if (!echeanceReglee) {
      return { creee: false, raison: 'ECHEANCE_NON_REGLEE', recurrence: null };
    }

    const contrat = await this.deps.findContratById(contratId);
    const bareme = await this.deps.findBaremeAtDate(contratId, encaissementDate);

    if (!this.verifierEligibilite(contrat, bareme, this.toPeriode(encaissementDate))) {
      return { creee: false, raison: 'CONTRAT_RESILIE', recurrence: null };
    }

    const numeroMois = await this.deps.getRecurrenceMonthNumber(contratId, encaissementDate);
    if (bareme.dureeRecurrenceMois !== null && numeroMois > bareme.dureeRecurrenceMois) {
      return { creee: false, raison: 'DUREE_MAX_ATTEINTE', recurrence: null };
    }

    const montantBase = this.arrondir(Number(contrat.montantHT || 0));
    const tauxRecurrence = this.arrondir(Number(bareme.tauxRecurrence || 0));
    const montantCalcule = this.arrondir(montantBase * (tauxRecurrence / 100));

    const recurrence: RecurrenceLine = {
      contratId,
      echeanceId,
      dateEncaissement: encaissementDate,
      periode: this.toPeriode(encaissementDate),
      numeroMois,
      baremeId: bareme.id,
      baremeVersion: bareme.version,
      montantBase,
      tauxRecurrence,
      montantCalcule,
      statutRecurrence: StatutRecurrence.ACTIVE,
    };

    await this.deps.persistRecurrence(recurrence);

    return {
      creee: true,
      raison: null,
      recurrence,
    };
  }

  async suspendreRecurrences(contratId: string, motif: string): Promise<void> {
    await this.deps.suspendRecurrences(contratId, motif);
  }

  verifierEligibilite(
    contrat: ContratForRecurrence,
    bareme: BaremeForRecurrence,
    periode: string,
  ): boolean {
    if (!bareme.recurrenceActive || !bareme.tauxRecurrence || bareme.tauxRecurrence <= 0) {
      return false;
    }

    if (contrat.statut.toUpperCase() !== 'VALIDE' && contrat.statut.toUpperCase() !== 'ACTIF') {
      return false;
    }

    if (!contrat.dateFin) {
      return true;
    }

    const dateFin = typeof contrat.dateFin === 'string' ? new Date(contrat.dateFin) : contrat.dateFin;
    const finPeriode = this.toPeriode(dateFin);
    return finPeriode >= periode;
  }

  private toPeriode(value: Date): string {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private arrondir(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}

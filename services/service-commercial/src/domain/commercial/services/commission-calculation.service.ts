import { Injectable } from '@nestjs/common';
import { DomainException } from '@crm/shared-kernel';

export enum TypeCalcul {
  FIXE = 'fixe',
  POURCENTAGE = 'pourcentage',
  PALIER = 'palier',
  MIXTE = 'mixte',
}

export interface PalierForCalculation {
  seuilMin: number;
  seuilMax: number | null;
  montantPrime: number;
  cumulable: boolean;
  ordre?: number;
}

export interface BaremeForCalculation {
  typeCalcul: TypeCalcul | string;
  montantFixe: number | null;
  tauxPourcentage: number | null;
  paliers?: PalierForCalculation[];
}

export interface CommissionResult {
  montantCalcule: number;
  typeCalcul: TypeCalcul | string;
  details: Record<string, unknown>;
}

export interface VolumePrimePalierInput {
  seuil: number;
  montantPrime: number;
  volumeAtteint: number;
  cumulable?: boolean;
}

export interface PrimeResult {
  seuil: number;
  montantPrime: number;
  volumeAtteint: number;
  applicable: boolean;
}

@Injectable()
export class CommissionCalculationService {
  calculer(
    contrat: unknown,
    bareme: BaremeForCalculation,
    montantBase: number,
  ): CommissionResult {
    if (!bareme) {
      throw new DomainException('Aucun bareme applicable', 'BAREME_NOT_FOUND');
    }

    if (montantBase < 0) {
      throw new DomainException('Le montant de base ne peut pas etre negatif', 'INVALID_MONTANT_BASE');
    }

    if (montantBase === 0) {
      return {
        montantCalcule: 0,
        typeCalcul: bareme.typeCalcul,
        details: { montantBase, contrat },
      };
    }

    let montantCalcule = 0;

    switch (bareme.typeCalcul) {
      case TypeCalcul.FIXE:
        montantCalcule = Number(bareme.montantFixe || 0);
        break;
      case TypeCalcul.POURCENTAGE:
        montantCalcule = this.arrondir((montantBase * Number(bareme.tauxPourcentage || 0)) / 100);
        break;
      case TypeCalcul.PALIER:
        montantCalcule = this.calculerPalier(bareme, montantBase);
        break;
      case TypeCalcul.MIXTE:
        montantCalcule = this.calculerMixte(bareme, montantBase);
        break;
      default:
        throw new DomainException('Type de calcul non supporte', 'TYPE_CALCUL_UNSUPPORTED');
    }

    return {
      montantCalcule: this.arrondir(montantCalcule),
      typeCalcul: bareme.typeCalcul,
      details: { montantBase, contrat },
    };
  }

  calculerPalier(bareme: BaremeForCalculation, montantBase: number): number {
    const paliers = [...(bareme.paliers || [])].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    if (paliers.length === 0) {
      throw new DomainException('Aucun palier configure', 'PALIER_NOT_FOUND');
    }

    const hasCumulable = paliers.some((palier) => palier.cumulable);
    if (hasCumulable) {
      const total = paliers
        .filter((palier) => montantBase >= Number(palier.seuilMin))
        .reduce((sum, palier) => sum + Number(palier.montantPrime || 0), 0);
      return this.arrondir(total);
    }

    const palierApplicable = paliers.find((palier) => {
      const seuilMin = Number(palier.seuilMin);
      const seuilMax = palier.seuilMax === null ? null : Number(palier.seuilMax);
      return montantBase >= seuilMin && (seuilMax === null || montantBase <= seuilMax);
    });

    if (!palierApplicable) {
      throw new DomainException('Aucun palier applicable', 'PALIER_NOT_APPLICABLE');
    }

    return this.arrondir(Number(palierApplicable.montantPrime || 0));
  }

  calculerMixte(bareme: BaremeForCalculation, montantBase: number): number {
    const montantFixe = Number(bareme.montantFixe || 0);
    const taux = Number(bareme.tauxPourcentage || 0);
    const partPourcentage = (montantBase * taux) / 100;
    return this.arrondir(montantFixe + partPourcentage);
  }

  verifierPrimesVolume(
    apporteurId: string,
    periode: string,
    paliers: VolumePrimePalierInput[],
  ): PrimeResult[] {
    void apporteurId;
    void periode;

    if (!paliers?.length) {
      return [];
    }

    const sorted = [...paliers].sort((a, b) => a.seuil - b.seuil);
    const allCumulables = sorted.every((palier) => palier.cumulable !== false);
    const applicable = sorted.filter((palier) => palier.volumeAtteint >= palier.seuil);
    const highestSeuil = applicable.length ? applicable[applicable.length - 1].seuil : undefined;

    return sorted.map((palier) => {
      const isApplicable = palier.volumeAtteint >= palier.seuil;
      const keepApplicable = allCumulables
        ? isApplicable
        : isApplicable && palier.seuil === highestSeuil;

      return {
        seuil: palier.seuil,
        montantPrime: this.arrondir(palier.montantPrime),
        volumeAtteint: palier.volumeAtteint,
        applicable: keepApplicable,
      };
    });
  }

  private arrondir(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}

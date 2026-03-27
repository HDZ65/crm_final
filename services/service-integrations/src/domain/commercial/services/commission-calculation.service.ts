import { Injectable } from '@nestjs/common';
import { TypeCalcul } from '../entities/bareme-commission.entity';
import type { SubscriptionEntity } from '../../subscriptions/entities/subscription.entity';

export interface PalierInput {
  seuilMin: number;
  seuilMax: number | null;
  montantPrime: number;
  cumulable: boolean;
  ordre: number;
}

export interface BaremeInput {
  typeCalcul: TypeCalcul;
  montantFixe: number | null;
  tauxPourcentage: number | null;
  paliers?: PalierInput[];
}

export interface CommissionCalculationResult {
  montantCalcule: number;
  detail: Record<string, unknown>;
}

@Injectable()
export class CommissionCalculationService {
  calculer(
    _subscription: SubscriptionEntity,
    bareme: BaremeInput,
    montantBase: number,
  ): CommissionCalculationResult {
    switch (bareme.typeCalcul) {
      case TypeCalcul.FIXE:
        return {
          montantCalcule: bareme.montantFixe ?? 0,
          detail: { type: 'fixe', montantFixe: bareme.montantFixe },
        };

      case TypeCalcul.POURCENTAGE: {
        const taux = bareme.tauxPourcentage ?? 0;
        const montant = (montantBase * taux) / 100;
        return {
          montantCalcule: Math.round(montant * 100) / 100,
          detail: { type: 'pourcentage', taux, montantBase },
        };
      }

      case TypeCalcul.PALIER: {
        const paliers = (bareme.paliers || []).sort((a, b) => a.ordre - b.ordre);
        let montantCalcule = 0;

        for (const palier of paliers) {
          if (montantBase >= palier.seuilMin && (palier.seuilMax === null || montantBase <= palier.seuilMax)) {
            montantCalcule = palier.montantPrime;
            if (!palier.cumulable) break;
          }
        }

        return {
          montantCalcule,
          detail: { type: 'palier', montantBase, paliers: paliers.length },
        };
      }

      case TypeCalcul.MIXTE: {
        const fixe = bareme.montantFixe ?? 0;
        const taux = bareme.tauxPourcentage ?? 0;
        const montant = fixe + (montantBase * taux) / 100;
        return {
          montantCalcule: Math.round(montant * 100) / 100,
          detail: { type: 'mixte', fixe, taux, montantBase },
        };
      }

      default:
        return { montantCalcule: 0, detail: { type: 'unknown' } };
    }
  }
}

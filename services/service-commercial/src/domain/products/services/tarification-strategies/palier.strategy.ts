import { ProduitEntity } from '../../entities/produit.entity';
import { TypeTarification } from '../../enums/type-tarification.enum';
import type {
  ITarificationStrategy,
  PrixCalcule,
  TarificationCalculationOptions,
} from '../tarification.engine';

interface PalierConfig {
  seuilMin: number;
  seuilMax: number | null;
  prix: number;
}

export class PalierTarificationStrategy implements ITarificationStrategy {
  readonly typeTarification = TypeTarification.PALIER;

  calculate(
    produit: ProduitEntity,
    quantite: number,
    _options?: TarificationCalculationOptions,
  ): PrixCalcule {
    const quantiteNormalisee = Math.max(1, Math.floor(Number(quantite || 0)));
    const paliers = this.parsePaliers(produit.configTarification);
    const palier = this.resolvePalier(quantiteNormalisee, paliers);
    const prixUnitaire = palier ? this.round(palier.prix) : this.round(Number(produit.prix || 0));
    const prixTotalHt = this.round(prixUnitaire * quantiteNormalisee);
    const tauxTva = Number(produit.tauxTva || 0);
    const tva = this.round(prixTotalHt * (tauxTva / 100));

    return {
      prixUnitaire,
      prixApresRemise: prixUnitaire,
      prixTotalHt,
      tva,
      prixTotalTtc: this.round(prixTotalHt + tva),
      promotionAppliquee: false,
      sourceTarification: 'MODELE',
      typeTarification: this.typeTarification,
      details: {
        mode: 'PALIER',
        palierApplique: palier,
      },
    };
  }

  private parsePaliers(config: Record<string, unknown> | null): PalierConfig[] {
    if (!config || !Array.isArray(config.paliers)) {
      return [];
    }

    return config.paliers
      .map((value) => {
        if (!value || typeof value !== 'object') {
          return null;
        }

        const record = value as Record<string, unknown>;
        const seuilMin = Number(record.seuilMin);
        const seuilMax = record.seuilMax === null || record.seuilMax === undefined
          ? null
          : Number(record.seuilMax);
        const prix = Number(record.prix);

        if (Number.isNaN(seuilMin) || Number.isNaN(prix)) {
          return null;
        }

        if (seuilMax !== null && Number.isNaN(seuilMax)) {
          return null;
        }

        return {
          seuilMin,
          seuilMax,
          prix,
        };
      })
      .filter((palier): palier is PalierConfig => Boolean(palier))
      .sort((left, right) => left.seuilMin - right.seuilMin);
  }

  private resolvePalier(quantite: number, paliers: PalierConfig[]): PalierConfig | null {
    const palierDirect = paliers.find(
      (palier) => quantite >= palier.seuilMin && (palier.seuilMax === null || quantite <= palier.seuilMax),
    );
    if (palierDirect) {
      return palierDirect;
    }

    const paliersInferieurs = paliers.filter((palier) => quantite >= palier.seuilMin);
    if (paliersInferieurs.length > 0) {
      return paliersInferieurs[paliersInferieurs.length - 1];
    }

    return paliers.length > 0 ? paliers[0] : null;
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}

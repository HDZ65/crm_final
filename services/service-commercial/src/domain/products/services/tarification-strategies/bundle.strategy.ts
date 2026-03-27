import { ProduitEntity } from '../../entities/produit.entity';
import { TypeTarification } from '../../enums/type-tarification.enum';
import type {
  ITarificationStrategy,
  PrixCalcule,
  TarificationCalculationOptions,
} from '../tarification.engine';

interface BundleConfig {
  produitIds: string[];
  prixBundle: number;
  remisePourcent: number;
}

export class BundleTarificationStrategy implements ITarificationStrategy {
  readonly typeTarification = TypeTarification.BUNDLE;

  calculate(
    produit: ProduitEntity,
    quantite: number,
    _options?: TarificationCalculationOptions,
  ): PrixCalcule {
    const quantiteNormalisee = Math.max(1, Math.floor(Number(quantite || 0)));
    const config = this.parseConfig(produit.configTarification);
    const prixBundle = Number.isNaN(config.prixBundle) ? Number(produit.prix || 0) : config.prixBundle;
    const remisePourcent = this.clampPercentage(config.remisePourcent);

    const prixUnitaire = this.round(prixBundle * (1 - remisePourcent / 100));
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
        mode: 'BUNDLE',
        produitIds: config.produitIds,
        remisePourcent,
      },
    };
  }

  private parseConfig(config: Record<string, unknown> | null): BundleConfig {
    const produitIds = Array.isArray(config?.produitIds)
      ? config.produitIds.map((id) => String(id))
      : [];

    return {
      produitIds,
      prixBundle: Number(config?.prixBundle),
      remisePourcent: Number(config?.remisePourcent || 0),
    };
  }

  private clampPercentage(value: number): number {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return 0;
    }

    return Math.min(100, Math.max(0, value));
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}

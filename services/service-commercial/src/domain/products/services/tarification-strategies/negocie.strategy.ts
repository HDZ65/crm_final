import { ProduitEntity } from '../../entities/produit.entity';
import { TypeTarification } from '../../enums/type-tarification.enum';
import type {
  ITarificationStrategy,
  PrixCalcule,
  TarificationCalculationOptions,
} from '../tarification.engine';

interface NegociationConfig {
  prixBase: number;
  margeNegociation: {
    min: number;
    max: number;
  };
}

export class NegocieTarificationStrategy implements ITarificationStrategy {
  readonly typeTarification = TypeTarification.NEGOCIE;

  calculate(
    produit: ProduitEntity,
    quantite: number,
    options?: TarificationCalculationOptions,
  ): PrixCalcule {
    const quantiteNormalisee = Math.max(1, Math.floor(Number(quantite || 0)));
    const config = this.parseConfig(produit.configTarification);

    const prixBase = Number.isNaN(config.prixBase) ? Number(produit.prix || 0) : config.prixBase;
    const prixNegocie =
      options?.prixNegocie !== undefined && options.prixNegocie !== null
        ? Number(options.prixNegocie)
        : prixBase;

    const prixMin = this.round(prixBase * (1 - config.margeNegociation.min / 100));
    const prixMax = this.round(prixBase * (1 + config.margeNegociation.max / 100));

    const prixUnitaire = this.round(Math.min(prixMax, Math.max(prixMin, prixNegocie)));
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
        mode: 'NEGOCIE',
        prixBase,
        margeNegociation: config.margeNegociation,
      },
    };
  }

  private parseConfig(config: Record<string, unknown> | null): NegociationConfig {
    const margeRaw = config?.margeNegociation as Record<string, unknown> | undefined;
    const margeNegociation = {
      min: Number(margeRaw?.min || 0),
      max: Number(margeRaw?.max || 0),
    };

    return {
      prixBase: Number(config?.prixBase),
      margeNegociation: {
        min: Number.isNaN(margeNegociation.min) ? 0 : Math.max(0, margeNegociation.min),
        max: Number.isNaN(margeNegociation.max) ? 0 : Math.max(0, margeNegociation.max),
      },
    };
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}

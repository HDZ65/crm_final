import { ProduitEntity } from '../../entities/produit.entity';
import { TypeTarification } from '../../enums/type-tarification.enum';
import type {
  ITarificationStrategy,
  PrixCalcule,
  TarificationCalculationOptions,
} from '../tarification.engine';

interface IndexeConfig {
  prixBase: number;
  indexReference: string;
  coefficientActuel: number;
  dateReference: string;
}

export class IndexeTarificationStrategy implements ITarificationStrategy {
  readonly typeTarification = TypeTarification.INDEXE;

  calculate(
    produit: ProduitEntity,
    quantite: number,
    options?: TarificationCalculationOptions,
  ): PrixCalcule {
    const quantiteNormalisee = Math.max(1, Math.floor(Number(quantite || 0)));
    const config = this.parseConfig(produit.configTarification);
    const prixBase = Number.isNaN(config.prixBase) ? Number(produit.prix || 0) : config.prixBase;
    const coefficient =
      options?.coefficientIndexe !== undefined
        ? Number(options.coefficientIndexe)
        : config.coefficientActuel;

    const coefficientActuel =
      Number.isNaN(coefficient) || !Number.isFinite(coefficient) || coefficient <= 0 ? 1 : coefficient;
    const prixUnitaire = this.round(prixBase * coefficientActuel);
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
        mode: 'INDEXE',
        indexReference: config.indexReference,
        coefficientActuel,
        dateReference: config.dateReference,
      },
    };
  }

  private parseConfig(config: Record<string, unknown> | null): IndexeConfig {
    return {
      prixBase: Number(config?.prixBase),
      indexReference: String(config?.indexReference || ''),
      coefficientActuel: Number(config?.coefficientActuel || 1),
      dateReference: String(config?.dateReference || ''),
    };
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}

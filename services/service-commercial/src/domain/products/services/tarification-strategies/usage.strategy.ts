import { ProduitEntity } from '../../entities/produit.entity';
import { TypeTarification } from '../../enums/type-tarification.enum';
import type {
  ITarificationStrategy,
  PrixCalcule,
  TarificationCalculationOptions,
} from '../tarification.engine';

interface UsageConfig {
  prixParUnite: number;
  unitesMesure: string;
  plancherMensuel: number;
  plafondMensuel: number | null;
}

export class UsageTarificationStrategy implements ITarificationStrategy {
  readonly typeTarification = TypeTarification.USAGE;

  calculate(
    produit: ProduitEntity,
    quantite: number,
    _options?: TarificationCalculationOptions,
  ): PrixCalcule {
    const quantiteNormalisee = Math.max(1, Math.floor(Number(quantite || 0)));
    const config = this.parseConfig(produit.configTarification);
    const prixParUnite = Number.isNaN(config.prixParUnite)
      ? Number(produit.prix || 0)
      : config.prixParUnite;

    const brut = this.round(prixParUnite * quantiteNormalisee);
    const avecPlancher = Math.max(brut, this.round(config.plancherMensuel));
    const borne =
      config.plafondMensuel !== null
        ? Math.min(avecPlancher, this.round(config.plafondMensuel))
        : avecPlancher;
    const prixTotalHt = this.round(borne);
    const prixUnitaire = this.round(prixTotalHt / quantiteNormalisee);
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
        mode: 'USAGE',
        unitesMesure: config.unitesMesure,
      },
    };
  }

  private parseConfig(config: Record<string, unknown> | null): UsageConfig {
    const prixParUnite = Number(config?.prixParUnite);
    const unitesMesure = String(config?.unitesMesure || 'UNITE');
    const plancherMensuel = Number(config?.plancherMensuel || 0);
    const plafondMensuel =
      config?.plafondMensuel === null || config?.plafondMensuel === undefined
        ? null
        : Number(config.plafondMensuel);

    return {
      prixParUnite,
      unitesMesure,
      plancherMensuel,
      plafondMensuel: Number.isNaN(Number(plafondMensuel)) ? null : plafondMensuel,
    };
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}

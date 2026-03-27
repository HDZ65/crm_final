import { ProduitEntity } from '../../entities/produit.entity';
import { TypeTarification } from '../../enums/type-tarification.enum';
import type {
  ITarificationStrategy,
  PrixCalcule,
  TarificationCalculationOptions,
} from '../tarification.engine';

interface RecurrentConfig {
  frequence: string;
  prixMensuel: number;
  dureeMinimale: number;
}

export class RecurrentTarificationStrategy implements ITarificationStrategy {
  readonly typeTarification = TypeTarification.RECURRENT;

  calculate(
    produit: ProduitEntity,
    quantite: number,
    _options?: TarificationCalculationOptions,
  ): PrixCalcule {
    const quantiteNormalisee = Math.max(1, Math.floor(Number(quantite || 0)));
    const config = this.parseConfig(produit.configTarification);
    const frequence = config.frequence;
    const prixMensuel = Number.isNaN(config.prixMensuel)
      ? Number(produit.prix || 0)
      : config.prixMensuel;

    const prixUnitaire =
      frequence === 'ANNUEL' || frequence === 'ANNUAL'
        ? this.round(prixMensuel * 12)
        : this.round(prixMensuel);
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
        mode: 'RECURRENT',
        frequence,
        dureeMinimale: config.dureeMinimale,
      },
    };
  }

  private parseConfig(config: Record<string, unknown> | null): RecurrentConfig {
    const frequence = String(config?.frequence || 'MENSUEL').toUpperCase();
    const prixMensuel = Number(config?.prixMensuel);
    const dureeMinimale = Number(config?.dureeMinimale || 0);

    return {
      frequence,
      prixMensuel,
      dureeMinimale,
    };
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}

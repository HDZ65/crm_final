import { ProduitEntity } from '../../entities/produit.entity';
import { TypeTarification } from '../../enums/type-tarification.enum';
import type {
  ITarificationStrategy,
  PrixCalcule,
  TarificationCalculationOptions,
} from '../tarification.engine';

export class FixeTarificationStrategy implements ITarificationStrategy {
  readonly typeTarification = TypeTarification.FIXE;

  calculate(
    produit: ProduitEntity,
    quantite: number,
    _options?: TarificationCalculationOptions,
  ): PrixCalcule {
    const quantiteNormalisee = Math.max(1, Math.floor(Number(quantite || 0)));
    const prixUnitaire = this.round(Number(produit.prix || 0));
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
        mode: 'FIXE',
      },
    };
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}

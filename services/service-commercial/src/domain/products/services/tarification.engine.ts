import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FormuleProduitEntity } from '../entities/formule-produit.entity';
import { PrixProduitEntity } from '../entities/prix-produit.entity';
import { ProduitEntity } from '../entities/produit.entity';
import { TypeTarification } from '../enums/type-tarification.enum';
import { BundleTarificationStrategy } from './tarification-strategies/bundle.strategy';
import { FixeTarificationStrategy } from './tarification-strategies/fixe.strategy';
import { IndexeTarificationStrategy } from './tarification-strategies/indexe.strategy';
import { NegocieTarificationStrategy } from './tarification-strategies/negocie.strategy';
import { PalierTarificationStrategy } from './tarification-strategies/palier.strategy';
import { RecurrentTarificationStrategy } from './tarification-strategies/recurrent.strategy';
import { UsageTarificationStrategy } from './tarification-strategies/usage.strategy';

export type TarificationSource = 'FORMULE' | 'GRILLE' | 'PROMOTION' | 'MODELE';

export interface TarificationCalculationOptions {
  grilleTarifaireId?: string;
  formuleId?: string;
  formuleCode?: string;
  remiseAdditionnelle?: number;
  dateEvaluation?: Date;
  prixNegocie?: number;
  coefficientIndexe?: number;
}

export interface PrixCalcule {
  prixUnitaire: number;
  prixApresRemise: number;
  prixTotalHt: number;
  tva: number;
  prixTotalTtc: number;
  promotionAppliquee: boolean;
  sourceTarification: TarificationSource;
  typeTarification: TypeTarification;
  details?: Record<string, unknown>;
}

export interface ITarificationStrategy {
  readonly typeTarification: TypeTarification;
  calculate(
    produit: ProduitEntity,
    quantite: number,
    options?: TarificationCalculationOptions,
  ): PrixCalcule;
}

export interface ITarificationEngine {
  calculate(
    produitId: string,
    quantite: number,
    options?: TarificationCalculationOptions,
  ): Promise<PrixCalcule>;
}

@Injectable()
export class TarificationService implements ITarificationEngine {
  private readonly strategies = new Map<TypeTarification, ITarificationStrategy>();

  constructor(
    @InjectRepository(ProduitEntity)
    private readonly produitRepository: Repository<ProduitEntity>,
    @InjectRepository(PrixProduitEntity)
    private readonly prixProduitRepository: Repository<PrixProduitEntity>,
    @InjectRepository(FormuleProduitEntity)
    private readonly formuleProduitRepository: Repository<FormuleProduitEntity>,
  ) {
    const strategyInstances: ITarificationStrategy[] = [
      new FixeTarificationStrategy(),
      new PalierTarificationStrategy(),
      new RecurrentTarificationStrategy(),
      new UsageTarificationStrategy(),
      new BundleTarificationStrategy(),
      new NegocieTarificationStrategy(),
      new IndexeTarificationStrategy(),
    ];

    for (const strategy of strategyInstances) {
      this.strategies.set(strategy.typeTarification, strategy);
    }
  }

  async calculate(
    produitId: string,
    quantite: number,
    options: TarificationCalculationOptions = {},
  ): Promise<PrixCalcule> {
    const quantiteNormalisee = Math.max(1, Math.floor(Number(quantite || 0)));
    const produit = await this.produitRepository.findOne({ where: { id: produitId } });

    if (!produit) {
      throw new Error(`Produit ${produitId} introuvable`);
    }

    const strategy = this.resolveStrategy(produit.typeTarification);
    const strategyPrice = strategy.calculate(produit, quantiteNormalisee, options);

    const formule = await this.resolveFormule(produit.id, options);
    const prixGrille = await this.resolvePrixGrille(produit.id, options.grilleTarifaireId);
    const promotionActive = this.isPromotionActive(produit, options.dateEvaluation);

    let sourceTarification: TarificationSource = 'MODELE';
    let prixUnitaireBase = strategyPrice.prixUnitaire;
    let prixTotalHtBase = strategyPrice.prixTotalHt;

    if (formule?.prixFormule !== null && formule?.prixFormule !== undefined) {
      sourceTarification = 'FORMULE';
      prixUnitaireBase = this.round(Number(formule.prixFormule));
      prixTotalHtBase = this.round(prixUnitaireBase * quantiteNormalisee);
    } else if (prixGrille) {
      sourceTarification = 'GRILLE';
      prixUnitaireBase = this.resolvePrixGrilleUnitaire(prixGrille);
      prixTotalHtBase = this.round(prixUnitaireBase * quantiteNormalisee);
    } else if (promotionActive && produit.prixPromotion !== null && produit.prixPromotion !== undefined) {
      sourceTarification = 'PROMOTION';
      prixUnitaireBase = this.round(Number(produit.prixPromotion));
      prixTotalHtBase = this.round(prixUnitaireBase * quantiteNormalisee);
    }

    const remiseAdditionnelle = this.clampPercentage(Number(options.remiseAdditionnelle || 0));
    const prixTotalHt = this.round(prixTotalHtBase * (1 - remiseAdditionnelle / 100));
    const prixApresRemise = this.round(prixTotalHt / quantiteNormalisee);
    const tauxTva = Number(produit.tauxTva || 0);
    const tva = this.round(prixTotalHt * (tauxTva / 100));
    const prixTotalTtc = this.round(prixTotalHt + tva);

    const details: Record<string, unknown> = {
      ...(strategyPrice.details || {}),
      formuleId: formule?.id,
      grilleTarifaireId: prixGrille?.grilleTarifaireId,
      remiseAdditionnelle,
    };

    return {
      prixUnitaire: prixUnitaireBase,
      prixApresRemise,
      prixTotalHt,
      tva,
      prixTotalTtc,
      promotionAppliquee: sourceTarification === 'PROMOTION',
      sourceTarification,
      typeTarification: produit.typeTarification,
      details,
    };
  }

  private resolveStrategy(typeTarification: TypeTarification): ITarificationStrategy {
    return (
      this.strategies.get(typeTarification) ||
      this.strategies.get(TypeTarification.FIXE) ||
      new FixeTarificationStrategy()
    );
  }

  private async resolveFormule(
    produitId: string,
    options: TarificationCalculationOptions,
  ): Promise<FormuleProduitEntity | null> {
    if (options.formuleId) {
      return this.formuleProduitRepository.findOne({
        where: { id: options.formuleId, produitId, actif: true },
      });
    }

    if (options.formuleCode) {
      return this.formuleProduitRepository.findOne({
        where: { produitId, code: options.formuleCode, actif: true },
      });
    }

    return null;
  }

  private async resolvePrixGrille(
    produitId: string,
    grilleTarifaireId?: string,
  ): Promise<PrixProduitEntity | null> {
    if (!grilleTarifaireId) {
      return null;
    }

    return this.prixProduitRepository.findOne({
      where: {
        produitId,
        grilleTarifaireId,
        actif: true,
      },
    });
  }

  private resolvePrixGrilleUnitaire(prixProduit: PrixProduitEntity): number {
    const prixUnitaire = Number(prixProduit.prixUnitaire || 0);
    const remisePourcent = Number(prixProduit.remisePourcent || 0);

    let prixNet = this.round(prixUnitaire * (1 - remisePourcent / 100));

    if (prixProduit.prixMinimum !== null && prixProduit.prixMinimum !== undefined) {
      prixNet = Math.max(prixNet, Number(prixProduit.prixMinimum));
    }

    if (prixProduit.prixMaximum !== null && prixProduit.prixMaximum !== undefined) {
      prixNet = Math.min(prixNet, Number(prixProduit.prixMaximum));
    }

    return this.round(prixNet);
  }

  private isPromotionActive(produit: ProduitEntity, dateEvaluation: Date = new Date()): boolean {
    if (!produit.promotionActive || produit.prixPromotion === null || produit.prixPromotion === undefined) {
      return false;
    }

    if (produit.dateDebutPromotion && dateEvaluation < new Date(produit.dateDebutPromotion)) {
      return false;
    }

    if (produit.dateFinPromotion && dateEvaluation > new Date(produit.dateFinPromotion)) {
      return false;
    }

    return true;
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

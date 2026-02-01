import { Injectable, Logger } from '@nestjs/common';
import { ProduitService } from '../produit/produit.service';
import { GrilleTarifaireService } from '../grille-tarifaire/grille-tarifaire.service';
import { PrixProduitService } from '../prix-produit/prix-produit.service';
import { ProduitEntity } from '../produit/entities/produit.entity';
import { PrixProduitEntity } from '../prix-produit/entities/prix-produit.entity';
import { GrilleTarifaireEntity } from '../grille-tarifaire/entities/grille-tarifaire.entity';
import type { GetCatalogRequest, CalculatePriceRequest } from '@crm/proto/products';

export interface CatalogItem {
  produit: ProduitEntity;
  prix: PrixProduitEntity | null;
  prixFinal: number;
  enPromotion: boolean;
}

export interface GetCatalogResult {
  items: CatalogItem[];
  grilleUtilisee: GrilleTarifaireEntity;
}

export interface CalculatePriceResult {
  prixUnitaire: number;
  prixApresRemise: number;
  prixTotalHt: number;
  tva: number;
  prixTotalTtc: number;
  promotionAppliquee: boolean;
}

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly produitService: ProduitService,
    private readonly grilleService: GrilleTarifaireService,
    private readonly prixProduitService: PrixProduitService,
  ) {}

  async getCatalog(input: GetCatalogRequest): Promise<GetCatalogResult> {
    const { organisationId, grilleTarifaireId, gammeId, includeInactive } = input;
    this.logger.log(`Getting catalog for organisation ${organisationId}`);

    // Get the pricing grid
    let grille: GrilleTarifaireEntity;
    if (grilleTarifaireId) {
      grille = await this.grilleService.findById({ id: grilleTarifaireId });
    } else {
      grille = await this.grilleService.findActive({
        organisationId,
        date: new Date().toISOString(),
      });
    }

    // Get all products for the organisation
    const produits = await this.produitService.findByOrganisation({
      organisationId,
      actif: includeInactive ? undefined : true,
    });

    // Get all prices for this grid
    const prixProduits = await this.prixProduitService.findByGrille({
      grilleTarifaireId: grille.id,
    });
    const prixMap = new Map<string, PrixProduitEntity>();
    for (const prix of prixProduits) {
      prixMap.set(prix.produitId, prix);
    }

    // Build catalog items
    const items: CatalogItem[] = [];
    const now = new Date();

    for (const produit of produits) {
      // Filter by gamme if specified
      if (gammeId && produit.gammeId !== gammeId) {
        continue;
      }

      const prix = prixMap.get(produit.id) || null;
      const enPromotion = this.isPromotionActive(produit, now);
      const prixFinal = this.calculateFinalPrice(produit, prix, enPromotion);

      items.push({
        produit,
        prix,
        prixFinal,
        enPromotion,
      });
    }

    return {
      items,
      grilleUtilisee: grille,
    };
  }

  async calculatePrice(input: CalculatePriceRequest): Promise<CalculatePriceResult> {
    const { produitId, grilleTarifaireId, quantite, remiseAdditionnelle = 0 } = input;
    const produit = await this.produitService.findById({ id: produitId });
    const now = new Date();
    const enPromotion = this.isPromotionActive(produit, now);

    let prixProduit: PrixProduitEntity | null = null;
    try {
      prixProduit = await this.prixProduitService.findForProduit({
        grilleTarifaireId,
        produitId,
      });
    } catch {
      // No price in grid, use product base price
    }

    // Base price (from grid or product)
    let prixUnitaire = prixProduit ? Number(prixProduit.prixUnitaire) : Number(produit.prix);

    // Apply promotion if active
    if (enPromotion && produit.prixPromotion !== null) {
      prixUnitaire = Number(produit.prixPromotion);
    }

    // Calculate discount
    let remiseTotale = remiseAdditionnelle;
    if (prixProduit) {
      remiseTotale += Number(prixProduit.remisePourcent);
    }

    const prixApresRemise = prixUnitaire * (1 - remiseTotale / 100);

    // Apply min/max constraints
    let prixFinal = prixApresRemise;
    if (prixProduit) {
      if (prixProduit.prixMinimum !== null && prixFinal < Number(prixProduit.prixMinimum)) {
        prixFinal = Number(prixProduit.prixMinimum);
      }
      if (prixProduit.prixMaximum !== null && prixFinal > Number(prixProduit.prixMaximum)) {
        prixFinal = Number(prixProduit.prixMaximum);
      }
    }

    const prixTotalHt = prixFinal * quantite;
    const tauxTva = Number(produit.tauxTva);
    const tva = prixTotalHt * (tauxTva / 100);
    const prixTotalTtc = prixTotalHt + tva;

    return {
      prixUnitaire,
      prixApresRemise: prixFinal,
      prixTotalHt,
      tva,
      prixTotalTtc,
      promotionAppliquee: enPromotion,
    };
  }

  private isPromotionActive(produit: ProduitEntity, date: Date): boolean {
    if (!produit.promotionActive || produit.prixPromotion === null) {
      return false;
    }

    if (produit.dateDebutPromotion && date < produit.dateDebutPromotion) {
      return false;
    }

    if (produit.dateFinPromotion && date > produit.dateFinPromotion) {
      return false;
    }

    return true;
  }

  private calculateFinalPrice(
    produit: ProduitEntity,
    prix: PrixProduitEntity | null,
    enPromotion: boolean,
  ): number {
    // Promotion takes precedence
    if (enPromotion && produit.prixPromotion !== null) {
      return Number(produit.prixPromotion);
    }

    // Grid price
    if (prix) {
      let prixFinal = Number(prix.prixUnitaire) * (1 - Number(prix.remisePourcent) / 100);

      if (prix.prixMinimum !== null && prixFinal < Number(prix.prixMinimum)) {
        prixFinal = Number(prix.prixMinimum);
      }
      if (prix.prixMaximum !== null && prixFinal > Number(prix.prixMaximum)) {
        prixFinal = Number(prix.prixMaximum);
      }

      return prixFinal;
    }

    // Base product price
    return Number(produit.prix);
  }
}

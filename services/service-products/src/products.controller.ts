import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import type {
  CreateGammeRequest,
  UpdateGammeRequest,
  GetGammeRequest,
  ListGammesRequest,
  DeleteGammeRequest,
  CreateProduitRequest,
  UpdateProduitRequest,
  GetProduitRequest,
  GetProduitBySkuRequest,
  ListProduitsRequest,
  DeleteProduitRequest,
  SetPromotionRequest,
  ClearPromotionRequest,
  CreateGrilleTarifaireRequest,
  UpdateGrilleTarifaireRequest,
  GetGrilleTarifaireRequest,
  GetGrilleTarifaireActiveRequest,
  ListGrillesTarifairesRequest,
  DeleteGrilleTarifaireRequest,
  SetGrilleParDefautRequest,
  CreatePrixProduitRequest,
  UpdatePrixProduitRequest,
  GetPrixProduitRequest,
  GetPrixForProduitRequest,
  ListPrixProduitsRequest,
  DeletePrixProduitRequest,
  BulkCreatePrixProduitsRequest,
  GetCatalogRequest,
  CalculatePriceRequest,
} from '@proto/products/products';
import {
  CategorieProduit as ProtoCategorieProduit,
  TypeProduit as ProtoTypeProduit,
} from '@proto/products/products';

import { GammeService } from './modules/gamme/gamme.service';
import { ProduitService } from './modules/produit/produit.service';
import { GrilleTarifaireService } from './modules/grille-tarifaire/grille-tarifaire.service';
import { PrixProduitService } from './modules/prix-produit/prix-produit.service';
import { CatalogService } from './modules/catalog/catalog.service';

import { TypeProduit, CategorieProduit } from './modules/produit/entities/produit.entity';

const categorieFromProto: Record<ProtoCategorieProduit, CategorieProduit> = {
  [ProtoCategorieProduit.ASSURANCE]: CategorieProduit.ASSURANCE,
  [ProtoCategorieProduit.PREVOYANCE]: CategorieProduit.PREVOYANCE,
  [ProtoCategorieProduit.EPARGNE]: CategorieProduit.EPARGNE,
  [ProtoCategorieProduit.SERVICE]: CategorieProduit.SERVICE,
  [ProtoCategorieProduit.ACCESSOIRE]: CategorieProduit.ACCESSOIRE,
  [ProtoCategorieProduit.CATEGORIE_PRODUIT_UNSPECIFIED]: CategorieProduit.SERVICE,
};

const typeFromProto = (proto: ProtoTypeProduit): TypeProduit =>
  proto === ProtoTypeProduit.INTERNE ? TypeProduit.INTERNE : TypeProduit.PARTENAIRE;

@Controller()
export class ProductsController {
  constructor(
    private readonly gammeService: GammeService,
    private readonly produitService: ProduitService,
    private readonly grilleService: GrilleTarifaireService,
    private readonly prixProduitService: PrixProduitService,
    private readonly catalogService: CatalogService,
  ) {}

  @GrpcMethod('GammeService', 'Create')
  async createGamme(data: CreateGammeRequest) {
    return this.gammeService.create({
      organisationId: data.organisationId,
      nom: data.nom,
      description: data.description,
      icone: data.icone,
      code: data.code,
      ordre: data.ordre,
    });
  }

  @GrpcMethod('GammeService', 'Update')
  async updateGamme(data: UpdateGammeRequest) {
    return this.gammeService.update(data);
  }

  @GrpcMethod('GammeService', 'Get')
  async getGamme(data: GetGammeRequest) {
    return this.gammeService.findById(data.id);
  }

  @GrpcMethod('GammeService', 'List')
  async listGammes(data: ListGammesRequest) {
    return this.gammeService.findAll({
      organisationId: data.organisationId,
      actif: data.actif,
      pagination: data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
    });
  }

  @GrpcMethod('GammeService', 'Delete')
  async deleteGamme(data: DeleteGammeRequest) {
    const success = await this.gammeService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ProduitService', 'Create')
  async createProduit(data: CreateProduitRequest) {
    return this.produitService.create({
      organisationId: data.organisationId,
      gammeId: data.gammeId,
      sku: data.sku,
      nom: data.nom,
      description: data.description,
      categorie: data.categorie ? categorieFromProto[data.categorie] : undefined,
      type: data.type ? typeFromProto(data.type) : undefined,
      prix: data.prix,
      tauxTva: data.tauxTva,
      devise: data.devise,
      imageUrl: data.imageUrl,
      codeExterne: data.codeExterne,
      metadata: data.metadata,
    });
  }

  @GrpcMethod('ProduitService', 'Update')
  async updateProduit(data: UpdateProduitRequest) {
    return this.produitService.update({
      id: data.id,
      gammeId: data.gammeId,
      sku: data.sku,
      nom: data.nom,
      description: data.description,
      categorie: data.categorie ? categorieFromProto[data.categorie] : undefined,
      type: data.type ? typeFromProto(data.type) : undefined,
      prix: data.prix,
      tauxTva: data.tauxTva,
      devise: data.devise,
      actif: data.actif,
      imageUrl: data.imageUrl,
      codeExterne: data.codeExterne,
      metadata: data.metadata,
    });
  }

  @GrpcMethod('ProduitService', 'Get')
  async getProduit(data: GetProduitRequest) {
    return this.produitService.findById(data.id);
  }

  @GrpcMethod('ProduitService', 'GetBySku')
  async getProduitBySku(data: GetProduitBySkuRequest) {
    return this.produitService.findBySku(data.organisationId, data.sku);
  }

  @GrpcMethod('ProduitService', 'List')
  async listProduits(data: ListProduitsRequest) {
    return this.produitService.findAll({
      organisationId: data.organisationId,
      gammeId: data.gammeId,
      categorie: data.categorie ? categorieFromProto[data.categorie] : undefined,
      type: data.type ? typeFromProto(data.type) : undefined,
      actif: data.actif,
      promotionActive: data.promotionActive,
      search: data.search,
      pagination: data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
    });
  }

  @GrpcMethod('ProduitService', 'Delete')
  async deleteProduit(data: DeleteProduitRequest) {
    const success = await this.produitService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ProduitService', 'SetPromotion')
  async setPromotion(data: SetPromotionRequest) {
    return this.produitService.setPromotion(
      data.produitId,
      data.prixPromotion,
      new Date(data.dateDebut),
      new Date(data.dateFin),
    );
  }

  @GrpcMethod('ProduitService', 'ClearPromotion')
  async clearPromotion(data: ClearPromotionRequest) {
    return this.produitService.clearPromotion(data.produitId);
  }

  @GrpcMethod('GrilleTarifaireService', 'Create')
  async createGrilleTarifaire(data: CreateGrilleTarifaireRequest) {
    return this.grilleService.create({
      organisationId: data.organisationId,
      nom: data.nom,
      description: data.description,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
      dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      estParDefaut: data.estParDefaut,
    });
  }

  @GrpcMethod('GrilleTarifaireService', 'Update')
  async updateGrilleTarifaire(data: UpdateGrilleTarifaireRequest) {
    return this.grilleService.update({
      id: data.id,
      nom: data.nom,
      description: data.description,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
      dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      estParDefaut: data.estParDefaut,
      actif: data.actif,
    });
  }

  @GrpcMethod('GrilleTarifaireService', 'Get')
  async getGrilleTarifaire(data: GetGrilleTarifaireRequest) {
    return this.grilleService.findById(data.id);
  }

  @GrpcMethod('GrilleTarifaireService', 'GetActive')
  async getGrilleTarifaireActive(data: GetGrilleTarifaireActiveRequest) {
    return this.grilleService.findActive(
      data.organisationId,
      new Date(data.date || Date.now()),
    );
  }

  @GrpcMethod('GrilleTarifaireService', 'List')
  async listGrillesTarifaires(data: ListGrillesTarifairesRequest) {
    return this.grilleService.findAll({
      organisationId: data.organisationId,
      actif: data.actif,
      estParDefaut: data.estParDefaut,
      pagination: data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
    });
  }

  @GrpcMethod('GrilleTarifaireService', 'Delete')
  async deleteGrilleTarifaire(data: DeleteGrilleTarifaireRequest) {
    const success = await this.grilleService.delete(data.id);
    return { success };
  }

  @GrpcMethod('GrilleTarifaireService', 'SetParDefaut')
  async setGrilleParDefaut(data: SetGrilleParDefautRequest) {
    return this.grilleService.setParDefaut(data.id);
  }

  @GrpcMethod('PrixProduitService', 'Create')
  async createPrixProduit(data: CreatePrixProduitRequest) {
    return this.prixProduitService.create({
      grilleTarifaireId: data.grilleTarifaireId,
      produitId: data.produitId,
      prixUnitaire: data.prixUnitaire,
      remisePourcent: data.remisePourcent,
      prixMinimum: data.prixMinimum,
      prixMaximum: data.prixMaximum,
    });
  }

  @GrpcMethod('PrixProduitService', 'Update')
  async updatePrixProduit(data: UpdatePrixProduitRequest) {
    return this.prixProduitService.update({
      id: data.id,
      prixUnitaire: data.prixUnitaire,
      remisePourcent: data.remisePourcent,
      prixMinimum: data.prixMinimum,
      prixMaximum: data.prixMaximum,
      actif: data.actif,
    });
  }

  @GrpcMethod('PrixProduitService', 'Get')
  async getPrixProduit(data: GetPrixProduitRequest) {
    return this.prixProduitService.findById(data.id);
  }

  @GrpcMethod('PrixProduitService', 'GetForProduit')
  async getPrixForProduit(data: GetPrixForProduitRequest) {
    return this.prixProduitService.findForProduit(
      data.grilleTarifaireId,
      data.produitId,
    );
  }

  @GrpcMethod('PrixProduitService', 'List')
  async listPrixProduits(data: ListPrixProduitsRequest) {
    return this.prixProduitService.findAll({
      grilleTarifaireId: data.grilleTarifaireId,
      produitId: data.produitId,
      actif: data.actif,
      pagination: data.pagination
        ? {
            page: data.pagination.page,
            limit: data.pagination.limit,
            sortBy: data.pagination.sortBy,
            sortOrder: data.pagination.sortOrder,
          }
        : undefined,
    });
  }

  @GrpcMethod('PrixProduitService', 'Delete')
  async deletePrixProduit(data: DeletePrixProduitRequest) {
    const success = await this.prixProduitService.delete(data.id);
    return { success };
  }

  @GrpcMethod('PrixProduitService', 'BulkCreate')
  async bulkCreatePrixProduits(data: BulkCreatePrixProduitsRequest) {
    const items = data.items.map((item) => ({
      produitId: item.produitId,
      prixUnitaire: item.prixUnitaire,
      remisePourcent: item.remisePourcent,
      prixMinimum: item.prixMinimum,
      prixMaximum: item.prixMaximum,
    }));
    const created = await this.prixProduitService.bulkCreate(data.grilleTarifaireId, items);
    return { created, count: created.length };
  }

  @GrpcMethod('CatalogService', 'GetCatalog')
  async getCatalog(data: GetCatalogRequest) {
    return this.catalogService.getCatalog(
      data.organisationId,
      data.grilleTarifaireId,
      data.gammeId,
      data.includeInactive,
    );
  }

  @GrpcMethod('CatalogService', 'CalculatePrice')
  async calculatePrice(data: CalculatePriceRequest) {
    return this.catalogService.calculatePrice(
      data.produitId,
      data.grilleTarifaireId,
      data.quantite,
      data.remiseAdditionnelle,
    );
  }
}

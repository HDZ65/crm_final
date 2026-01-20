import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import type {
  Gamme,
  CreateGammeRequest,
  UpdateGammeRequest,
  GetGammeRequest,
  ListGammesRequest,
  ListGammesResponse,
  DeleteGammeRequest,
  DeleteGammeResponse,
  Produit,
  CreateProduitRequest,
  UpdateProduitRequest,
  GetProduitRequest,
  GetProduitBySkuRequest,
  ListProduitsRequest,
  ListProduitsResponse,
  DeleteProduitRequest,
  DeleteProduitResponse,
  SetPromotionRequest,
  ClearPromotionRequest,
  GrilleTarifaire,
  CreateGrilleTarifaireRequest,
  UpdateGrilleTarifaireRequest,
  GetGrilleTarifaireRequest,
  GetGrilleTarifaireActiveRequest,
  ListGrillesTarifairesRequest,
  ListGrillesTarifairesResponse,
  DeleteGrilleTarifaireRequest,
  DeleteGrilleTarifaireResponse,
  SetGrilleParDefautRequest,
  PrixProduit,
  CreatePrixProduitRequest,
  UpdatePrixProduitRequest,
  GetPrixProduitRequest,
  GetPrixForProduitRequest,
  ListPrixProduitsRequest,
  ListPrixProduitsResponse,
  DeletePrixProduitRequest,
  DeletePrixProduitResponse,
  BulkCreatePrixProduitsRequest,
  BulkCreatePrixProduitsResponse,
  GetCatalogRequest,
  CatalogItem,
  GetCatalogResponse,
  CalculatePriceRequest,
  CalculatePriceResponse,
} from '@proto/products/products';

import { GammeService } from './modules/gamme/gamme.service';
import { ProduitService } from './modules/produit/produit.service';
import { GrilleTarifaireService } from './modules/grille-tarifaire/grille-tarifaire.service';
import { PrixProduitService } from './modules/prix-produit/prix-produit.service';
import { CatalogService } from './modules/catalog/catalog.service';

import { GammeEntity } from './modules/gamme/entities/gamme.entity';
import { ProduitEntity, TypeProduit, CategorieProduit } from './modules/produit/entities/produit.entity';
import { GrilleTarifaireEntity } from './modules/grille-tarifaire/entities/grille-tarifaire.entity';
import { PrixProduitEntity } from './modules/prix-produit/entities/prix-produit.entity';

import {
  CategorieProduit as ProtoCategorieProduit,
  TypeProduit as ProtoTypeProduit,
} from '@proto/products/products';

function toProtoGamme(gamme: GammeEntity): Gamme {
  return {
    id: gamme.id,
    organisationId: gamme.organisationId,
    nom: gamme.nom,
    description: gamme.description || '',
    icone: gamme.icone || '',
    code: gamme.code,
    ordre: gamme.ordre,
    actif: gamme.actif,
    createdAt: gamme.createdAt?.toISOString() || '',
    updatedAt: gamme.updatedAt?.toISOString() || '',
  };
}

function categorieToProto(categorie: CategorieProduit): ProtoCategorieProduit {
  const map: Record<CategorieProduit, ProtoCategorieProduit> = {
    [CategorieProduit.ASSURANCE]: ProtoCategorieProduit.ASSURANCE,
    [CategorieProduit.PREVOYANCE]: ProtoCategorieProduit.PREVOYANCE,
    [CategorieProduit.EPARGNE]: ProtoCategorieProduit.EPARGNE,
    [CategorieProduit.SERVICE]: ProtoCategorieProduit.SERVICE,
    [CategorieProduit.ACCESSOIRE]: ProtoCategorieProduit.ACCESSOIRE,
  };
  return map[categorie] || ProtoCategorieProduit.CATEGORIE_PRODUIT_UNSPECIFIED;
}

function protoToCategorie(proto: ProtoCategorieProduit): CategorieProduit {
  const map: Record<ProtoCategorieProduit, CategorieProduit> = {
    [ProtoCategorieProduit.ASSURANCE]: CategorieProduit.ASSURANCE,
    [ProtoCategorieProduit.PREVOYANCE]: CategorieProduit.PREVOYANCE,
    [ProtoCategorieProduit.EPARGNE]: CategorieProduit.EPARGNE,
    [ProtoCategorieProduit.SERVICE]: CategorieProduit.SERVICE,
    [ProtoCategorieProduit.ACCESSOIRE]: CategorieProduit.ACCESSOIRE,
    [ProtoCategorieProduit.CATEGORIE_PRODUIT_UNSPECIFIED]: CategorieProduit.SERVICE,
  };
  return map[proto] ?? CategorieProduit.SERVICE;
}

function typeToProto(type: TypeProduit): ProtoTypeProduit {
  return type === TypeProduit.INTERNE ? ProtoTypeProduit.INTERNE : ProtoTypeProduit.PARTENAIRE;
}

function protoToType(proto: ProtoTypeProduit): TypeProduit {
  return proto === ProtoTypeProduit.INTERNE ? TypeProduit.INTERNE : TypeProduit.PARTENAIRE;
}

function toProtoProduit(produit: ProduitEntity): Produit {
  return {
    id: produit.id,
    organisationId: produit.organisationId,
    gammeId: produit.gammeId || '',
    sku: produit.sku,
    nom: produit.nom,
    description: produit.description || '',
    categorie: categorieToProto(produit.categorie),
    type: typeToProto(produit.type),
    prix: Number(produit.prix),
    tauxTva: Number(produit.tauxTva),
    devise: produit.devise,
    actif: produit.actif,
    promotionActive: produit.promotionActive,
    prixPromotion: produit.prixPromotion ? Number(produit.prixPromotion) : 0,
    dateDebutPromotion: produit.dateDebutPromotion?.toISOString() || '',
    dateFinPromotion: produit.dateFinPromotion?.toISOString() || '',
    imageUrl: produit.imageUrl || '',
    codeExterne: produit.codeExterne || '',
    metadata: produit.metadata ? JSON.stringify(produit.metadata) : '',
    createdAt: produit.createdAt?.toISOString() || '',
    updatedAt: produit.updatedAt?.toISOString() || '',
    gamme: produit.gamme ? toProtoGamme(produit.gamme) : undefined,
  };
}

function toProtoGrilleTarifaire(grille: GrilleTarifaireEntity): GrilleTarifaire {
  return {
    id: grille.id,
    organisationId: grille.organisationId,
    nom: grille.nom,
    description: grille.description || '',
    dateDebut: grille.dateDebut?.toISOString().split('T')[0] || '',
    dateFin: grille.dateFin?.toISOString().split('T')[0] || '',
    estParDefaut: grille.estParDefaut,
    actif: grille.actif,
    createdAt: grille.createdAt?.toISOString() || '',
    updatedAt: grille.updatedAt?.toISOString() || '',
    prixProduits: grille.prixProduits?.map(toProtoPrixProduit) || [],
  };
}

function toProtoPrixProduit(prix: PrixProduitEntity): PrixProduit {
  return {
    id: prix.id,
    grilleTarifaireId: prix.grilleTarifaireId,
    produitId: prix.produitId,
    prixUnitaire: Number(prix.prixUnitaire),
    remisePourcent: Number(prix.remisePourcent),
    prixMinimum: prix.prixMinimum ? Number(prix.prixMinimum) : 0,
    prixMaximum: prix.prixMaximum ? Number(prix.prixMaximum) : 0,
    actif: prix.actif,
    createdAt: prix.createdAt?.toISOString() || '',
    updatedAt: prix.updatedAt?.toISOString() || '',
    produit: prix.produit ? toProtoProduit(prix.produit) : undefined,
    grilleTarifaire: prix.grilleTarifaire ? toProtoGrilleTarifaire(prix.grilleTarifaire) : undefined,
  };
}

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
  async createGamme(data: CreateGammeRequest): Promise<Gamme> {
    const gamme = await this.gammeService.create({
      organisationId: data.organisationId,
      nom: data.nom,
      description: data.description,
      icone: data.icone,
      code: data.code,
      ordre: data.ordre,
    });
    return toProtoGamme(gamme);
  }

  @GrpcMethod('GammeService', 'Update')
  async updateGamme(data: UpdateGammeRequest): Promise<Gamme> {
    const gamme = await this.gammeService.update(data);
    return toProtoGamme(gamme);
  }

  @GrpcMethod('GammeService', 'Get')
  async getGamme(data: GetGammeRequest): Promise<Gamme> {
    const gamme = await this.gammeService.findById(data.id);
    return toProtoGamme(gamme);
  }

  @GrpcMethod('GammeService', 'List')
  async listGammes(data: ListGammesRequest): Promise<ListGammesResponse> {
    const result = await this.gammeService.findAll({
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
    return {
      gammes: result.gammes.map(toProtoGamme),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('GammeService', 'Delete')
  async deleteGamme(data: DeleteGammeRequest): Promise<DeleteGammeResponse> {
    const success = await this.gammeService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ProduitService', 'Create')
  async createProduit(data: CreateProduitRequest): Promise<Produit> {
    const produit = await this.produitService.create({
      organisationId: data.organisationId,
      gammeId: data.gammeId,
      sku: data.sku,
      nom: data.nom,
      description: data.description,
      categorie: data.categorie ? protoToCategorie(data.categorie) : undefined,
      type: data.type ? protoToType(data.type) : undefined,
      prix: data.prix,
      tauxTva: data.tauxTva,
      devise: data.devise,
      imageUrl: data.imageUrl,
      codeExterne: data.codeExterne,
      metadata: data.metadata,
    });
    return toProtoProduit(produit);
  }

  @GrpcMethod('ProduitService', 'Update')
  async updateProduit(data: UpdateProduitRequest): Promise<Produit> {
    const produit = await this.produitService.update({
      id: data.id,
      gammeId: data.gammeId,
      sku: data.sku,
      nom: data.nom,
      description: data.description,
      categorie: data.categorie ? protoToCategorie(data.categorie) : undefined,
      type: data.type ? protoToType(data.type) : undefined,
      prix: data.prix,
      tauxTva: data.tauxTva,
      devise: data.devise,
      actif: data.actif,
      imageUrl: data.imageUrl,
      codeExterne: data.codeExterne,
      metadata: data.metadata,
    });
    return toProtoProduit(produit);
  }

  @GrpcMethod('ProduitService', 'Get')
  async getProduit(data: GetProduitRequest): Promise<Produit> {
    const produit = await this.produitService.findById(data.id);
    return toProtoProduit(produit);
  }

  @GrpcMethod('ProduitService', 'GetBySku')
  async getProduitBySku(data: GetProduitBySkuRequest): Promise<Produit> {
    const produit = await this.produitService.findBySku(data.organisationId, data.sku);
    return toProtoProduit(produit);
  }

  @GrpcMethod('ProduitService', 'List')
  async listProduits(data: ListProduitsRequest): Promise<ListProduitsResponse> {
    const result = await this.produitService.findAll({
      organisationId: data.organisationId,
      gammeId: data.gammeId,
      categorie: data.categorie ? protoToCategorie(data.categorie) : undefined,
      type: data.type ? protoToType(data.type) : undefined,
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
    return {
      produits: result.produits.map(toProtoProduit),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('ProduitService', 'Delete')
  async deleteProduit(data: DeleteProduitRequest): Promise<DeleteProduitResponse> {
    const success = await this.produitService.delete(data.id);
    return { success };
  }

  @GrpcMethod('ProduitService', 'SetPromotion')
  async setPromotion(data: SetPromotionRequest): Promise<Produit> {
    const produit = await this.produitService.setPromotion(
      data.produitId,
      data.prixPromotion,
      new Date(data.dateDebut),
      new Date(data.dateFin),
    );
    return toProtoProduit(produit);
  }

  @GrpcMethod('ProduitService', 'ClearPromotion')
  async clearPromotion(data: ClearPromotionRequest): Promise<Produit> {
    const produit = await this.produitService.clearPromotion(data.produitId);
    return toProtoProduit(produit);
  }

  @GrpcMethod('GrilleTarifaireService', 'Create')
  async createGrilleTarifaire(data: CreateGrilleTarifaireRequest): Promise<GrilleTarifaire> {
    const grille = await this.grilleService.create({
      organisationId: data.organisationId,
      nom: data.nom,
      description: data.description,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
      dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      estParDefaut: data.estParDefaut,
    });
    return toProtoGrilleTarifaire(grille);
  }

  @GrpcMethod('GrilleTarifaireService', 'Update')
  async updateGrilleTarifaire(data: UpdateGrilleTarifaireRequest): Promise<GrilleTarifaire> {
    const grille = await this.grilleService.update({
      id: data.id,
      nom: data.nom,
      description: data.description,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
      dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
      estParDefaut: data.estParDefaut,
      actif: data.actif,
    });
    return toProtoGrilleTarifaire(grille);
  }

  @GrpcMethod('GrilleTarifaireService', 'Get')
  async getGrilleTarifaire(data: GetGrilleTarifaireRequest): Promise<GrilleTarifaire> {
    const grille = await this.grilleService.findById(data.id);
    return toProtoGrilleTarifaire(grille);
  }

  @GrpcMethod('GrilleTarifaireService', 'GetActive')
  async getGrilleTarifaireActive(data: GetGrilleTarifaireActiveRequest): Promise<GrilleTarifaire> {
    const grille = await this.grilleService.findActive(
      data.organisationId,
      new Date(data.date || Date.now()),
    );
    return toProtoGrilleTarifaire(grille);
  }

  @GrpcMethod('GrilleTarifaireService', 'List')
  async listGrillesTarifaires(data: ListGrillesTarifairesRequest): Promise<ListGrillesTarifairesResponse> {
    const result = await this.grilleService.findAll({
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
    return {
      grilles: result.grilles.map(toProtoGrilleTarifaire),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('GrilleTarifaireService', 'Delete')
  async deleteGrilleTarifaire(data: DeleteGrilleTarifaireRequest): Promise<DeleteGrilleTarifaireResponse> {
    const success = await this.grilleService.delete(data.id);
    return { success };
  }

  @GrpcMethod('GrilleTarifaireService', 'SetParDefaut')
  async setGrilleParDefaut(data: SetGrilleParDefautRequest): Promise<GrilleTarifaire> {
    const grille = await this.grilleService.setParDefaut(data.id);
    return toProtoGrilleTarifaire(grille);
  }

  @GrpcMethod('PrixProduitService', 'Create')
  async createPrixProduit(data: CreatePrixProduitRequest): Promise<PrixProduit> {
    const prix = await this.prixProduitService.create({
      grilleTarifaireId: data.grilleTarifaireId,
      produitId: data.produitId,
      prixUnitaire: data.prixUnitaire,
      remisePourcent: data.remisePourcent,
      prixMinimum: data.prixMinimum,
      prixMaximum: data.prixMaximum,
    });
    return toProtoPrixProduit(prix);
  }

  @GrpcMethod('PrixProduitService', 'Update')
  async updatePrixProduit(data: UpdatePrixProduitRequest): Promise<PrixProduit> {
    const prix = await this.prixProduitService.update({
      id: data.id,
      prixUnitaire: data.prixUnitaire,
      remisePourcent: data.remisePourcent,
      prixMinimum: data.prixMinimum,
      prixMaximum: data.prixMaximum,
      actif: data.actif,
    });
    return toProtoPrixProduit(prix);
  }

  @GrpcMethod('PrixProduitService', 'Get')
  async getPrixProduit(data: GetPrixProduitRequest): Promise<PrixProduit> {
    const prix = await this.prixProduitService.findById(data.id);
    return toProtoPrixProduit(prix);
  }

  @GrpcMethod('PrixProduitService', 'GetForProduit')
  async getPrixForProduit(data: GetPrixForProduitRequest): Promise<PrixProduit> {
    const prix = await this.prixProduitService.findForProduit(
      data.grilleTarifaireId,
      data.produitId,
    );
    return toProtoPrixProduit(prix);
  }

  @GrpcMethod('PrixProduitService', 'List')
  async listPrixProduits(data: ListPrixProduitsRequest): Promise<ListPrixProduitsResponse> {
    const result = await this.prixProduitService.findAll({
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
    return {
      prixProduits: result.prixProduits.map(toProtoPrixProduit),
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      },
    };
  }

  @GrpcMethod('PrixProduitService', 'Delete')
  async deletePrixProduit(data: DeletePrixProduitRequest): Promise<DeletePrixProduitResponse> {
    const success = await this.prixProduitService.delete(data.id);
    return { success };
  }

  @GrpcMethod('PrixProduitService', 'BulkCreate')
  async bulkCreatePrixProduits(data: BulkCreatePrixProduitsRequest): Promise<BulkCreatePrixProduitsResponse> {
    const items = data.items.map((item) => ({
      produitId: item.produitId,
      prixUnitaire: item.prixUnitaire,
      remisePourcent: item.remisePourcent,
      prixMinimum: item.prixMinimum,
      prixMaximum: item.prixMaximum,
    }));
    const created = await this.prixProduitService.bulkCreate(data.grilleTarifaireId, items);
    return {
      created: created.map(toProtoPrixProduit),
      count: created.length,
    };
  }

  @GrpcMethod('CatalogService', 'GetCatalog')
  async getCatalog(data: GetCatalogRequest): Promise<GetCatalogResponse> {
    const result = await this.catalogService.getCatalog(
      data.organisationId,
      data.grilleTarifaireId,
      data.gammeId,
      data.includeInactive,
    );
    return {
      items: result.items.map((item): CatalogItem => ({
        produit: toProtoProduit(item.produit),
        prix: item.prix ? toProtoPrixProduit(item.prix) : undefined,
        prixFinal: item.prixFinal,
        enPromotion: item.enPromotion,
      })),
      grilleUtilisee: toProtoGrilleTarifaire(result.grilleUtilisee),
    };
  }

  @GrpcMethod('CatalogService', 'CalculatePrice')
  async calculatePrice(data: CalculatePriceRequest): Promise<CalculatePriceResponse> {
    const result = await this.catalogService.calculatePrice(
      data.produitId,
      data.grilleTarifaireId,
      data.quantite,
      data.remiseAdditionnelle,
    );
    return {
      prixUnitaire: result.prixUnitaire,
      prixApresRemise: result.prixApresRemise,
      prixTotalHt: result.prixTotalHt,
      tva: result.tva,
      prixTotalTtc: result.prixTotalTtc,
      promotionAppliquee: result.promotionAppliquee,
    };
  }
}

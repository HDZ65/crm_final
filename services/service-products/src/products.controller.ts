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
  CreateProduitVersionRequest,
  UpdateProduitVersionRequest,
  GetProduitVersionRequest,
  ListProduitVersionsRequest,
  CreateProduitDocumentRequest,
  UpdateProduitDocumentRequest,
  GetProduitDocumentRequest,
  ListProduitDocumentsRequest,
  CreateProduitPublicationRequest,
  UpdateProduitPublicationRequest,
  GetProduitPublicationRequest,
  ListProduitPublicationsByVersionRequest,
  ListProduitPublicationsBySocieteRequest,
} from '@proto/products/products';

import { GammeService } from './modules/gamme/gamme.service';
import { ProduitService } from './modules/produit/produit.service';
import { GrilleTarifaireService } from './modules/grille-tarifaire/grille-tarifaire.service';
import { PrixProduitService } from './modules/prix-produit/prix-produit.service';
import { CatalogService } from './modules/catalog/catalog.service';
import { VersionProduitService } from './modules/version-produit/version-produit.service';
import { DocumentProduitService } from './modules/document-produit/document-produit.service';
import { PublicationProduitService } from './modules/publication-produit/publication-produit.service';

@Controller()
export class ProductsController {
  constructor(
    private readonly gammeService: GammeService,
    private readonly produitService: ProduitService,
    private readonly grilleService: GrilleTarifaireService,
    private readonly prixProduitService: PrixProduitService,
    private readonly catalogService: CatalogService,
    private readonly versionProduitService: VersionProduitService,
    private readonly documentProduitService: DocumentProduitService,
    private readonly publicationProduitService: PublicationProduitService,
  ) {}

  @GrpcMethod('GammeService', 'Create')
  async createGamme(data: CreateGammeRequest) {
    return this.gammeService.create(data);
  }

  @GrpcMethod('GammeService', 'Update')
  async updateGamme(data: UpdateGammeRequest) {
    return this.gammeService.update(data);
  }

  @GrpcMethod('GammeService', 'Get')
  async getGamme(data: GetGammeRequest) {
    return this.gammeService.findById(data);
  }

  @GrpcMethod('GammeService', 'List')
  async listGammes(data: ListGammesRequest) {
    return this.gammeService.findAll(data);
  }

  @GrpcMethod('GammeService', 'Delete')
  async deleteGamme(data: DeleteGammeRequest) {
    const success = await this.gammeService.delete(data);
    return { success };
  }

  @GrpcMethod('ProduitService', 'Create')
  async createProduit(data: CreateProduitRequest) {
    return this.produitService.create(data);
  }

  @GrpcMethod('ProduitService', 'Update')
  async updateProduit(data: UpdateProduitRequest) {
    return this.produitService.update(data);
  }

  @GrpcMethod('ProduitService', 'Get')
  async getProduit(data: GetProduitRequest) {
    return this.produitService.findById(data);
  }

  @GrpcMethod('ProduitService', 'GetBySku')
  async getProduitBySku(data: GetProduitBySkuRequest) {
    return this.produitService.findBySku(data);
  }

  @GrpcMethod('ProduitService', 'List')
  async listProduits(data: ListProduitsRequest) {
    return this.produitService.findAll(data);
  }

  @GrpcMethod('ProduitService', 'Delete')
  async deleteProduit(data: DeleteProduitRequest) {
    const success = await this.produitService.delete(data);
    return { success };
  }

  @GrpcMethod('ProduitService', 'SetPromotion')
  async setPromotion(data: SetPromotionRequest) {
    return this.produitService.setPromotion(data);
  }

  @GrpcMethod('ProduitService', 'ClearPromotion')
  async clearPromotion(data: ClearPromotionRequest) {
    return this.produitService.clearPromotion(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'Create')
  async createGrilleTarifaire(data: CreateGrilleTarifaireRequest) {
    return this.grilleService.create(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'Update')
  async updateGrilleTarifaire(data: UpdateGrilleTarifaireRequest) {
    return this.grilleService.update(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'Get')
  async getGrilleTarifaire(data: GetGrilleTarifaireRequest) {
    return this.grilleService.findById(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'GetActive')
  async getGrilleTarifaireActive(data: GetGrilleTarifaireActiveRequest) {
    return this.grilleService.findActive(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'List')
  async listGrillesTarifaires(data: ListGrillesTarifairesRequest) {
    return this.grilleService.findAll(data);
  }

  @GrpcMethod('GrilleTarifaireService', 'Delete')
  async deleteGrilleTarifaire(data: DeleteGrilleTarifaireRequest) {
    const success = await this.grilleService.delete(data);
    return { success };
  }

  @GrpcMethod('GrilleTarifaireService', 'SetParDefaut')
  async setGrilleParDefaut(data: SetGrilleParDefautRequest) {
    return this.grilleService.setParDefaut(data);
  }

  @GrpcMethod('PrixProduitService', 'Create')
  async createPrixProduit(data: CreatePrixProduitRequest) {
    return this.prixProduitService.create(data);
  }

  @GrpcMethod('PrixProduitService', 'Update')
  async updatePrixProduit(data: UpdatePrixProduitRequest) {
    return this.prixProduitService.update(data);
  }

  @GrpcMethod('PrixProduitService', 'Get')
  async getPrixProduit(data: GetPrixProduitRequest) {
    return this.prixProduitService.findById(data);
  }

  @GrpcMethod('PrixProduitService', 'GetForProduit')
  async getPrixForProduit(data: GetPrixForProduitRequest) {
    return this.prixProduitService.findForProduit(data);
  }

  @GrpcMethod('PrixProduitService', 'List')
  async listPrixProduits(data: ListPrixProduitsRequest) {
    return this.prixProduitService.findAll(data);
  }

  @GrpcMethod('PrixProduitService', 'Delete')
  async deletePrixProduit(data: DeletePrixProduitRequest) {
    const success = await this.prixProduitService.delete(data);
    return { success };
  }

  @GrpcMethod('PrixProduitService', 'BulkCreate')
  async bulkCreatePrixProduits(data: BulkCreatePrixProduitsRequest) {
    const result = await this.prixProduitService.bulkCreate(data);
    return { created: result.created, count: result.count };
  }

  @GrpcMethod('CatalogService', 'GetCatalog')
  async getCatalog(data: GetCatalogRequest) {
    return this.catalogService.getCatalog(data);
  }

  @GrpcMethod('CatalogService', 'CalculatePrice')
  async calculatePrice(data: CalculatePriceRequest) {
    return this.catalogService.calculatePrice(data);
  }

  @GrpcMethod('ProduitVersionService', 'Create')
  async createProduitVersion(data: CreateProduitVersionRequest) {
    return this.versionProduitService.create(data);
  }

  @GrpcMethod('ProduitVersionService', 'Update')
  async updateProduitVersion(data: UpdateProduitVersionRequest) {
    return this.versionProduitService.update(data);
  }

  @GrpcMethod('ProduitVersionService', 'Get')
  async getProduitVersion(data: GetProduitVersionRequest) {
    return this.versionProduitService.findById(data);
  }

  @GrpcMethod('ProduitVersionService', 'ListByProduit')
  async listProduitVersions(data: ListProduitVersionsRequest) {
    return this.versionProduitService.findByProduit(data);
  }

  @GrpcMethod('ProduitDocumentService', 'Create')
  async createProduitDocument(data: CreateProduitDocumentRequest) {
    return this.documentProduitService.create(data);
  }

  @GrpcMethod('ProduitDocumentService', 'Update')
  async updateProduitDocument(data: UpdateProduitDocumentRequest) {
    return this.documentProduitService.update(data);
  }

  @GrpcMethod('ProduitDocumentService', 'Get')
  async getProduitDocument(data: GetProduitDocumentRequest) {
    return this.documentProduitService.findById(data);
  }

  @GrpcMethod('ProduitDocumentService', 'ListByVersion')
  async listProduitDocuments(data: ListProduitDocumentsRequest) {
    return { documents: await this.documentProduitService.findByVersion(data) };
  }

  @GrpcMethod('ProduitPublicationService', 'Create')
  async createProduitPublication(data: CreateProduitPublicationRequest) {
    return this.publicationProduitService.create(data);
  }

  @GrpcMethod('ProduitPublicationService', 'Update')
  async updateProduitPublication(data: UpdateProduitPublicationRequest) {
    return this.publicationProduitService.update(data);
  }

  @GrpcMethod('ProduitPublicationService', 'Get')
  async getProduitPublication(data: GetProduitPublicationRequest) {
    return this.publicationProduitService.findById(data);
  }

  @GrpcMethod('ProduitPublicationService', 'ListByVersion')
  async listProduitPublicationsByVersion(data: ListProduitPublicationsByVersionRequest) {
    return { publications: await this.publicationProduitService.findByVersion(data) };
  }

  @GrpcMethod('ProduitPublicationService', 'ListBySociete')
  async listProduitPublicationsBySociete(data: ListProduitPublicationsBySocieteRequest) {
    return { publications: await this.publicationProduitService.findBySociete(data) };
  }
}

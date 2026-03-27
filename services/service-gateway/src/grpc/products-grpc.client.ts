import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { wrapGrpcCall } from './base-grpc.client';

interface GammeServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  GetTree(data: Record<string, unknown>): Observable<unknown>;
}

interface ProduitServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetBySku(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  SetPromotion(data: Record<string, unknown>): Observable<unknown>;
  ClearPromotion(data: Record<string, unknown>): Observable<unknown>;
  SyncCatalogue(data: Record<string, unknown>): Observable<unknown>;
}

interface ProduitVersionServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByProduit(data: Record<string, unknown>): Observable<unknown>;
}

interface ProduitDocumentServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByVersion(data: Record<string, unknown>): Observable<unknown>;
}

interface ProduitPublicationServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByVersion(data: Record<string, unknown>): Observable<unknown>;
  ListBySociete(data: Record<string, unknown>): Observable<unknown>;
}

interface GrilleTarifaireServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetActive(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  SetParDefaut(data: Record<string, unknown>): Observable<unknown>;
}

interface PrixProduitServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  GetForProduit(data: Record<string, unknown>): Observable<unknown>;
  List(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  BulkCreate(data: Record<string, unknown>): Observable<unknown>;
}

interface CatalogServiceClient {
  GetCatalog(data: Record<string, unknown>): Observable<unknown>;
  CalculatePrice(data: Record<string, unknown>): Observable<unknown>;
}

interface FormuleProduitServiceClient {
  Create(data: Record<string, unknown>): Observable<unknown>;
  Update(data: Record<string, unknown>): Observable<unknown>;
  Get(data: Record<string, unknown>): Observable<unknown>;
  ListByProduit(data: Record<string, unknown>): Observable<unknown>;
  Delete(data: Record<string, unknown>): Observable<unknown>;
  Activer(data: Record<string, unknown>): Observable<unknown>;
  Desactiver(data: Record<string, unknown>): Observable<unknown>;
}

@Injectable()
export class ProductsGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsGrpcClient.name);

  private gammeService!: GammeServiceClient;
  private produitService!: ProduitServiceClient;
  private produitVersionService!: ProduitVersionServiceClient;
  private produitDocumentService!: ProduitDocumentServiceClient;
  private produitPublicationService!: ProduitPublicationServiceClient;
  private grilleTarifaireService!: GrilleTarifaireServiceClient;
  private prixProduitService!: PrixProduitServiceClient;
  private catalogService!: CatalogServiceClient;
  private formuleProduitService!: FormuleProduitServiceClient;

  constructor(@Inject('COMMERCIAL_PACKAGE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.gammeService = this.client.getService<GammeServiceClient>('GammeService');
    this.produitService = this.client.getService<ProduitServiceClient>('ProduitService');
    this.produitVersionService = this.client.getService<ProduitVersionServiceClient>(
      'ProduitVersionService',
    );
    this.produitDocumentService = this.client.getService<ProduitDocumentServiceClient>(
      'ProduitDocumentService',
    );
    this.produitPublicationService = this.client.getService<ProduitPublicationServiceClient>(
      'ProduitPublicationService',
    );
    this.grilleTarifaireService = this.client.getService<GrilleTarifaireServiceClient>(
      'GrilleTarifaireService',
    );
    this.prixProduitService = this.client.getService<PrixProduitServiceClient>(
      'PrixProduitService',
    );
    this.catalogService = this.client.getService<CatalogServiceClient>('CatalogService');
    this.formuleProduitService = this.client.getService<FormuleProduitServiceClient>(
      'FormuleProduitService',
    );
  }

  gammeCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(this.gammeService.Create(data), this.logger, 'GammeService', 'Create');
  }

  gammeUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(this.gammeService.Update(data), this.logger, 'GammeService', 'Update');
  }

  gammeGet(data: Record<string, unknown>) {
    return wrapGrpcCall(this.gammeService.Get(data), this.logger, 'GammeService', 'Get');
  }

  gammeList(data: Record<string, unknown>) {
    return wrapGrpcCall(this.gammeService.List(data), this.logger, 'GammeService', 'List');
  }

  gammeDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(this.gammeService.Delete(data), this.logger, 'GammeService', 'Delete');
  }

  gammeGetTree(data: Record<string, unknown>) {
    return wrapGrpcCall(this.gammeService.GetTree(data), this.logger, 'GammeService', 'GetTree');
  }

  produitCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(this.produitService.Create(data), this.logger, 'ProduitService', 'Create');
  }

  produitUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(this.produitService.Update(data), this.logger, 'ProduitService', 'Update');
  }

  produitGet(data: Record<string, unknown>) {
    return wrapGrpcCall(this.produitService.Get(data), this.logger, 'ProduitService', 'Get');
  }

  produitGetBySku(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitService.GetBySku(data),
      this.logger,
      'ProduitService',
      'GetBySku',
    );
  }

  produitList(data: Record<string, unknown>) {
    return wrapGrpcCall(this.produitService.List(data), this.logger, 'ProduitService', 'List');
  }

  produitDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(this.produitService.Delete(data), this.logger, 'ProduitService', 'Delete');
  }

  produitSetPromotion(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitService.SetPromotion(data),
      this.logger,
      'ProduitService',
      'SetPromotion',
    );
  }

  produitClearPromotion(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitService.ClearPromotion(data),
      this.logger,
      'ProduitService',
      'ClearPromotion',
    );
  }

  produitSyncCatalogue(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitService.SyncCatalogue(data),
      this.logger,
      'ProduitService',
      'SyncCatalogue',
    );
  }

  produitVersionCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitVersionService.Create(data),
      this.logger,
      'ProduitVersionService',
      'Create',
    );
  }

  produitVersionUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitVersionService.Update(data),
      this.logger,
      'ProduitVersionService',
      'Update',
    );
  }

  produitVersionGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitVersionService.Get(data),
      this.logger,
      'ProduitVersionService',
      'Get',
    );
  }

  produitVersionListByProduit(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitVersionService.ListByProduit(data),
      this.logger,
      'ProduitVersionService',
      'ListByProduit',
    );
  }

  produitDocumentCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitDocumentService.Create(data),
      this.logger,
      'ProduitDocumentService',
      'Create',
    );
  }

  produitDocumentUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitDocumentService.Update(data),
      this.logger,
      'ProduitDocumentService',
      'Update',
    );
  }

  produitDocumentGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitDocumentService.Get(data),
      this.logger,
      'ProduitDocumentService',
      'Get',
    );
  }

  produitDocumentListByVersion(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitDocumentService.ListByVersion(data),
      this.logger,
      'ProduitDocumentService',
      'ListByVersion',
    );
  }

  produitPublicationCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitPublicationService.Create(data),
      this.logger,
      'ProduitPublicationService',
      'Create',
    );
  }

  produitPublicationUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitPublicationService.Update(data),
      this.logger,
      'ProduitPublicationService',
      'Update',
    );
  }

  produitPublicationGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitPublicationService.Get(data),
      this.logger,
      'ProduitPublicationService',
      'Get',
    );
  }

  produitPublicationListByVersion(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitPublicationService.ListByVersion(data),
      this.logger,
      'ProduitPublicationService',
      'ListByVersion',
    );
  }

  produitPublicationListBySociete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.produitPublicationService.ListBySociete(data),
      this.logger,
      'ProduitPublicationService',
      'ListBySociete',
    );
  }

  grilleTarifaireCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.grilleTarifaireService.Create(data),
      this.logger,
      'GrilleTarifaireService',
      'Create',
    );
  }

  grilleTarifaireUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.grilleTarifaireService.Update(data),
      this.logger,
      'GrilleTarifaireService',
      'Update',
    );
  }

  grilleTarifaireGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.grilleTarifaireService.Get(data),
      this.logger,
      'GrilleTarifaireService',
      'Get',
    );
  }

  grilleTarifaireGetActive(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.grilleTarifaireService.GetActive(data),
      this.logger,
      'GrilleTarifaireService',
      'GetActive',
    );
  }

  grilleTarifaireList(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.grilleTarifaireService.List(data),
      this.logger,
      'GrilleTarifaireService',
      'List',
    );
  }

  grilleTarifaireDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.grilleTarifaireService.Delete(data),
      this.logger,
      'GrilleTarifaireService',
      'Delete',
    );
  }

  grilleTarifaireSetParDefaut(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.grilleTarifaireService.SetParDefaut(data),
      this.logger,
      'GrilleTarifaireService',
      'SetParDefaut',
    );
  }

  prixProduitCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.prixProduitService.Create(data),
      this.logger,
      'PrixProduitService',
      'Create',
    );
  }

  prixProduitUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.prixProduitService.Update(data),
      this.logger,
      'PrixProduitService',
      'Update',
    );
  }

  prixProduitGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.prixProduitService.Get(data),
      this.logger,
      'PrixProduitService',
      'Get',
    );
  }

  prixProduitGetForProduit(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.prixProduitService.GetForProduit(data),
      this.logger,
      'PrixProduitService',
      'GetForProduit',
    );
  }

  prixProduitList(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.prixProduitService.List(data),
      this.logger,
      'PrixProduitService',
      'List',
    );
  }

  prixProduitDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.prixProduitService.Delete(data),
      this.logger,
      'PrixProduitService',
      'Delete',
    );
  }

  prixProduitBulkCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.prixProduitService.BulkCreate(data),
      this.logger,
      'PrixProduitService',
      'BulkCreate',
    );
  }

  catalogGetCatalog(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.catalogService.GetCatalog(data),
      this.logger,
      'CatalogService',
      'GetCatalog',
    );
  }

  catalogCalculatePrice(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.catalogService.CalculatePrice(data),
      this.logger,
      'CatalogService',
      'CalculatePrice',
    );
  }

  formuleProduitCreate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.formuleProduitService.Create(data),
      this.logger,
      'FormuleProduitService',
      'Create',
    );
  }

  formuleProduitUpdate(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.formuleProduitService.Update(data),
      this.logger,
      'FormuleProduitService',
      'Update',
    );
  }

  formuleProduitGet(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.formuleProduitService.Get(data),
      this.logger,
      'FormuleProduitService',
      'Get',
    );
  }

  formuleProduitListByProduit(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.formuleProduitService.ListByProduit(data),
      this.logger,
      'FormuleProduitService',
      'ListByProduit',
    );
  }

  formuleProduitDelete(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.formuleProduitService.Delete(data),
      this.logger,
      'FormuleProduitService',
      'Delete',
    );
  }

  formuleProduitActiver(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.formuleProduitService.Activer(data),
      this.logger,
      'FormuleProduitService',
      'Activer',
    );
  }

  formuleProduitDesactiver(data: Record<string, unknown>) {
    return wrapGrpcCall(
      this.formuleProduitService.Desactiver(data),
      this.logger,
      'FormuleProduitService',
      'Desactiver',
    );
  }
}

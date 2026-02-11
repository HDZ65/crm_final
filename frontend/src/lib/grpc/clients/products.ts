import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  GammeServiceService,
  ProduitServiceService,
  ProduitVersionServiceService,
  ProduitDocumentServiceService,
  ProduitPublicationServiceService,
  FormuleProduitServiceService,
  type Gamme,
  type CreateGammeRequest,
  type UpdateGammeRequest,
  type GetGammeRequest,
  type ListGammesRequest,
  type ListGammesResponse,
  type DeleteGammeRequest,
  type DeleteGammeResponse,
  type Produit,
  type CreateProduitRequest,
  type UpdateProduitRequest,
  type GetProduitRequest,
  type ListProduitsRequest,
  type ListProduitsResponse,
  type DeleteProduitRequest,
  type DeleteProduitResponse,
  type SetPromotionRequest,
  type ClearPromotionRequest,
  type SyncCatalogueRequest,
  type SyncCatalogueResponse,
  type ProduitVersion,
  type CreateProduitVersionRequest,
  type UpdateProduitVersionRequest,
  type GetProduitVersionRequest,
  type ListProduitVersionsRequest,
  type ListProduitVersionsResponse,
  type ProduitDocument,
  type CreateProduitDocumentRequest,
  type UpdateProduitDocumentRequest,
  type GetProduitDocumentRequest,
  type ListProduitDocumentsRequest,
  type ListProduitDocumentsResponse,
  type ProduitPublication,
  type CreateProduitPublicationRequest,
  type UpdateProduitPublicationRequest,
  type GetProduitPublicationRequest,
  type ListProduitPublicationsByVersionRequest,
  type ListProduitPublicationsBySocieteRequest,
  type ListProduitPublicationsResponse,
  type FormuleProduit,
  type CreateFormuleProduitRequest,
  type UpdateFormuleProduitRequest,
  type GetFormuleProduitRequest,
  type ListFormulesProduitRequest,
  type ListFormulesProduitResponse,
  type DeleteFormuleProduitRequest,
  type DeleteFormuleProduitResponse,
  type ActiverFormuleProduitRequest,
  type DesactiverFormuleProduitRequest,
} from "@proto/products/products";

let gammeInstance: GrpcClient | null = null;
let produitInstance: GrpcClient | null = null;
let produitVersionInstance: GrpcClient | null = null;
let produitDocumentInstance: GrpcClient | null = null;
let produitPublicationInstance: GrpcClient | null = null;
let formuleProduitInstance: GrpcClient | null = null;

function getGammeClient(): GrpcClient {
  if (!gammeInstance) {
    gammeInstance = makeClient(
      GammeServiceService,
      "GammeService",
      SERVICES.products,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return gammeInstance;
}

function getProduitClient(): GrpcClient {
  if (!produitInstance) {
    produitInstance = makeClient(
      ProduitServiceService,
      "ProduitService",
      SERVICES.products,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return produitInstance;
}

function getProduitVersionClient(): GrpcClient {
  if (!produitVersionInstance) {
    produitVersionInstance = makeClient(
      ProduitVersionServiceService,
      "ProduitVersionService",
      SERVICES.products,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return produitVersionInstance;
}

function getProduitDocumentClient(): GrpcClient {
  if (!produitDocumentInstance) {
    produitDocumentInstance = makeClient(
      ProduitDocumentServiceService,
      "ProduitDocumentService",
      SERVICES.products,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return produitDocumentInstance;
}

function getProduitPublicationClient(): GrpcClient {
  if (!produitPublicationInstance) {
    produitPublicationInstance = makeClient(
      ProduitPublicationServiceService,
      "ProduitPublicationService",
      SERVICES.products,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return produitPublicationInstance;
}

function getFormuleProduitClient(): GrpcClient {
  if (!formuleProduitInstance) {
    formuleProduitInstance = makeClient(
      FormuleProduitServiceService,
      "FormuleProduitService",
      SERVICES.products,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return formuleProduitInstance;
}

export const gammes = {
  create: (request: CreateGammeRequest): Promise<Gamme> =>
    promisify<CreateGammeRequest, Gamme>(getGammeClient(), "create")(request),

  get: (request: GetGammeRequest): Promise<Gamme> =>
    promisify<GetGammeRequest, Gamme>(getGammeClient(), "get")(request),

  list: (request: ListGammesRequest): Promise<ListGammesResponse> =>
    promisify<ListGammesRequest, ListGammesResponse>(
      getGammeClient(),
      "list"
    )(request),

  update: (request: UpdateGammeRequest): Promise<Gamme> =>
    promisify<UpdateGammeRequest, Gamme>(getGammeClient(), "update")(request),

  delete: (request: DeleteGammeRequest): Promise<DeleteGammeResponse> =>
    promisify<DeleteGammeRequest, DeleteGammeResponse>(
      getGammeClient(),
      "delete"
    )(request),
};

export const produits = {
  create: (request: CreateProduitRequest): Promise<Produit> =>
    promisify<CreateProduitRequest, Produit>(
      getProduitClient(),
      "create"
    )(request),

  get: (request: GetProduitRequest): Promise<Produit> =>
    promisify<GetProduitRequest, Produit>(getProduitClient(), "get")(request),

  list: (request: ListProduitsRequest): Promise<ListProduitsResponse> =>
    promisify<ListProduitsRequest, ListProduitsResponse>(
      getProduitClient(),
      "list"
    )(request),

  update: (request: UpdateProduitRequest): Promise<Produit> =>
    promisify<UpdateProduitRequest, Produit>(
      getProduitClient(),
      "update"
    )(request),

  delete: (request: DeleteProduitRequest): Promise<DeleteProduitResponse> =>
    promisify<DeleteProduitRequest, DeleteProduitResponse>(
      getProduitClient(),
      "delete"
    )(request),

  setPromotion: (request: SetPromotionRequest): Promise<Produit> =>
    promisify<SetPromotionRequest, Produit>(
      getProduitClient(),
      "setPromotion"
    )(request),

   clearPromotion: (request: ClearPromotionRequest): Promise<Produit> =>
     promisify<ClearPromotionRequest, Produit>(
       getProduitClient(),
       "clearPromotion"
     )(request),

   syncCatalogue: (request: SyncCatalogueRequest): Promise<SyncCatalogueResponse> =>
     promisify<SyncCatalogueRequest, SyncCatalogueResponse>(
       getProduitClient(),
       "syncCatalogue"
     )(request),

   createFormule: (request: CreateFormuleProduitRequest): Promise<FormuleProduit> =>
     promisify<CreateFormuleProduitRequest, FormuleProduit>(
       getFormuleProduitClient(),
       "create"
     )(request),

   updateFormule: (request: UpdateFormuleProduitRequest): Promise<FormuleProduit> =>
     promisify<UpdateFormuleProduitRequest, FormuleProduit>(
       getFormuleProduitClient(),
       "update"
     )(request),

   getFormule: (request: GetFormuleProduitRequest): Promise<FormuleProduit> =>
     promisify<GetFormuleProduitRequest, FormuleProduit>(
       getFormuleProduitClient(),
       "get"
     )(request),

   listFormulesByProduit: (request: ListFormulesProduitRequest): Promise<ListFormulesProduitResponse> =>
     promisify<ListFormulesProduitRequest, ListFormulesProduitResponse>(
       getFormuleProduitClient(),
       "listByProduit"
     )(request),

   deleteFormule: (request: DeleteFormuleProduitRequest): Promise<DeleteFormuleProduitResponse> =>
     promisify<DeleteFormuleProduitRequest, DeleteFormuleProduitResponse>(
       getFormuleProduitClient(),
       "delete"
     )(request),

   activerFormule: (request: ActiverFormuleProduitRequest): Promise<FormuleProduit> =>
     promisify<ActiverFormuleProduitRequest, FormuleProduit>(
       getFormuleProduitClient(),
       "activer"
     )(request),

   desactiverFormule: (request: DesactiverFormuleProduitRequest): Promise<FormuleProduit> =>
     promisify<DesactiverFormuleProduitRequest, FormuleProduit>(
       getFormuleProduitClient(),
       "desactiver"
     )(request),
 };

export const produitVersions = {
  create: (request: CreateProduitVersionRequest): Promise<ProduitVersion> =>
    promisify<CreateProduitVersionRequest, ProduitVersion>(
      getProduitVersionClient(),
      "create"
    )(request),

  update: (request: UpdateProduitVersionRequest): Promise<ProduitVersion> =>
    promisify<UpdateProduitVersionRequest, ProduitVersion>(
      getProduitVersionClient(),
      "update"
    )(request),

  get: (request: GetProduitVersionRequest): Promise<ProduitVersion> =>
    promisify<GetProduitVersionRequest, ProduitVersion>(
      getProduitVersionClient(),
      "get"
    )(request),

  listByProduit: (request: ListProduitVersionsRequest): Promise<ListProduitVersionsResponse> =>
    promisify<ListProduitVersionsRequest, ListProduitVersionsResponse>(
      getProduitVersionClient(),
      "listByProduit"
    )(request),
};

export const produitDocuments = {
  create: (request: CreateProduitDocumentRequest): Promise<ProduitDocument> =>
    promisify<CreateProduitDocumentRequest, ProduitDocument>(
      getProduitDocumentClient(),
      "create"
    )(request),

  update: (request: UpdateProduitDocumentRequest): Promise<ProduitDocument> =>
    promisify<UpdateProduitDocumentRequest, ProduitDocument>(
      getProduitDocumentClient(),
      "update"
    )(request),

  get: (request: GetProduitDocumentRequest): Promise<ProduitDocument> =>
    promisify<GetProduitDocumentRequest, ProduitDocument>(
      getProduitDocumentClient(),
      "get"
    )(request),

  listByVersion: (request: ListProduitDocumentsRequest): Promise<ListProduitDocumentsResponse> =>
    promisify<ListProduitDocumentsRequest, ListProduitDocumentsResponse>(
      getProduitDocumentClient(),
      "listByVersion"
    )(request),
};

export const produitPublications = {
  create: (request: CreateProduitPublicationRequest): Promise<ProduitPublication> =>
    promisify<CreateProduitPublicationRequest, ProduitPublication>(
      getProduitPublicationClient(),
      "create"
    )(request),

  update: (request: UpdateProduitPublicationRequest): Promise<ProduitPublication> =>
    promisify<UpdateProduitPublicationRequest, ProduitPublication>(
      getProduitPublicationClient(),
      "update"
    )(request),

  get: (request: GetProduitPublicationRequest): Promise<ProduitPublication> =>
    promisify<GetProduitPublicationRequest, ProduitPublication>(
      getProduitPublicationClient(),
      "get"
    )(request),

  listByVersion: (request: ListProduitPublicationsByVersionRequest): Promise<ListProduitPublicationsResponse> =>
    promisify<ListProduitPublicationsByVersionRequest, ListProduitPublicationsResponse>(
      getProduitPublicationClient(),
      "listByVersion"
    )(request),

  listBySociete: (request: ListProduitPublicationsBySocieteRequest): Promise<ListProduitPublicationsResponse> =>
    promisify<ListProduitPublicationsBySocieteRequest, ListProduitPublicationsResponse>(
      getProduitPublicationClient(),
      "listBySociete"
    )(request),
};

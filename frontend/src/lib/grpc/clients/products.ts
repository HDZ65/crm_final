import { credentials, SERVICES, promisify } from "./config";
import {
  GammeServiceClient,
  ProduitServiceClient,
  ProduitVersionServiceClient,
  ProduitDocumentServiceClient,
  ProduitPublicationServiceClient,
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
} from "@proto/products/products";

let gammeInstance: GammeServiceClient | null = null;
let produitInstance: ProduitServiceClient | null = null;
let produitVersionInstance: ProduitVersionServiceClient | null = null;
let produitDocumentInstance: ProduitDocumentServiceClient | null = null;
let produitPublicationInstance: ProduitPublicationServiceClient | null = null;

function getGammeClient(): GammeServiceClient {
  if (!gammeInstance) {
    gammeInstance = new GammeServiceClient(
      SERVICES.products,
      credentials.createInsecure()
    );
  }
  return gammeInstance;
}

function getProduitClient(): ProduitServiceClient {
  if (!produitInstance) {
    produitInstance = new ProduitServiceClient(
      SERVICES.products,
      credentials.createInsecure()
    );
  }
  return produitInstance;
}

function getProduitVersionClient(): ProduitVersionServiceClient {
  if (!produitVersionInstance) {
    produitVersionInstance = new ProduitVersionServiceClient(
      SERVICES.products,
      credentials.createInsecure()
    );
  }
  return produitVersionInstance;
}

function getProduitDocumentClient(): ProduitDocumentServiceClient {
  if (!produitDocumentInstance) {
    produitDocumentInstance = new ProduitDocumentServiceClient(
      SERVICES.products,
      credentials.createInsecure()
    );
  }
  return produitDocumentInstance;
}

function getProduitPublicationClient(): ProduitPublicationServiceClient {
  if (!produitPublicationInstance) {
    produitPublicationInstance = new ProduitPublicationServiceClient(
      SERVICES.products,
      credentials.createInsecure()
    );
  }
  return produitPublicationInstance;
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

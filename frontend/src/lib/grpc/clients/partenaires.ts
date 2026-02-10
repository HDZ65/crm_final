import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  PartenaireCommercialServiceService,
  type PartenaireCommercial,
  type PartenaireCommercialSociete,
  type CreatePartenaireCommercialRequest,
  type UpdatePartenaireCommercialRequest,
  type GetPartenaireCommercialRequest,
  type ListPartenaireCommercialRequest,
  type ListPartenaireCommercialResponse,
  type SearchPartenaireCommercialRequest,
  type ActivatePartenaireCommercialRequest,
  type DeletePartenaireCommercialRequest,
  type PartenaireCommercialSocieteRequest,
  type ListPartenairesBySocieteRequest,
  type DeleteResponse as PartenaireDeleteResponse,
} from "@proto/partenaires/partenaires";

let partenaireInstance: GrpcClient | null = null;

function getPartenaireClient(): GrpcClient {
  if (!partenaireInstance) {
    partenaireInstance = makeClient(
      PartenaireCommercialServiceService,
      "PartenaireCommercialService",
      SERVICES.partenaires,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return partenaireInstance;
}

export const partenaires = {
  create: (request: CreatePartenaireCommercialRequest): Promise<PartenaireCommercial> =>
    promisify<CreatePartenaireCommercialRequest, PartenaireCommercial>(
      getPartenaireClient(),
      "create"
    )(request),

  update: (request: UpdatePartenaireCommercialRequest): Promise<PartenaireCommercial> =>
    promisify<UpdatePartenaireCommercialRequest, PartenaireCommercial>(
      getPartenaireClient(),
      "update"
    )(request),

  get: (request: GetPartenaireCommercialRequest): Promise<PartenaireCommercial> =>
    promisify<GetPartenaireCommercialRequest, PartenaireCommercial>(
      getPartenaireClient(),
      "get"
    )(request),

  list: (request: ListPartenaireCommercialRequest): Promise<ListPartenaireCommercialResponse> =>
    promisify<ListPartenaireCommercialRequest, ListPartenaireCommercialResponse>(
      getPartenaireClient(),
      "list"
    )(request),

  search: (request: SearchPartenaireCommercialRequest): Promise<ListPartenaireCommercialResponse> =>
    promisify<SearchPartenaireCommercialRequest, ListPartenaireCommercialResponse>(
      getPartenaireClient(),
      "search"
    )(request),

  activer: (request: ActivatePartenaireCommercialRequest): Promise<PartenaireCommercial> =>
    promisify<ActivatePartenaireCommercialRequest, PartenaireCommercial>(
      getPartenaireClient(),
      "activer"
    )(request),

  desactiver: (request: ActivatePartenaireCommercialRequest): Promise<PartenaireCommercial> =>
    promisify<ActivatePartenaireCommercialRequest, PartenaireCommercial>(
      getPartenaireClient(),
      "desactiver"
    )(request),

  delete: (request: DeletePartenaireCommercialRequest): Promise<PartenaireDeleteResponse> =>
    promisify<DeletePartenaireCommercialRequest, PartenaireDeleteResponse>(
      getPartenaireClient(),
      "delete"
    )(request),

  activerPourSociete: (request: PartenaireCommercialSocieteRequest): Promise<PartenaireCommercialSociete> =>
    promisify<PartenaireCommercialSocieteRequest, PartenaireCommercialSociete>(
      getPartenaireClient(),
      "activerPourSociete"
    )(request),

  desactiverPourSociete: (request: PartenaireCommercialSocieteRequest): Promise<PartenaireCommercialSociete> =>
    promisify<PartenaireCommercialSocieteRequest, PartenaireCommercialSociete>(
      getPartenaireClient(),
      "desactiverPourSociete"
    )(request),

  listBySociete: (request: ListPartenairesBySocieteRequest): Promise<ListPartenaireCommercialResponse> =>
    promisify<ListPartenairesBySocieteRequest, ListPartenaireCommercialResponse>(
      getPartenaireClient(),
      "listBySociete"
    )(request),
};

export type {
  PartenaireCommercial,
  PartenaireCommercialSociete,
  CreatePartenaireCommercialRequest,
  UpdatePartenaireCommercialRequest,
  ListPartenaireCommercialRequest,
  ListPartenaireCommercialResponse,
  SearchPartenaireCommercialRequest,
  PartenaireCommercialSocieteRequest,
  ListPartenairesBySocieteRequest,
};

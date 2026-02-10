import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, GrpcClient } from "./config";
import {
  ApporteurServiceService,
  type Apporteur,
  type CreateApporteurRequest,
  type UpdateApporteurRequest,
  type GetApporteurRequest,
  type ListApporteurByOrganisationRequest,
  type ListApporteurResponse,
  type ActivateApporteurRequest,
  type DeleteApporteurRequest,
  type DeleteResponse as ApporteurDeleteResponse,
} from "@proto/commerciaux/commerciaux";

let apporteurInstance: GrpcClient | null = null;

function getApporteurClient(): GrpcClient {
  if (!apporteurInstance) {
    apporteurInstance = makeClient(
      ApporteurServiceService,
      "ApporteurService",
      SERVICES.commerciaux,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return apporteurInstance;
}

export const apporteurs = {
  create: (request: CreateApporteurRequest): Promise<Apporteur> =>
    promisify<CreateApporteurRequest, Apporteur>(
      getApporteurClient(),
      "create"
    )(request),

  update: (request: UpdateApporteurRequest): Promise<Apporteur> =>
    promisify<UpdateApporteurRequest, Apporteur>(
      getApporteurClient(),
      "update"
    )(request),

  get: (request: GetApporteurRequest): Promise<Apporteur> =>
    promisify<GetApporteurRequest, Apporteur>(
      getApporteurClient(),
      "get"
    )(request),

  listByOrganisation: (
    request: ListApporteurByOrganisationRequest
  ): Promise<ListApporteurResponse> =>
    promisify<ListApporteurByOrganisationRequest, ListApporteurResponse>(
      getApporteurClient(),
      "listByOrganisation"
    )(request),

  activer: (request: ActivateApporteurRequest): Promise<Apporteur> =>
    promisify<ActivateApporteurRequest, Apporteur>(
      getApporteurClient(),
      "activer"
    )(request),

  desactiver: (request: ActivateApporteurRequest): Promise<Apporteur> =>
    promisify<ActivateApporteurRequest, Apporteur>(
      getApporteurClient(),
      "desactiver"
    )(request),

  delete: (request: DeleteApporteurRequest): Promise<ApporteurDeleteResponse> =>
    promisify<DeleteApporteurRequest, ApporteurDeleteResponse>(
      getApporteurClient(),
      "delete"
    )(request),
};

export type {
  Apporteur,
  CreateApporteurRequest,
  UpdateApporteurRequest,
  ListApporteurByOrganisationRequest,
  ListApporteurResponse,
};

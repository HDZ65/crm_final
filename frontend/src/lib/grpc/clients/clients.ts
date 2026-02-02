/**
 * Client Service gRPC Client
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify } from "./config";
import {
  ClientBaseServiceClient,
  type ClientBase,
  type CreateClientBaseRequest,
  type UpdateClientBaseRequest,
  type GetClientBaseRequest,
  type ListClientsBaseRequest,
  type ListClientsBaseResponse,
  type DeleteClientBaseRequest,
  type DeleteResponse as ClientDeleteResponse,
  type SearchClientRequest,
  type SearchClientResponse,
} from "@proto/clients/clients";

let clientBaseInstance: ClientBaseServiceClient | null = null;

function getClientBaseClient(): ClientBaseServiceClient {
  if (!clientBaseInstance) {
    clientBaseInstance = new ClientBaseServiceClient(
      SERVICES.clients,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return clientBaseInstance;
}

export const clients = {
  create: (request: CreateClientBaseRequest): Promise<ClientBase> =>
    promisify<CreateClientBaseRequest, ClientBase>(
      getClientBaseClient(),
      "create"
    )(request),

  update: (request: UpdateClientBaseRequest): Promise<ClientBase> =>
    promisify<UpdateClientBaseRequest, ClientBase>(
      getClientBaseClient(),
      "update"
    )(request),

  get: (request: GetClientBaseRequest): Promise<ClientBase> =>
    promisify<GetClientBaseRequest, ClientBase>(
      getClientBaseClient(),
      "get"
    )(request),

  list: (request: ListClientsBaseRequest): Promise<ListClientsBaseResponse> =>
    promisify<ListClientsBaseRequest, ListClientsBaseResponse>(
      getClientBaseClient(),
      "list"
    )(request),

  delete: (request: DeleteClientBaseRequest): Promise<ClientDeleteResponse> =>
    promisify<DeleteClientBaseRequest, ClientDeleteResponse>(
      getClientBaseClient(),
      "delete"
    )(request),

  search: (request: SearchClientRequest): Promise<SearchClientResponse> =>
    promisify<SearchClientRequest, SearchClientResponse>(
      getClientBaseClient(),
      "search"
    )(request),
};

// Re-export types for convenience
export type {
  ClientBase,
  CreateClientBaseRequest,
  UpdateClientBaseRequest,
  ListClientsBaseRequest,
  ListClientsBaseResponse,
};

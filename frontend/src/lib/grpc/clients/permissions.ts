/**
 * Permission & RolePermission gRPC Clients
 * Proto source: organisations/users.proto
 */

import { createAuthChannelCredentials } from "@/lib/grpc/auth";
import { credentials, SERVICES, promisify, makeClient, type GrpcClient } from "./config";
import {
  PermissionServiceService,
  RolePermissionServiceService,
  type Permission,
  type CreatePermissionRequest,
  type UpdatePermissionRequest,
  type GetPermissionRequest,
  type GetPermissionByCodeRequest,
  type ListPermissionRequest,
  type ListPermissionResponse,
  type DeletePermissionRequest,
  type RolePermission,
  type CreateRolePermissionRequest,
  type GetRolePermissionRequest,
  type ListByRoleRequest,
  type ListRolePermissionResponse,
  type DeleteRolePermissionRequest,
  type DeleteResponse as PermissionDeleteResponse,
} from "@proto/organisations/users";

let permissionInstance: GrpcClient | null = null;
let rolePermissionInstance: GrpcClient | null = null;

function getPermissionClient(): GrpcClient {
  if (!permissionInstance) {
    permissionInstance = makeClient(
      PermissionServiceService,
      "PermissionService",
      SERVICES.users,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return permissionInstance;
}

function getRolePermissionClient(): GrpcClient {
  if (!rolePermissionInstance) {
    rolePermissionInstance = makeClient(
      RolePermissionServiceService,
      "RolePermissionService",
      SERVICES.users,
      createAuthChannelCredentials(credentials.createInsecure())
    );
  }
  return rolePermissionInstance;
}

export const permissions = {
  create: (request: CreatePermissionRequest): Promise<Permission> =>
    promisify<CreatePermissionRequest, Permission>(
      getPermissionClient(),
      "create"
    )(request),

  update: (request: UpdatePermissionRequest): Promise<Permission> =>
    promisify<UpdatePermissionRequest, Permission>(
      getPermissionClient(),
      "update"
    )(request),

  get: (request: GetPermissionRequest): Promise<Permission> =>
    promisify<GetPermissionRequest, Permission>(
      getPermissionClient(),
      "get"
    )(request),

  getByCode: (request: GetPermissionByCodeRequest): Promise<Permission> =>
    promisify<GetPermissionByCodeRequest, Permission>(
      getPermissionClient(),
      "getByCode"
    )(request),

  list: (request: ListPermissionRequest): Promise<ListPermissionResponse> =>
    promisify<ListPermissionRequest, ListPermissionResponse>(
      getPermissionClient(),
      "list"
    )(request),

  delete: (request: DeletePermissionRequest): Promise<PermissionDeleteResponse> =>
    promisify<DeletePermissionRequest, PermissionDeleteResponse>(
      getPermissionClient(),
      "delete"
    )(request),
};

export const rolePermissions = {
  create: (request: CreateRolePermissionRequest): Promise<RolePermission> =>
    promisify<CreateRolePermissionRequest, RolePermission>(
      getRolePermissionClient(),
      "create"
    )(request),

  get: (request: GetRolePermissionRequest): Promise<RolePermission> =>
    promisify<GetRolePermissionRequest, RolePermission>(
      getRolePermissionClient(),
      "get"
    )(request),

  listByRole: (request: ListByRoleRequest): Promise<ListRolePermissionResponse> =>
    promisify<ListByRoleRequest, ListRolePermissionResponse>(
      getRolePermissionClient(),
      "listByRole"
    )(request),

  delete: (request: DeleteRolePermissionRequest): Promise<PermissionDeleteResponse> =>
    promisify<DeleteRolePermissionRequest, PermissionDeleteResponse>(
      getRolePermissionClient(),
      "delete"
    )(request),
};

export type {
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  GetPermissionRequest,
  GetPermissionByCodeRequest,
  ListPermissionRequest,
  ListPermissionResponse,
  RolePermission,
  CreateRolePermissionRequest,
  GetRolePermissionRequest,
  ListByRoleRequest,
  ListRolePermissionResponse,
};

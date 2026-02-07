"use server";

import { permissions, rolePermissions } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/common";
import type {
  Permission,
  ListPermissionResponse,
  RolePermission,
  ListRolePermissionResponse,
} from "@proto/organisations/users";

// ============================================================================
// Permission Actions
// ============================================================================

export async function getPermission(id: string): Promise<ActionResult<Permission>> {
  try {
    const data = await permissions.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getPermission] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la permission" };
  }
}

export async function getPermissionByCode(code: string): Promise<ActionResult<Permission>> {
  try {
    const data = await permissions.getByCode({ code });
    return { data, error: null };
  } catch (err) {
    console.error("[getPermissionByCode] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la permission" };
  }
}

export async function listPermissions(): Promise<ActionResult<ListPermissionResponse>> {
  try {
    const data = await permissions.list({ pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listPermissions] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des permissions" };
  }
}

export async function createPermissionAction(input: {
  code: string;
  description: string;
}): Promise<ActionResult<Permission>> {
  try {
    const data = await permissions.create(input);
    revalidatePath("/permissions");
    revalidatePath("/settings");
    return { data, error: null };
  } catch (err) {
    console.error("[createPermission] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création de la permission" };
  }
}

export async function updatePermissionAction(input: {
  id: string;
  code: string;
  description: string;
}): Promise<ActionResult<Permission>> {
  try {
    const data = await permissions.update(input);
    revalidatePath("/permissions");
    revalidatePath("/settings");
    return { data, error: null };
  } catch (err) {
    console.error("[updatePermission] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la permission" };
  }
}

export async function deletePermissionAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await permissions.delete({ id });
    revalidatePath("/permissions");
    revalidatePath("/settings");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deletePermission] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de la permission" };
  }
}

// ============================================================================
// RolePermission Actions
// ============================================================================

export async function getRolePermission(id: string): Promise<ActionResult<RolePermission>> {
  try {
    const data = await rolePermissions.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getRolePermission] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de l'assignation permission" };
  }
}

export async function listRolePermissionsByRole(roleId: string): Promise<ActionResult<ListRolePermissionResponse>> {
  try {
    const data = await rolePermissions.listByRole({ roleId, pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listRolePermissionsByRole] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des permissions du rôle" };
  }
}

export async function createRolePermissionAction(input: {
  roleId: string;
  permissionId: string;
}): Promise<ActionResult<RolePermission>> {
  try {
    const data = await rolePermissions.create(input);
    revalidatePath("/permissions");
    revalidatePath("/settings");
    return { data, error: null };
  } catch (err) {
    console.error("[createRolePermission] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de l'assignation de la permission au rôle" };
  }
}

export async function deleteRolePermissionAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await rolePermissions.delete({ id });
    revalidatePath("/permissions");
    revalidatePath("/settings");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteRolePermission] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de l'assignation permission" };
  }
}

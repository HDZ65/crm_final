"use server";

import { activites } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  Activite,
  ListActiviteResponse,
} from "@proto/activites/activites";
import type { ActionResult } from "@/lib/types/common";

export interface ActiviteDto {
  id: string;
  typeId: string;
  dateActivite: string;
  sujet: string;
  commentaire?: string;
  echeance?: string;
  clientBaseId?: string;
  contratId?: string;
  clientPartenaireId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiviteFilters {
  search?: string;
  typeId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedActivitesDto {
  data: ActiviteDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


function mapActiviteToDto(activite: Activite): ActiviteDto {
  return {
    id: activite.id,
    typeId: activite.typeId,
    dateActivite: activite.dateActivite,
    sujet: activite.sujet,
    commentaire: activite.commentaire,
    echeance: activite.echeance,
    clientBaseId: activite.clientBaseId,
    contratId: activite.contratId,
    clientPartenaireId: activite.clientPartenaireId,
    createdAt: activite.createdAt,
    updatedAt: activite.updatedAt,
  };
}

export async function listActivites(
  filters: ActiviteFilters
): Promise<ActionResult<PaginatedActivitesDto>> {
  try {
    const data = await activites.list({
      search: filters.search || "",
      typeId: filters.typeId || "",
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        sortBy: "dateActivite",
        sortOrder: "desc",
      },
    });
    return {
      data: {
        data: data.activites.map(mapActiviteToDto),
        total: data.pagination?.total || data.activites.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listActivites] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des activités",
    };
  }
}

export async function listActivitesByClient(
  clientBaseId: string,
  filters?: Pick<ActiviteFilters, "page" | "limit">
): Promise<ActionResult<PaginatedActivitesDto>> {
  try {
    const data = await activites.listByClient({
      clientBaseId,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        sortBy: "dateActivite",
        sortOrder: "desc",
      },
    });
    return {
      data: {
        data: data.activites.map(mapActiviteToDto),
        total: data.pagination?.total || data.activites.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listActivitesByClient] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des activités du client",
    };
  }
}

export async function listActivitesByContrat(
  contratId: string,
  filters?: Pick<ActiviteFilters, "page" | "limit">
): Promise<ActionResult<PaginatedActivitesDto>> {
  try {
    const data = await activites.listByContrat({
      contratId,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        sortBy: "dateActivite",
        sortOrder: "desc",
      },
    });
    return {
      data: {
        data: data.activites.map(mapActiviteToDto),
        total: data.pagination?.total || data.activites.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listActivitesByContrat] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des activités du contrat",
    };
  }
}

export async function getActivite(
  id: string
): Promise<ActionResult<ActiviteDto>> {
  try {
    const data = await activites.get({ id });
    return { data: mapActiviteToDto(data), error: null };
  } catch (err) {
    console.error("[getActivite] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de l'activité",
    };
  }
}

export async function createActivite(input: {
  typeId: string;
  dateActivite: string;
  sujet: string;
  commentaire?: string;
  echeance?: string;
  clientBaseId?: string;
  contratId?: string;
  clientPartenaireId?: string;
}): Promise<ActionResult<ActiviteDto>> {
  try {
    const data = await activites.create({
      typeId: input.typeId,
      dateActivite: input.dateActivite,
      sujet: input.sujet,
      commentaire: input.commentaire || "",
      echeance: input.echeance || "",
      clientBaseId: input.clientBaseId || "",
      contratId: input.contratId || "",
      clientPartenaireId: input.clientPartenaireId || "",
    });
    if (input.clientBaseId) {
      revalidatePath(`/clients/${input.clientBaseId}`);
    }
    if (input.contratId) {
      revalidatePath(`/contrats/${input.contratId}`);
    }
    return { data: mapActiviteToDto(data), error: null };
  } catch (err) {
    console.error("[createActivite] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de l'activité",
    };
  }
}

export async function updateActivite(input: {
  id: string;
  typeId?: string;
  dateActivite?: string;
  sujet?: string;
  commentaire?: string;
  echeance?: string;
}): Promise<ActionResult<ActiviteDto>> {
  try {
    const data = await activites.update({
      id: input.id,
      typeId: input.typeId || "",
      dateActivite: input.dateActivite || "",
      sujet: input.sujet || "",
      commentaire: input.commentaire || "",
      echeance: input.echeance || "",
    });
    return { data: mapActiviteToDto(data), error: null };
  } catch (err) {
    console.error("[updateActivite] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de l'activité",
    };
  }
}

export async function deleteActivite(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await activites.delete({ id });
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteActivite] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de l'activité",
    };
  }
}

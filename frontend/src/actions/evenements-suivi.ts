"use server";

import { evenementsSuivi } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  EvenementSuivi,
  ListEvenementSuiviResponse,
} from "@proto/activites/activites";
import type { ActionResult } from "@/lib/types/common";

export interface EvenementSuiviDto {
  id: string;
  expeditionId: string;
  code: string;
  label: string;
  dateEvenement: string;
  lieu?: string;
  raw?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvenementSuiviFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedEvenementsSuiviDto {
  data: EvenementSuiviDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


function mapEvenementSuiviToDto(evenement: EvenementSuivi): EvenementSuiviDto {
  return {
    id: evenement.id,
    expeditionId: evenement.expeditionId,
    code: evenement.code,
    label: evenement.label,
    dateEvenement: evenement.dateEvenement,
    lieu: evenement.lieu,
    raw: evenement.raw,
    createdAt: evenement.createdAt,
    updatedAt: evenement.updatedAt,
  };
}

export async function listEvenementsSuivi(
  filters: EvenementSuiviFilters
): Promise<ActionResult<PaginatedEvenementsSuiviDto>> {
  try {
    const data = await evenementsSuivi.list({
      search: filters.search || "",
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        sortBy: "dateEvenement",
        sortOrder: "desc",
      },
    });
    return {
      data: {
        data: data.evenements.map(mapEvenementSuiviToDto),
        total: data.pagination?.total || data.evenements.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listEvenementsSuivi] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des événements de suivi",
    };
  }
}

export async function listEvenementsSuiviByExpedition(
  expeditionId: string,
  filters?: Pick<EvenementSuiviFilters, "page" | "limit">
): Promise<ActionResult<PaginatedEvenementsSuiviDto>> {
  try {
    const data = await evenementsSuivi.listByExpedition({
      expeditionId,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 50,
        sortBy: "dateEvenement",
        sortOrder: "asc",
      },
    });
    return {
      data: {
        data: data.evenements.map(mapEvenementSuiviToDto),
        total: data.pagination?.total || data.evenements.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 50,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listEvenementsSuiviByExpedition] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des événements de l'expédition",
    };
  }
}

export async function getEvenementSuivi(
  id: string
): Promise<ActionResult<EvenementSuiviDto>> {
  try {
    const data = await evenementsSuivi.get({ id });
    return { data: mapEvenementSuiviToDto(data), error: null };
  } catch (err) {
    console.error("[getEvenementSuivi] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de l'événement",
    };
  }
}

export async function createEvenementSuivi(input: {
  expeditionId: string;
  code: string;
  label: string;
  dateEvenement: string;
  lieu?: string;
  raw?: string;
}): Promise<ActionResult<EvenementSuiviDto>> {
  try {
    const data = await evenementsSuivi.create({
      expeditionId: input.expeditionId,
      code: input.code,
      label: input.label,
      dateEvenement: input.dateEvenement,
      lieu: input.lieu || "",
      raw: input.raw || "",
    });
    revalidatePath(`/expeditions/${input.expeditionId}`);
    return { data: mapEvenementSuiviToDto(data), error: null };
  } catch (err) {
    console.error("[createEvenementSuivi] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de l'événement",
    };
  }
}

export async function updateEvenementSuivi(input: {
  id: string;
  code?: string;
  label?: string;
  dateEvenement?: string;
  lieu?: string;
  raw?: string;
}): Promise<ActionResult<EvenementSuiviDto>> {
  try {
    const data = await evenementsSuivi.update({
      id: input.id,
      code: input.code || "",
      label: input.label || "",
      dateEvenement: input.dateEvenement || "",
      lieu: input.lieu || "",
      raw: input.raw || "",
    });
    return { data: mapEvenementSuiviToDto(data), error: null };
  } catch (err) {
    console.error("[updateEvenementSuivi] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour de l'événement",
    };
  }
}

export async function deleteEvenementSuivi(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await evenementsSuivi.delete({ id });
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteEvenementSuivi] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression de l'événement",
    };
  }
}

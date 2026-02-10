"use server";

import { taches } from "@/lib/grpc";
import type {
  Tache,
  TacheStats,
  CreateTacheRequest,
  UpdateTacheRequest,
  ListTacheResponse,
} from "@proto/activites/activites";
import type {
  TacheType,
  TachePriorite,
  TacheStatut,
  TacheFilters,
  PaginatedTachesDto,
} from "@/lib/ui/labels/tache";
import type { ActionResult } from "@/lib/types/common";

/**
 * Map gRPC Tache to frontend Tache
 */
function mapTacheToDto(tache: Tache): Tache {
  return {
    id: tache.id,
    organisationId: tache.organisationId,
    titre: tache.titre,
    description: tache.description,
    type: tache.type as TacheType,
    priorite: tache.priorite as TachePriorite,
    statut: tache.statut as TacheStatut,
    dateEcheance: tache.dateEcheance,
    dateCompletion: tache.dateCompletion,
    assigneA: tache.assigneA,
    creePar: tache.creePar,
    clientId: tache.clientId,
    contratId: tache.contratId,
    factureId: tache.factureId,
    regleRelanceId: tache.regleRelanceId,
    metadata: tache.metadata ? JSON.parse(tache.metadata) : undefined,
    enRetard: tache.enRetard,
    createdAt: tache.createdAt,
    updatedAt: tache.updatedAt,
  };
}

/**
 * List taches with filters and pagination
 */
export async function listTaches(
  filters: TacheFilters
): Promise<ActionResult<PaginatedTachesDto>> {
  try {
    const data = await taches.list({
      organisationId: filters.organisationId || "",
      statut: filters.statut || "",
      type: filters.type || "",
      priorite: "",
      search: filters.search || "",
      enRetard: filters.enRetard || false,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        sortBy: "",
        sortOrder: "",
      },
    });

    return {
      data: {
        data: data.taches.map(mapTacheToDto),
        total: data.pagination?.total || data.taches.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listTaches] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des taches",
    };
  }
}

/**
 * List taches by assignee with filters
 */
export async function listTachesByAssigne(
  assigneA: string,
  filters?: Omit<TacheFilters, "assigneA">
): Promise<ActionResult<PaginatedTachesDto>> {
  try {
    const data = await taches.listByAssigne({
      assigneA,
      periode: "",
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        sortBy: "",
        sortOrder: "",
      },
    });

    return {
      data: {
        data: data.taches.map(mapTacheToDto),
        total: data.pagination?.total || data.taches.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listTachesByAssigne] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des taches",
    };
  }
}

/**
 * List taches en retard
 */
export async function listTachesEnRetard(
  organisationId: string,
  filters?: Pick<TacheFilters, "page" | "limit">
): Promise<ActionResult<PaginatedTachesDto>> {
  try {
    const data = await taches.listEnRetard({
      organisationId,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        sortBy: "",
        sortOrder: "",
      },
    });

    return {
      data: {
        data: data.taches.map(mapTacheToDto),
        total: data.pagination?.total || data.taches.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listTachesEnRetard] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des taches en retard",
    };
  }
}

export async function listTachesByClient(
  clientId: string,
  filters?: Pick<TacheFilters, "page" | "limit">
): Promise<ActionResult<PaginatedTachesDto>> {
  try {
    const data = await taches.listByClient({
      clientId,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        sortBy: "dateEcheance",
        sortOrder: "asc",
      },
    });
    return {
      data: {
        data: data.taches.map(mapTacheToDto),
        total: data.pagination?.total || data.taches.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listTachesByClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des tâches du client",
    };
  }
}

export async function listTachesByContrat(
  contratId: string,
  filters?: Pick<TacheFilters, "page" | "limit">
): Promise<ActionResult<PaginatedTachesDto>> {
  try {
    const data = await taches.listByContrat({
      contratId,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        sortBy: "dateEcheance",
        sortOrder: "asc",
      },
    });
    return {
      data: {
        data: data.taches.map(mapTacheToDto),
        total: data.pagination?.total || data.taches.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listTachesByContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des tâches du contrat",
    };
  }
}

export async function listTachesByFacture(
  factureId: string,
  filters?: Pick<TacheFilters, "page" | "limit">
): Promise<ActionResult<PaginatedTachesDto>> {
  try {
    const data = await taches.listByFacture({
      factureId,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        sortBy: "dateEcheance",
        sortOrder: "asc",
      },
    });
    return {
      data: {
        data: data.taches.map(mapTacheToDto),
        total: data.pagination?.total || data.taches.length,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        totalPages: data.pagination?.totalPages || 1,
      },
      error: null,
    };
  } catch (err) {
    console.error("[listTachesByFacture] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des tâches de la facture",
    };
  }
}

export async function getTache(id: string): Promise<ActionResult<Tache>> {
  try {
    const data = await taches.get({ id });
    return { data: mapTacheToDto(data), error: null };
  } catch (err) {
    console.error("[getTache] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la tache",
    };
  }
}

/**
 * Get tache stats for an organisation
 */
export async function getTacheStats(
  organisationId: string
): Promise<ActionResult<TacheStats>> {
  try {
    const data = await taches.getStats({ organisationId });
    return {
      data: {
        aFaire: data.aFaire,
        enCours: data.enCours,
        terminee: data.terminee,
        annulee: data.annulee,
        enRetard: data.enRetard,
        total: data.total,
      },
      error: null,
    };
  } catch (err) {
    console.error("[getTacheStats] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des stats",
    };
  }
}

/**
 * Get tache alertes (overdue tasks)
 */
export async function getTacheAlertes(
  organisationId: string
): Promise<ActionResult<Tache[]>> {
  try {
    const data = await taches.getAlertes({ organisationId });
    return {
      data: data.enRetard.map(mapTacheToDto),
      error: null,
    };
  } catch (err) {
    console.error("[getTacheAlertes] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des alertes",
    };
  }
}

/**
 * Create a new tache
 */
export async function createTache(
  dto: CreateTacheRequest
): Promise<ActionResult<Tache>> {
  try {
    const data = await taches.create({
      organisationId: dto.organisationId,
      titre: dto.titre,
      description: dto.description || "",
      type: dto.type,
      priorite: dto.priorite,
      dateEcheance: dto.dateEcheance,
      assigneA: dto.assigneA,
      creePar: dto.creePar,
      clientId: dto.clientId || "",
      contratId: dto.contratId || "",
      factureId: dto.factureId || "",
      regleRelanceId: "",
      metadata: dto.metadata ? JSON.stringify(dto.metadata) : "",
    });
    return { data: mapTacheToDto(data), error: null };
  } catch (err) {
    console.error("[createTache] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la creation de la tache",
    };
  }
}

/**
 * Update a tache
 */
export async function updateTache(
  id: string,
  dto: UpdateTacheRequest
): Promise<ActionResult<Tache>> {
  try {
    const data = await taches.update({
      id,
      titre: dto.titre || "",
      description: dto.description || "",
      type: dto.type || "",
      priorite: dto.priorite || "",
      statut: dto.statut || "",
      dateEcheance: dto.dateEcheance || "",
      assigneA: dto.assigneA || "",
      clientId: dto.clientId || "",
      contratId: dto.contratId || "",
      factureId: dto.factureId || "",
      metadata: dto.metadata ? JSON.stringify(dto.metadata) : "",
    });
    return { data: mapTacheToDto(data), error: null };
  } catch (err) {
    console.error("[updateTache] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise a jour de la tache",
    };
  }
}

/**
 * Mark tache as "en cours"
 */
export async function marquerTacheEnCours(
  id: string
): Promise<ActionResult<Tache>> {
  try {
    const data = await taches.marquerEnCours({ id });
    return { data: mapTacheToDto(data), error: null };
  } catch (err) {
    console.error("[marquerTacheEnCours] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du changement de statut",
    };
  }
}

/**
 * Mark tache as "terminee"
 */
export async function marquerTacheTerminee(
  id: string
): Promise<ActionResult<Tache>> {
  try {
    const data = await taches.marquerTerminee({ id });
    return { data: mapTacheToDto(data), error: null };
  } catch (err) {
    console.error("[marquerTacheTerminee] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du changement de statut",
    };
  }
}

/**
 * Mark tache as "annulee"
 */
export async function marquerTacheAnnulee(
  id: string
): Promise<ActionResult<Tache>> {
  try {
    const data = await taches.marquerAnnulee({ id });
    return { data: mapTacheToDto(data), error: null };
  } catch (err) {
    console.error("[marquerTacheAnnulee] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du changement de statut",
    };
  }
}

/**
 * Delete a tache
 */
export async function deleteTache(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await taches.delete({ id });
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteTache] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la tache",
    };
  }
}

/**
 * List my taches (assigned to user, active only)
 * Used by site-header and taches-widget
 */
export async function listMyTaches(
  assigneA: string,
  periode?: "jour" | "semaine"
): Promise<ActionResult<Tache[]>> {
  try {
    const data = await taches.listByAssigne({
      assigneA,
      periode: periode || "",
      pagination: {
        page: 1,
        limit: 50,
        sortBy: "dateEcheance",
        sortOrder: "asc",
      },
    });

    // Filter only active tasks (A_FAIRE, EN_COURS)
    const activeTaches = data.taches
      .map(mapTacheToDto)
      .filter((t) => t.statut === "A_FAIRE" || t.statut === "EN_COURS");

    return {
      data: activeTaches,
      error: null,
    };
  } catch (err) {
    console.error("[listMyTaches] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de vos tâches",
    };
  }
}

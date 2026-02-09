"use server";

import { apporteurs } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  Apporteur,
  ListApporteurResponse,
} from "@proto/commerciaux/commerciaux";
import type { ActionResult } from "@/lib/types/common";

/**
 * Fetch liste des apporteurs par organisation via gRPC
 */
export async function getApporteursByOrganisation(
  organisationId: string
): Promise<ActionResult<ListApporteurResponse>> {
  try {
    const data = await apporteurs.listByOrganisation({
      organisationId,
      actif: false, // protobuf default = no filter (handled by backend)
      pagination: { page: 1, limit: 500, sortBy: "nom", sortOrder: "asc" },
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getApporteursByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des commerciaux",
    };
  }
}

/**
 * Fetch un apporteur par ID via gRPC
 */
export async function getApporteur(
  id: string
): Promise<ActionResult<Apporteur>> {
  try {
    const data = await apporteurs.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getApporteur] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du commercial",
    };
  }
}

/**
 * Créer un apporteur via gRPC
 */
export async function createApporteur(input: {
  organisationId: string;
  utilisateurId?: string;
  nom: string;
  prenom: string;
  typeApporteur: string;
  email?: string;
  telephone?: string;
  societeId?: string; // empty/undefined = toutes les sociétés
}): Promise<ActionResult<Apporteur>> {
  try {
    const data = await apporteurs.create({
      ...input,
      utilisateurId: input.utilisateurId || "",
      email: input.email || "",
      telephone: input.telephone || "",
      societeId: input.societeId || "", // empty = toutes les sociétés
    });
    revalidatePath("/commerciaux");
    return { data, error: null };
  } catch (err) {
    console.error("[createApporteur] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du commercial",
    };
  }
}

/**
 * Mettre à jour un apporteur via gRPC
 */
export async function updateApporteur(input: {
  id: string;
  nom?: string;
  prenom?: string;
  typeApporteur?: string;
  email?: string;
  telephone?: string;
  societeId?: string; // empty = toutes les sociétés
}): Promise<ActionResult<Apporteur>> {
  try {
    const data = await apporteurs.update({
      id: input.id,
      nom: input.nom || "",
      prenom: input.prenom || "",
      typeApporteur: input.typeApporteur || "",
      email: input.email || "",
      telephone: input.telephone || "",
      societeId: input.societeId ?? "", // empty = toutes les sociétés
    });
    revalidatePath("/commerciaux");
    return { data, error: null };
  } catch (err) {
    console.error("[updateApporteur] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du commercial",
    };
  }
}

/**
 * Activer un apporteur via gRPC
 */
export async function activerApporteur(
  id: string
): Promise<ActionResult<Apporteur>> {
  try {
    const data = await apporteurs.activer({ id });
    revalidatePath("/commerciaux");
    return { data, error: null };
  } catch (err) {
    console.error("[activerApporteur] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'activation du commercial",
    };
  }
}

/**
 * Désactiver un apporteur via gRPC
 */
export async function desactiverApporteur(
  id: string
): Promise<ActionResult<Apporteur>> {
  try {
    const data = await apporteurs.desactiver({ id });
    revalidatePath("/commerciaux");
    return { data, error: null };
  } catch (err) {
    console.error("[desactiverApporteur] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la désactivation du commercial",
    };
  }
}

/**
 * Supprimer un apporteur via gRPC
 */
export async function deleteApporteur(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await apporteurs.delete({ id });
    revalidatePath("/commerciaux");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteApporteur] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du commercial",
    };
  }
}

/**
 * List activities by partenaire (commercial/apporteur)
 * This is a thin wrapper that filters activities client-side
 */
export async function listActivitesByPartenaire(
  organisationId: string,
  partenaireId: string
): Promise<ActionResult<{ data: any[] }>> {
  try {
    // Import the activites actions
    const { listActivites } = await import("@/actions/activites");
    
    // Fetch all activities for the organization
    const result = await listActivites({ organisationId, page: 1, limit: 1000 });
    
    if (result.error || !result.data) {
      return { data: null, error: result.error || "Erreur lors du chargement des activités" };
    }
    
    // Filter by partenaireId (clientPartenaireId field)
    const filtered = result.data.data.filter(
      (a: any) => a.clientPartenaireId === partenaireId
    );
    
    return { data: { data: filtered }, error: null };
  } catch (err) {
    console.error("[listActivitesByPartenaire] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des activités",
    };
  }
}

/**
 * List tasks by partenaire (commercial/apporteur)
 * This is a thin wrapper - currently returns empty as tasks don't have partenaire relation
 */
export async function listTachesByPartenaire(
  organisationId: string,
  partenaireId: string
): Promise<ActionResult<{ data: any[] }>> {
  try {
    // For V1, return empty array as tasks don't have direct partenaire relation
    // Future: implement filtering via client relation
    return { data: { data: [] }, error: null };
  } catch (err) {
    console.error("[listTachesByPartenaire] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des tâches",
    };
  }
}

"use server";

import { apporteurs } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  Apporteur,
  ListApporteurResponse,
} from "@proto/commerciaux/commerciaux";

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetch liste des apporteurs par organisation via gRPC
 */
export async function getApporteursByOrganisation(
  organisationId: string
): Promise<ActionResult<ListApporteurResponse>> {
  try {
    const data = await apporteurs.listByOrganisation({
      organisationId,
      actif: false, // return all, filter client-side
      pagination: undefined,
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

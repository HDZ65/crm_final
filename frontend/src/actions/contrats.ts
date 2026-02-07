"use server";

import { contrats } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  Contrat,
  ListContratResponse,
} from "@proto/contrats/contrats";
import type { ActionResult } from "@/lib/types/common";

/**
 * Fetch liste des contrats par organisation via gRPC
 */
export async function getContratsByOrganisation(params: {
  organisationId: string;
  clientId?: string;
  commercialId?: string;
  societeId?: string;
  statut?: string;
  search?: string;
}): Promise<ActionResult<ListContratResponse>> {
  try {
    const data = await contrats.list({
      organisationId: params.organisationId,
      clientId: params.clientId || "",
      commercialId: params.commercialId || "",
      societeId: params.societeId || "",
      statut: params.statut || "",
      search: params.search || "",
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getContratsByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des contrats",
    };
  }
}

/**
 * Fetch un contrat par ID via gRPC
 */
export async function getContrat(
  id: string
): Promise<ActionResult<Contrat>> {
  try {
    const data = await contrats.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du contrat",
    };
  }
}

/**
 * Créer un contrat via gRPC
 */
export async function createContrat(input: {
  organisationId: string;
  reference: string;
  statut: string;
  dateDebut: string;
  clientId: string;
  commercialId: string;
  titre?: string;
  description?: string;
  type?: string;
  dateFin?: string;
  dateSignature?: string;
  montant?: number;
  devise?: string;
  frequenceFacturation?: string;
  documentUrl?: string;
  fournisseur?: string;
  societeId?: string;
  notes?: string;
}): Promise<ActionResult<Contrat>> {
  try {
    const data = await contrats.create({
      organisationId: input.organisationId,
      reference: input.reference,
      titre: input.titre || "",
      description: input.description || "",
      type: input.type || "",
      statut: input.statut,
      dateDebut: input.dateDebut,
      dateFin: input.dateFin || "",
      dateSignature: input.dateSignature || "",
      montant: input.montant ?? 0,
      devise: input.devise || "EUR",
      frequenceFacturation: input.frequenceFacturation || "",
      documentUrl: input.documentUrl || "",
      fournisseur: input.fournisseur || "",
      clientId: input.clientId,
      commercialId: input.commercialId,
      societeId: input.societeId || "",
      notes: input.notes || "",
    });
    revalidatePath("/contrats");
    return { data, error: null };
  } catch (err) {
    console.error("[createContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du contrat",
    };
  }
}

/**
 * Mettre à jour un contrat via gRPC
 */
export async function updateContrat(input: {
  id: string;
  reference?: string;
  statut?: string;
  dateDebut?: string;
  clientId?: string;
  commercialId?: string;
  titre?: string;
  description?: string;
  type?: string;
  dateFin?: string;
  dateSignature?: string;
  montant?: number;
  devise?: string;
  frequenceFacturation?: string;
  documentUrl?: string;
  fournisseur?: string;
  societeId?: string;
  notes?: string;
}): Promise<ActionResult<Contrat>> {
  try {
    const data = await contrats.update({
      id: input.id,
      reference: input.reference || "",
      titre: input.titre || "",
      description: input.description || "",
      type: input.type || "",
      statut: input.statut || "",
      dateDebut: input.dateDebut || "",
      dateFin: input.dateFin || "",
      dateSignature: input.dateSignature || "",
      montant: input.montant ?? 0,
      devise: input.devise || "",
      frequenceFacturation: input.frequenceFacturation || "",
      documentUrl: input.documentUrl || "",
      fournisseur: input.fournisseur || "",
      clientId: input.clientId || "",
      commercialId: input.commercialId || "",
      societeId: input.societeId || "",
      notes: input.notes || "",
    });
    revalidatePath("/contrats");
    return { data, error: null };
  } catch (err) {
    console.error("[updateContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du contrat",
    };
  }
}

/**
 * Supprimer un contrat via gRPC
 */
export async function deleteContrat(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await contrats.delete({ id });
    revalidatePath("/contrats");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du contrat",
    };
  }
}

/**
 * Activer un contrat via gRPC orchestration
 */
export async function activateContrat(
  contractId: string,
  payload?: Record<string, unknown>
): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const response = await contrats.activate({
      contractId,
      payload: payload ? JSON.stringify(payload) : "",
    });
    revalidatePath("/contrats");
    return {
      data: { success: response.success, message: response.message },
      error: null,
    };
  } catch (err) {
    console.error("[activateContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'activation du contrat",
    };
  }
}

/**
 * Suspendre un contrat via gRPC orchestration
 */
export async function suspendContrat(
  contractId: string,
  payload?: Record<string, unknown>
): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const response = await contrats.suspend({
      contractId,
      payload: payload ? JSON.stringify(payload) : "",
    });
    revalidatePath("/contrats");
    return {
      data: { success: response.success, message: response.message },
      error: null,
    };
  } catch (err) {
    console.error("[suspendContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suspension du contrat",
    };
  }
}

/**
 * Résilier un contrat via gRPC orchestration
 */
export async function terminateContrat(
  contractId: string,
  payload?: Record<string, unknown>
): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const response = await contrats.terminate({
      contractId,
      payload: payload ? JSON.stringify(payload) : "",
    });
    revalidatePath("/contrats");
    return {
      data: { success: response.success, message: response.message },
      error: null,
    };
  } catch (err) {
    console.error("[terminateContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la résiliation du contrat",
    };
  }
}

/**
 * Effectuer une portabilité entrante sur un contrat via gRPC orchestration
 */
export async function portInContrat(
  contractId: string,
  payload?: Record<string, unknown>
): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const response = await contrats.portIn({
      contractId,
      payload: payload ? JSON.stringify(payload) : "",
    });
    revalidatePath("/contrats");
    return {
      data: { success: response.success, message: response.message },
      error: null,
    };
  } catch (err) {
    console.error("[portInContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la portabilité entrante",
    };
  }
}

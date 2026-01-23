"use server";

import { z } from "zod";
import { clients } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import { createFormAction, formDataTransformers } from "@/lib/form-validation";
import {
  createClientSchema,
  type CreateClientFormData,
  updateClientSchema,
  type UpdateClientFormData,
} from "@/lib/schemas/clients";
import type { FormState } from "@/lib/form-state";
import type {
  ClientBase,
  ListClientsBaseResponse,
} from "@proto/clients/clients";


export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetch liste des clients par organisation via gRPC
 */
export async function getClientsByOrganisation(params: {
  organisationId: string;
  statutId?: string;
  societeId?: string;
  search?: string;
}): Promise<ActionResult<ListClientsBaseResponse>> {
  try {
    const data = await clients.list({
      organisationId: params.organisationId,
      statutId: params.statutId,
      societeId: params.societeId,
      search: params.search,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getClientsByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des clients",
    };
  }
}

/**
 * Fetch un client par ID via gRPC
 */
export async function getClient(
  id: string
): Promise<ActionResult<ClientBase>> {
  try {
    const data = await clients.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du client",
    };
  }
}

/**
 * Rechercher un client par téléphone ou nom via gRPC
 */
export async function searchClient(params: {
  organisationId: string;
  telephone?: string;
  nom?: string;
}): Promise<ActionResult<{ found: boolean; client?: ClientBase }>> {
  try {
    const data = await clients.search({
      organisationId: params.organisationId,
      telephone: params.telephone || "",
      nom: params.nom || "",
    });
    return { data, error: null };
  } catch (err) {
    console.error("[searchClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la recherche du client",
    };
  }
}

/**
 * Créer un client via gRPC
 */
export async function createClient(input: {
  organisationId: string;
  typeClient: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  compteCode?: string;
  partenaireId?: string;
  telephone: string;
  email: string;
  statut: string;
  societeId?: string;
}): Promise<ActionResult<ClientBase>> {
  try {
    const data = await clients.create({
      ...input,
      dateNaissance: input.dateNaissance || "",
      compteCode: input.compteCode || "",
      partenaireId: input.partenaireId || "",
      societeId: input.societeId || undefined,
    });
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du client",
    };
  }
}

/**
 * Mettre à jour un client via gRPC
 */
export async function updateClient(input: {
  id: string;
  typeClient?: string;
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  compteCode?: string;
  partenaireId?: string;
  telephone?: string;
  email?: string;
  statut?: string;
  societeId?: string | null;
}): Promise<ActionResult<ClientBase>> {
  try {
    const data = await clients.update({
      ...input,
      societeId: input.societeId ?? undefined,
    });
    revalidatePath("/clients");
    revalidatePath(`/clients/${input.id}`);
    return { data, error: null };
  } catch (err) {
    console.error("[updateClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du client",
    };
  }
}

/**
 * Supprimer un client via gRPC
 */
export async function deleteClient(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await clients.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du client",
    };
  }
}



// ============================================================================
// Form Actions (Next.js 15 native pattern)
// ============================================================================

/**
 * Action native pour créer un client
 */
export const createClientAction = createFormAction(
  createClientSchema,
  async (data) => {
    try {
      const client = await clients.create({
        organisationId: data.organisationId,
        typeClient: data.typeClient,
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance || "",
        telephone: data.telephone,
        email: data.email || "",
        statut: data.statutId,
        compteCode: `CLI-${Date.now().toString(36).toUpperCase()}`,
        partenaireId: data.organisationId,
        societeId: data.societeId && data.societeId !== "__none__" ? data.societeId : undefined,
      });
      revalidatePath("/clients");
      return { data: client, error: null };
    } catch (err) {
      console.error("[createClientAction] gRPC error:", err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "Erreur lors de la création du client",
      };
    }
  }
);

/**
 * Action native pour mettre à jour un client
 */
export const updateClientAction = createFormAction(
  updateClientSchema,
  async (data) => {
    try {
      const client = await clients.update({
        id: data.id,
        typeClient: data.typeClient,
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance,
        telephone: data.telephone,
        email: data.email,
        statut: data.statutId,
        societeId: data.societeId && data.societeId !== "__none__" ? data.societeId : undefined,
      });
      revalidatePath("/clients");
      revalidatePath(`/clients/${data.id}`);
      return { data: client, error: null };
    } catch (err) {
      console.error("[updateClientAction] gRPC error:", err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du client",
      };
    }
  }
);

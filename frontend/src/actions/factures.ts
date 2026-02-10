"use server";

import { factures, statutFactures } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  Facture,
  ListFacturesResponse,
} from "@proto/factures/factures";
import type {
  StatutFacture,
  ListStatutsFactureResponse,
} from "@proto/factures/factures";
import type { ActionResult } from "@/lib/types/common";

/**
 * Fetch liste des factures par organisation via gRPC
 */
export async function getFacturesByOrganisation(params: {
  organisationId: string;
  clientBaseId?: string;
  contratId?: string;
  statutId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ActionResult<ListFacturesResponse>> {
  try {
    const data = await factures.list({
      organisationId: params.organisationId,
      clientBaseId: params.clientBaseId,
      contratId: params.contratId,
      statutId: params.statutId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getFacturesByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des factures",
    };
  }
}

/**
 * Fetch une facture par ID via gRPC
 */
export async function getFacture(
  id: string
): Promise<ActionResult<Facture>> {
  try {
    const data = await factures.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getFacture] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la facture",
    };
  }
}

/**
 * Créer une facture via gRPC
 */
export async function createFacture(input: {
  organisationId: string;
  dateEmission: string;
  statutId: string;
  emissionFactureId: string;
  clientBaseId: string;
  contratId: string;
  clientPartenaireId?: string;
  adresseFacturationId?: string;
  lignes: Array<{
    produitId: string;
    quantite: number;
    prixUnitaire: number;
    description: string;
    tauxTva: number;
  }>;
}): Promise<ActionResult<Facture>> {
  try {
    const data = await factures.create({
      ...input,
      clientPartenaireId: input.clientPartenaireId || "",
      adresseFacturationId: input.adresseFacturationId || "",
    });
    revalidatePath("/facturation");
    return { data, error: null };
  } catch (err) {
    console.error("[createFacture] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de la facture",
    };
  }
}

/**
 * Mettre à jour une facture via gRPC
 */
export async function updateFacture(input: {
  id: string;
  dateEmission?: string;
  statutId?: string;
  emissionFactureId?: string;
  adresseFacturationId?: string;
}): Promise<ActionResult<Facture>> {
  try {
    const data = await factures.update(input);
    revalidatePath("/facturation");
    return { data, error: null };
  } catch (err) {
    console.error("[updateFacture] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la facture",
    };
  }
}

/**
 * Supprimer une facture via gRPC
 */
export async function deleteFacture(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const result = await factures.delete({ id });
    revalidatePath("/facturation");
    return { data: { success: result.success }, error: null };
  } catch (err) {
    console.error("[deleteFacture] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la facture",
    };
  }
}

/**
 * Valider une facture via gRPC
 */
export async function validateFacture(
  id: string
): Promise<ActionResult<{ valid: boolean; errors: string[] }>> {
  try {
    const result = await factures.validate({ id });
    return { data: { valid: result.valid, errors: result.errors }, error: null };
  } catch (err) {
    console.error("[validateFacture] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la validation de la facture",
    };
  }
}

/**
 * Finaliser une facture via gRPC
 */
export async function finalizeFacture(
  id: string
): Promise<ActionResult<Facture>> {
  try {
    const data = await factures.finalize({ id });
    revalidatePath("/facturation");
    return { data, error: null };
  } catch (err) {
    console.error("[finalizeFacture] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la finalisation de la facture",
    };
  }
}

/**
 * Fetch liste des statuts facture via gRPC
 */
export async function getStatutFactures(): Promise<ActionResult<ListStatutsFactureResponse>> {
  try {
    const data = await statutFactures.list({
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getStatutFactures] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des statuts",
    };
  }
}

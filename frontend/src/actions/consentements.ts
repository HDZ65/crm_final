"use server";

import { depanssurClient } from "@/lib/grpc";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/common";
import type {
  ConsentementRGPD,
  ListConsentementsResponse,
  TypeConsentement,
} from "@proto/depanssur/depanssur";

/**
 * Créer un consentement RGPD via gRPC
 */
export async function createConsentement(input: {
  clientBaseId: string;
  type: "RGPD_EMAIL" | "RGPD_SMS" | "CGS_DEPANSSUR";
  accorde: boolean;
  dateAccord: string;
  source: string;
}): Promise<ActionResult<ConsentementRGPD>> {
  try {
    const data = await depanssurClient.createConsentement({
      clientId: input.clientBaseId,
      type: mapTypeToProto(input.type),
      accorde: input.accorde,
      dateAccord: input.dateAccord,
      source: input.source,
    });
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createConsentement] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du consentement",
    };
  }
}

/**
 * Récupérer un consentement par ID via gRPC
 */
export async function getConsentement(
  id: string
): Promise<ActionResult<ConsentementRGPD>> {
  try {
    const data = await depanssurClient.getConsentement({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getConsentement] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du consentement",
    };
  }
}

/**
 * Lister les consentements d'un client via gRPC
 */
export async function listConsentementsByClient(
  clientBaseId: string,
  type?: "RGPD_EMAIL" | "RGPD_SMS" | "CGS_DEPANSSUR"
): Promise<ActionResult<ListConsentementsResponse>> {
  try {
    const data = await depanssurClient.listConsentements({
      clientId: clientBaseId,
      type: type ? mapTypeToProto(type) : undefined,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listConsentementsByClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des consentements",
    };
  }
}

/**
 * Mettre à jour un consentement via gRPC
 */
export async function updateConsentement(input: {
  id: string;
  accorde?: boolean;
  dateRetrait?: string;
  source?: string;
}): Promise<ActionResult<ConsentementRGPD>> {
  try {
    const data = await depanssurClient.updateConsentement({
      id: input.id,
      accorde: input.accorde,
      dateRetrait: input.dateRetrait,
      source: input.source,
    });
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updateConsentement] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du consentement",
    };
  }
}

/**
 * Supprimer un consentement via gRPC
 */
export async function deleteConsentement(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const result = await depanssurClient.deleteConsentement({ id });
    revalidatePath("/clients");
    return { data: result, error: null };
  } catch (err) {
    console.error("[deleteConsentement] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du consentement",
    };
  }
}

/**
 * Helper: Map TypeConsentement string to proto enum number
 * Proto enum: 0=UNSPECIFIED, 1=RGPD_EMAIL, 2=RGPD_SMS, 3=CGS_DEPANSSUR
 */
function mapTypeToProto(type: "RGPD_EMAIL" | "RGPD_SMS" | "CGS_DEPANSSUR"): TypeConsentement {
  const typeMap: Record<string, TypeConsentement> = {
    RGPD_EMAIL: 1 as TypeConsentement,
    RGPD_SMS: 2 as TypeConsentement,
    CGS_DEPANSSUR: 3 as TypeConsentement,
  };
  return typeMap[type] || (0 as TypeConsentement);
}

"use server";

import { partenaires } from "@/lib/grpc/clients/partenaires";
import { revalidatePath } from "next/cache";
import type {
  PartenaireCommercial,
  PartenaireCommercialSociete,
  ListPartenaireCommercialResponse,
} from "@proto/partenaires/partenaires";
import type { ActionResult } from "@/lib/types/common";

/**
 * Fetch liste des partenaires commerciaux par organisation via gRPC
 */
export async function getPartenairesByOrganisation(
  organisationId: string,
  filters?: { type?: string; statut?: string }
): Promise<ActionResult<ListPartenaireCommercialResponse>> {
  try {
    const data = await partenaires.list({
      organisationId,
      type: filters?.type || "",
      statut: filters?.statut || "",
      actifOnly: false,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getPartenairesByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des partenaires",
    };
  }
}

/**
 * Fetch un partenaire commercial par ID via gRPC
 */
export async function getPartenaire(
  id: string
): Promise<ActionResult<PartenaireCommercial>> {
  try {
    const data = await partenaires.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getPartenaire] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du partenaire",
    };
  }
}

/**
 * Rechercher des partenaires commerciaux via gRPC
 */
export async function searchPartenaires(input: {
  organisationId: string;
  search: string;
  type?: string;
  statut?: string;
}): Promise<ActionResult<ListPartenaireCommercialResponse>> {
  try {
    const data = await partenaires.search({
      organisationId: input.organisationId,
      search: input.search,
      type: input.type || "",
      statut: input.statut || "",
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[searchPartenaires] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la recherche des partenaires",
    };
  }
}

/**
 * Creer un partenaire commercial via gRPC
 */
export async function createPartenaire(input: {
  organisationId: string;
  denomination: string;
  type: string;
  siren?: string;
  siret?: string;
  numeroTva?: string;
  adresses?: string;
  iban?: string;
  bic?: string;
  codeExtranet?: string;
  apiBaseUrl?: string;
  apiCredentials?: string;
  slaDelaiTraitementHeures?: number;
  slaTauxDisponibilite?: number;
  slaContactUrgence?: string;
  contacts?: string;
  statut?: string;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  notes?: string;
  metadata?: string;
  createdBy?: string;
}): Promise<ActionResult<PartenaireCommercial>> {
  try {
    const data = await partenaires.create({
      organisationId: input.organisationId,
      denomination: input.denomination,
      type: input.type,
      siren: input.siren || "",
      siret: input.siret || "",
      numeroTva: input.numeroTva || "",
      adresses: input.adresses || "",
      iban: input.iban || "",
      bic: input.bic || "",
      codeExtranet: input.codeExtranet || "",
      apiBaseUrl: input.apiBaseUrl || "",
      apiCredentials: input.apiCredentials || "",
      slaDelaiTraitementHeures: input.slaDelaiTraitementHeures || 0,
      slaTauxDisponibilite: input.slaTauxDisponibilite || 0,
      slaContactUrgence: input.slaContactUrgence || "",
      contacts: input.contacts || "",
      statut: input.statut || "PROSPECT",
      dateDebutContrat: input.dateDebutContrat || "",
      dateFinContrat: input.dateFinContrat || "",
      notes: input.notes || "",
      metadata: input.metadata || "",
      createdBy: input.createdBy || "",
    });
    revalidatePath("/partenaires");
    return { data, error: null };
  } catch (err) {
    console.error("[createPartenaire] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la creation du partenaire",
    };
  }
}

/**
 * Mettre a jour un partenaire commercial via gRPC
 */
export async function updatePartenaire(input: {
  id: string;
  denomination?: string;
  type?: string;
  siren?: string;
  siret?: string;
  numeroTva?: string;
  adresses?: string;
  iban?: string;
  bic?: string;
  codeExtranet?: string;
  apiBaseUrl?: string;
  apiCredentials?: string;
  slaDelaiTraitementHeures?: number;
  slaTauxDisponibilite?: number;
  slaContactUrgence?: string;
  contacts?: string;
  statut?: string;
  dateDebutContrat?: string;
  dateFinContrat?: string;
  notes?: string;
  metadata?: string;
  modifiedBy?: string;
}): Promise<ActionResult<PartenaireCommercial>> {
  try {
    const data = await partenaires.update({
      id: input.id,
      denomination: input.denomination || "",
      type: input.type || "",
      siren: input.siren || "",
      siret: input.siret || "",
      numeroTva: input.numeroTva || "",
      adresses: input.adresses || "",
      iban: input.iban || "",
      bic: input.bic || "",
      codeExtranet: input.codeExtranet || "",
      apiBaseUrl: input.apiBaseUrl || "",
      apiCredentials: input.apiCredentials || "",
      slaDelaiTraitementHeures: input.slaDelaiTraitementHeures || 0,
      slaTauxDisponibilite: input.slaTauxDisponibilite || 0,
      slaContactUrgence: input.slaContactUrgence || "",
      contacts: input.contacts || "",
      statut: input.statut || "",
      dateDebutContrat: input.dateDebutContrat || "",
      dateFinContrat: input.dateFinContrat || "",
      notes: input.notes || "",
      metadata: input.metadata || "",
      modifiedBy: input.modifiedBy || "",
    });
    revalidatePath("/partenaires");
    return { data, error: null };
  } catch (err) {
    console.error("[updatePartenaire] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise a jour du partenaire",
    };
  }
}

/**
 * Activer un partenaire commercial via gRPC
 */
export async function activerPartenaire(
  id: string
): Promise<ActionResult<PartenaireCommercial>> {
  try {
    const data = await partenaires.activer({ id });
    revalidatePath("/partenaires");
    return { data, error: null };
  } catch (err) {
    console.error("[activerPartenaire] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'activation du partenaire",
    };
  }
}

/**
 * Desactiver un partenaire commercial via gRPC
 */
export async function desactiverPartenaire(
  id: string
): Promise<ActionResult<PartenaireCommercial>> {
  try {
    const data = await partenaires.desactiver({ id });
    revalidatePath("/partenaires");
    return { data, error: null };
  } catch (err) {
    console.error("[desactiverPartenaire] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la desactivation du partenaire",
    };
  }
}

/**
 * Supprimer un partenaire commercial via gRPC
 */
export async function deletePartenaire(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await partenaires.delete({ id });
    revalidatePath("/partenaires");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deletePartenaire] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du partenaire",
    };
  }
}

/**
 * Activer un partenaire pour une societe via gRPC
 */
export async function activerPartenairePourSociete(
  partenaireId: string,
  societeId: string
): Promise<ActionResult<PartenaireCommercialSociete>> {
  try {
    const data = await partenaires.activerPourSociete({ partenaireId, societeId });
    revalidatePath("/partenaires");
    return { data, error: null };
  } catch (err) {
    console.error("[activerPartenairePourSociete] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'activation pour la societe",
    };
  }
}

/**
 * Desactiver un partenaire pour une societe via gRPC
 */
export async function desactiverPartenairePourSociete(
  partenaireId: string,
  societeId: string
): Promise<ActionResult<PartenaireCommercialSociete>> {
  try {
    const data = await partenaires.desactiverPourSociete({ partenaireId, societeId });
    revalidatePath("/partenaires");
    return { data, error: null };
  } catch (err) {
    console.error("[desactiverPartenairePourSociete] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la desactivation pour la societe",
    };
  }
}

/**
 * Lister les partenaires pour une societe via gRPC
 */
export async function getPartenairesBySociete(
  societeId: string,
  actifOnly: boolean = false
): Promise<ActionResult<ListPartenaireCommercialResponse>> {
  try {
    const data = await partenaires.listBySociete({
      societeId,
      actifOnly,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getPartenairesBySociete] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des partenaires par societe",
    };
  }
}

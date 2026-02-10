"use server";

import { partenairesMarqueBlanche, themesMarque, statutsPartenaire } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/common";
import type {
  PartenaireMarqueBlanche,
  ListPartenaireResponse,
  ThemeMarque,
  ListThemeMarqueResponse,
  StatutPartenaire,
  ListStatutPartenaireResponse,
} from "@proto/organisations/organisations";

// ============================================================================
// PartenaireMarqueBlanche Actions
// ============================================================================

export async function getPartenaireMarqueBlanche(
  id: string
): Promise<ActionResult<PartenaireMarqueBlanche>> {
  try {
    const data = await partenairesMarqueBlanche.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getPartenaireMarqueBlanche] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du partenaire marque blanche" };
  }
}

export async function listPartenairesMarqueBlanche(params?: {
  search?: string;
  statutId?: string;
}): Promise<ActionResult<ListPartenaireResponse>> {
  try {
    const data = await partenairesMarqueBlanche.list({
      search: params?.search || "",
      statutId: params?.statutId || "",
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listPartenairesMarqueBlanche] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des partenaires marque blanche" };
  }
}

export async function createPartenaireMarqueBlancheAction(input: {
  denomination: string;
  siren: string;
  numeroTva: string;
  contactSupportEmail: string;
  telephone: string;
  statutId: string;
}): Promise<ActionResult<PartenaireMarqueBlanche>> {
  try {
    const data = await partenairesMarqueBlanche.create(input);
    revalidatePath("/marque-blanche");
    revalidatePath("/settings");
    return { data, error: null };
  } catch (err) {
    console.error("[createPartenaireMarqueBlanche] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du partenaire marque blanche" };
  }
}

export async function updatePartenaireMarqueBlancheAction(input: {
  id: string;
  denomination?: string;
  siren?: string;
  numeroTva?: string;
  contactSupportEmail?: string;
  telephone?: string;
  statutId?: string;
}): Promise<ActionResult<PartenaireMarqueBlanche>> {
  try {
    const data = await partenairesMarqueBlanche.update({
      id: input.id,
      denomination: input.denomination || "",
      siren: input.siren || "",
      numeroTva: input.numeroTva || "",
      contactSupportEmail: input.contactSupportEmail || "",
      telephone: input.telephone || "",
      statutId: input.statutId || "",
    });
    revalidatePath("/marque-blanche");
    revalidatePath("/settings");
    return { data, error: null };
  } catch (err) {
    console.error("[updatePartenaireMarqueBlanche] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du partenaire marque blanche" };
  }
}

export async function deletePartenaireMarqueBlancheAction(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await partenairesMarqueBlanche.delete({ id });
    revalidatePath("/marque-blanche");
    revalidatePath("/settings");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deletePartenaireMarqueBlanche] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du partenaire marque blanche" };
  }
}

// ============================================================================
// ThemeMarque Actions
// ============================================================================

export async function getThemeMarque(id: string): Promise<ActionResult<ThemeMarque>> {
  try {
    const data = await themesMarque.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getThemeMarque] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du thème marque" };
  }
}

export async function listThemesMarque(): Promise<ActionResult<ListThemeMarqueResponse>> {
  try {
    const data = await themesMarque.list({ pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listThemesMarque] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des thèmes marque" };
  }
}

export async function createThemeMarqueAction(input: {
  logoUrl: string;
  couleurPrimaire: string;
  couleurSecondaire: string;
  faviconUrl: string;
}): Promise<ActionResult<ThemeMarque>> {
  try {
    const data = await themesMarque.create(input);
    revalidatePath("/marque-blanche");
    revalidatePath("/settings");
    return { data, error: null };
  } catch (err) {
    console.error("[createThemeMarque] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du thème marque" };
  }
}

export async function updateThemeMarqueAction(input: {
  id: string;
  logoUrl?: string;
  couleurPrimaire?: string;
  couleurSecondaire?: string;
  faviconUrl?: string;
}): Promise<ActionResult<ThemeMarque>> {
  try {
    const data = await themesMarque.update({
      id: input.id,
      logoUrl: input.logoUrl || "",
      couleurPrimaire: input.couleurPrimaire || "",
      couleurSecondaire: input.couleurSecondaire || "",
      faviconUrl: input.faviconUrl || "",
    });
    revalidatePath("/marque-blanche");
    revalidatePath("/settings");
    return { data, error: null };
  } catch (err) {
    console.error("[updateThemeMarque] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du thème marque" };
  }
}

export async function deleteThemeMarqueAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await themesMarque.delete({ id });
    revalidatePath("/marque-blanche");
    revalidatePath("/settings");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteThemeMarque] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du thème marque" };
  }
}

// ============================================================================
// StatutPartenaire Actions
// ============================================================================

export async function getStatutPartenaire(id: string): Promise<ActionResult<StatutPartenaire>> {
  try {
    const data = await statutsPartenaire.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getStatutPartenaire] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du statut partenaire" };
  }
}

export async function getStatutPartenaireByCode(code: string): Promise<ActionResult<StatutPartenaire>> {
  try {
    const data = await statutsPartenaire.getByCode({ code });
    return { data, error: null };
  } catch (err) {
    console.error("[getStatutPartenaireByCode] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du statut partenaire" };
  }
}

export async function listStatutsPartenaire(): Promise<ActionResult<ListStatutPartenaireResponse>> {
  try {
    const data = await statutsPartenaire.list({ pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listStatutsPartenaire] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des statuts partenaire" };
  }
}

export async function createStatutPartenaireAction(input: {
  code: string;
  nom: string;
  description: string;
}): Promise<ActionResult<StatutPartenaire>> {
  try {
    const data = await statutsPartenaire.create(input);
    revalidatePath("/marque-blanche");
    revalidatePath("/settings");
    return { data, error: null };
  } catch (err) {
    console.error("[createStatutPartenaire] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du statut partenaire" };
  }
}

export async function updateStatutPartenaireAction(input: {
  id: string;
  code?: string;
  nom?: string;
  description?: string;
}): Promise<ActionResult<StatutPartenaire>> {
  try {
    const data = await statutsPartenaire.update({
      id: input.id,
      code: input.code || "",
      nom: input.nom || "",
      description: input.description || "",
    });
    revalidatePath("/marque-blanche");
    revalidatePath("/settings");
    return { data, error: null };
  } catch (err) {
    console.error("[updateStatutPartenaire] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du statut partenaire" };
  }
}

export async function deleteStatutPartenaireAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await statutsPartenaire.delete({ id });
    revalidatePath("/marque-blanche");
    revalidatePath("/settings");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteStatutPartenaire] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du statut partenaire" };
  }
}

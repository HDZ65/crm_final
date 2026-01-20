"use server";

import { gammes, produits, societes } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type {
  Gamme,
  ListGammesResponse,
  Produit,
  ListProduitsResponse,
  CategorieProduit,
  TypeProduit,
} from "@proto-frontend/products/products";
import type {
  Societe,
  ListSocieteResponse,
} from "@proto-frontend/organisations/organisations";

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

// ============================================
// GAMMES
// ============================================

/**
 * Fetch liste des gammes par organisation
 */
export async function getGammesByOrganisation(params: {
  organisationId: string;
  actif?: boolean;
}): Promise<ActionResult<ListGammesResponse>> {
  try {
    const data = await gammes.list({
      organisationId: params.organisationId,
      actif: params.actif,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getGammesByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des gammes",
    };
  }
}

/**
 * Créer une gamme
 */
export async function createGamme(input: {
  organisationId: string;
  nom: string;
  description?: string;
  code?: string;
  icone?: string;
  ordre?: number;
}): Promise<ActionResult<Gamme>> {
  try {
    // Generate code from name if not provided
    const code = input.code || input.nom
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^A-Z0-9]/g, "_") // Replace non-alphanumeric with underscore
      .replace(/_+/g, "_") // Remove duplicate underscores
      .replace(/^_|_$/g, "") // Remove leading/trailing underscores
      .substring(0, 50); // Limit to 50 chars

    const data = await gammes.create({
      organisationId: input.organisationId,
      nom: input.nom,
      description: input.description || "",
      code,
      icone: input.icone || "",
      ordre: input.ordre || 0,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[createGamme] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de la gamme",
    };
  }
}

/**
 * Mettre à jour une gamme
 */
export async function updateGamme(input: {
  id: string;
  nom?: string;
  description?: string;
  code?: string;
  icone?: string;
  ordre?: number;
  actif?: boolean;
}): Promise<ActionResult<Gamme>> {
  try {
    const data = await gammes.update({
      id: input.id,
      nom: input.nom,
      description: input.description,
      code: input.code,
      icone: input.icone,
      ordre: input.ordre,
      actif: input.actif,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[updateGamme] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la gamme",
    };
  }
}

/**
 * Supprimer une gamme
 */
export async function deleteGamme(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const result = await gammes.delete({ id });
    revalidatePath("/catalogue");
    return { data: { success: result.success }, error: null };
  } catch (err) {
    console.error("[deleteGamme] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la gamme",
    };
  }
}

// ============================================
// PRODUITS
// ============================================

/**
 * Fetch liste des produits par organisation
 */
export async function getProduitsByOrganisation(params: {
  organisationId: string;
  gammeId?: string;
  actif?: boolean;
}): Promise<ActionResult<ListProduitsResponse>> {
  try {
    const data = await produits.list({
      organisationId: params.organisationId,
      gammeId: params.gammeId,
      actif: params.actif,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getProduitsByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des produits",
    };
  }
}

/**
 * Créer un produit
 */
export async function createProduit(input: {
  organisationId: string;
  gammeId: string;
  nom: string;
  sku: string;
  description?: string;
  type: TypeProduit;
  categorie: CategorieProduit;
  prix: number;
  tauxTva: number;
  devise?: string;
  imageUrl?: string;
  codeExterne?: string;
  metadata?: string;
}): Promise<ActionResult<Produit>> {
  try {
    const data = await produits.create({
      organisationId: input.organisationId,
      gammeId: input.gammeId,
      nom: input.nom,
      sku: input.sku,
      description: input.description || "",
      type: input.type,
      categorie: input.categorie,
      prix: input.prix,
      tauxTva: input.tauxTva,
      devise: input.devise || "EUR",
      imageUrl: input.imageUrl || "",
      codeExterne: input.codeExterne || "",
      metadata: input.metadata || "",
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[createProduit] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du produit",
    };
  }
}

/**
 * Mettre à jour un produit
 */
export async function updateProduit(input: {
  id: string;
  gammeId?: string;
  nom?: string;
  sku?: string;
  description?: string;
  type?: TypeProduit;
  categorie?: CategorieProduit;
  prix?: number;
  tauxTva?: number;
  devise?: string;
  actif?: boolean;
  imageUrl?: string;
  codeExterne?: string;
  metadata?: string;
}): Promise<ActionResult<Produit>> {
  try {
    const data = await produits.update({
      id: input.id,
      gammeId: input.gammeId,
      nom: input.nom,
      sku: input.sku,
      description: input.description,
      type: input.type,
      categorie: input.categorie,
      prix: input.prix,
      tauxTva: input.tauxTva,
      devise: input.devise,
      actif: input.actif,
      imageUrl: input.imageUrl,
      codeExterne: input.codeExterne,
      metadata: input.metadata,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[updateProduit] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du produit",
    };
  }
}

/**
 * Supprimer un produit
 */
export async function deleteProduit(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const result = await produits.delete({ id });
    revalidatePath("/catalogue");
    return { data: { success: result.success }, error: null };
  } catch (err) {
    console.error("[deleteProduit] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du produit",
    };
  }
}

/**
 * Activer une promotion sur un produit
 */
export async function setPromotion(input: {
  produitId: string;
  prixPromotion: number;
  dateDebut: string;
  dateFin: string;
}): Promise<ActionResult<Produit>> {
  try {
    const data = await produits.setPromotion({
      produitId: input.produitId,
      prixPromotion: input.prixPromotion,
      dateDebut: input.dateDebut,
      dateFin: input.dateFin,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[setPromotion] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'activation de la promotion",
    };
  }
}

/**
 * Désactiver une promotion sur un produit
 */
export async function clearPromotion(produitId: string): Promise<ActionResult<Produit>> {
  try {
    const data = await produits.clearPromotion({ produitId });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[clearPromotion] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la désactivation de la promotion",
    };
  }
}

// ============================================
// SOCIETES
// ============================================

/**
 * Fetch liste des sociétés par organisation
 */
export async function getSocietesByOrganisation(
  organisationId: string
): Promise<ActionResult<ListSocieteResponse>> {
  try {
    const data = await societes.listByOrganisation({
      organisationId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getSocietesByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des sociétés",
    };
  }
}

/**
 * Récupérer une société par ID
 */
export async function getSociete(id: string): Promise<ActionResult<Societe>> {
  try {
    const data = await societes.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getSociete] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la société",
    };
  }
}

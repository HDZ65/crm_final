"use server";

import { gammes, produits, societes, produitVersions, produitDocuments, produitPublications } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import { StatutCycleProduit } from "@proto/products/products";
import type {
  Gamme,
  ListGammesResponse,
  Produit,
  ListProduitsResponse,
  CategorieProduit,
  TypeProduit,
  ProduitVersion,
  ListProduitVersionsResponse,
  ProduitDocument,
  ListProduitDocumentsResponse,
  ProduitPublication,
  ListProduitPublicationsResponse,
} from "@proto/products/products";
import type {
  Societe,
  ListSocieteResponse,
} from "@proto/organisations/organisations";
import type { ActionResult } from "@/lib/types/common";

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
      pagination: undefined,
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
      pagination: undefined,
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
  statutCycle?: StatutCycleProduit;
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
      statutCycle: input.statutCycle ?? StatutCycleProduit.STATUT_CYCLE_PRODUIT_ACTIF,
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
// PRODUIT VERSIONS
// ============================================

export async function getProduitVersions(params: {
  produitId: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<ListProduitVersionsResponse>> {
  try {
    const data = await produitVersions.listByProduit({
      produitId: params.produitId,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: "version",
        sortOrder: "DESC",
      },
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getProduitVersions] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des versions",
    };
  }
}

export async function createProduitVersion(input: {
  produitId: string;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
  breakingChanges?: boolean;
}): Promise<ActionResult<ProduitVersion>> {
  try {
    const data = await produitVersions.create({
      produitId: input.produitId,
      version: input.version,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      notes: input.notes,
      breakingChanges: input.breakingChanges,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[createProduitVersion] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la creation de la version",
    };
  }
}

export async function updateProduitVersion(input: {
  id: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  notes?: string;
  breakingChanges?: boolean;
}): Promise<ActionResult<ProduitVersion>> {
  try {
    const data = await produitVersions.update({
      id: input.id,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      notes: input.notes,
      breakingChanges: input.breakingChanges,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[updateProduitVersion] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise a jour de la version",
    };
  }
}

// ============================================
// PRODUIT DOCUMENTS
// ============================================

export async function getProduitDocuments(params: {
  versionProduitId: string;
}): Promise<ActionResult<ListProduitDocumentsResponse>> {
  try {
    const data = await produitDocuments.listByVersion({
      versionProduitId: params.versionProduitId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getProduitDocuments] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des documents",
    };
  }
}

export async function createProduitDocument(input: {
  versionProduitId: string;
  type: number;
  title: string;
  fileUrl: string;
  fileHash: string;
  mandatory?: boolean;
}): Promise<ActionResult<ProduitDocument>> {
  try {
    const data = await produitDocuments.create({
      versionProduitId: input.versionProduitId,
      type: input.type,
      title: input.title,
      fileUrl: input.fileUrl,
      fileHash: input.fileHash,
      mandatory: input.mandatory,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[createProduitDocument] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la creation du document",
    };
  }
}

export async function updateProduitDocument(input: {
  id: string;
  title?: string;
  fileUrl?: string;
  fileHash?: string;
  mandatory?: boolean;
  publishedAt?: string;
}): Promise<ActionResult<ProduitDocument>> {
  try {
    const data = await produitDocuments.update({
      id: input.id,
      title: input.title,
      fileUrl: input.fileUrl,
      fileHash: input.fileHash,
      mandatory: input.mandatory,
      publishedAt: input.publishedAt,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[updateProduitDocument] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise a jour du document",
    };
  }
}

// ============================================
// PRODUIT PUBLICATIONS
// ============================================

export async function getProduitPublicationsByVersion(params: {
  versionProduitId: string;
}): Promise<ActionResult<ListProduitPublicationsResponse>> {
  try {
    const data = await produitPublications.listByVersion({
      versionProduitId: params.versionProduitId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getProduitPublicationsByVersion] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des publications",
    };
  }
}

export async function getProduitPublicationsBySociete(params: {
  societeId: string;
}): Promise<ActionResult<ListProduitPublicationsResponse>> {
  try {
    const data = await produitPublications.listBySociete({
      societeId: params.societeId,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getProduitPublicationsBySociete] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des publications",
    };
  }
}

export async function createProduitPublication(input: {
  versionProduitId: string;
  societeId: string;
  channels: string[];
  visibilite: number;
  startAt: string;
  endAt?: string;
}): Promise<ActionResult<ProduitPublication>> {
  try {
    const data = await produitPublications.create({
      versionProduitId: input.versionProduitId,
      societeId: input.societeId,
      channels: input.channels,
      visibilite: input.visibilite,
      startAt: input.startAt,
      endAt: input.endAt,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[createProduitPublication] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la creation de la publication",
    };
  }
}

export async function updateProduitPublication(input: {
  id: string;
  channels: string[];
  visibilite?: number;
  startAt?: string;
  endAt?: string;
}): Promise<ActionResult<ProduitPublication>> {
  try {
    const data = await produitPublications.update({
      id: input.id,
      channels: input.channels,
      visibilite: input.visibilite,
      startAt: input.startAt,
      endAt: input.endAt,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[updateProduitPublication] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise a jour de la publication",
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
      pagination: undefined,
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

// ============================================
// FORMULES PRODUIT
// ============================================

/**
 * Fetch liste des formules pour un produit
 */
export async function getFormulesByProduit(params: {
  produitId: string;
  actif?: boolean;
}): Promise<ActionResult<any>> {
  try {
    const data = await produits.listFormulesByProduit({
      produitId: params.produitId,
      actif: params.actif,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getFormulesByProduit] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des formules",
    };
  }
}

/**
 * Créer une formule produit
 */
export async function createFormuleProduit(input: {
  produitId: string;
  code: string;
  nom: string;
  description?: string;
  ordre?: number;
  garanties?: any[];
  options?: any[];
  franchiseMontant?: number;
  franchiseType?: number;
  prixFormule?: number;
  typeAjustementPrix?: number;
  versionProduitId?: string;
  metadata?: string;
}): Promise<ActionResult<any>> {
  try {
    const data = await produits.createFormule({
      produitId: input.produitId,
      code: input.code,
      nom: input.nom,
      description: input.description || "",
      ordre: input.ordre || 0,
      garanties: input.garanties || [],
      options: input.options || [],
      franchiseMontant: input.franchiseMontant || 0,
      franchiseType: input.franchiseType || 0,
      prixFormule: input.prixFormule || 0,
      typeAjustementPrix: input.typeAjustementPrix || 0,
      versionProduitId: input.versionProduitId || "",
      metadata: input.metadata || "",
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[createFormuleProduit] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de la formule",
    };
  }
}

/**
 * Mettre à jour une formule produit
 */
export async function updateFormuleProduit(input: {
  id: string;
  code?: string;
  nom?: string;
  description?: string;
  ordre?: number;
  garanties?: any[];
  options?: any[];
  franchiseMontant?: number;
  franchiseType?: number;
  prixFormule?: number;
  typeAjustementPrix?: number;
  actif?: boolean;
  metadata?: string;
}): Promise<ActionResult<any>> {
  try {
    const data = await produits.updateFormule({
      id: input.id,
      code: input.code,
      nom: input.nom,
      description: input.description,
      ordre: input.ordre,
      garanties: input.garanties || [],
      options: input.options || [],
      franchiseMontant: input.franchiseMontant,
      franchiseType: input.franchiseType,
      prixFormule: input.prixFormule,
      typeAjustementPrix: input.typeAjustementPrix,
      actif: input.actif,
      metadata: input.metadata,
    });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[updateFormuleProduit] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la formule",
    };
  }
}

/**
 * Supprimer une formule produit
 */
export async function deleteFormuleProduit(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const result = await produits.deleteFormule({ id });
    revalidatePath("/catalogue");
    return { data: { success: result.success }, error: null };
  } catch (err) {
    console.error("[deleteFormuleProduit] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la formule",
    };
  }
}

/**
 * Activer une formule produit
 */
export async function activerFormuleProduit(id: string): Promise<ActionResult<any>> {
  try {
    const data = await produits.activerFormule({ id });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[activerFormuleProduit] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'activation de la formule",
    };
  }
}

/**
 * Désactiver une formule produit
 */
export async function desactiverFormuleProduit(id: string): Promise<ActionResult<any>> {
  try {
    const data = await produits.desactiverFormule({ id });
    revalidatePath("/catalogue");
    return { data, error: null };
  } catch (err) {
    console.error("[desactiverFormuleProduit] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la désactivation de la formule",
    };
  }
}

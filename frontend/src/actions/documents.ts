"use server";

import { piecesJointes, boitesMail } from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types/common";
import type {
  PieceJointe,
  ListPieceJointeResponse,
  BoiteMail,
  ListBoiteMailResponse,
  TestConnectionResponse,
} from "@proto/documents/documents";

// ============================================================================
// PieceJointe Actions
// ============================================================================

export async function getPieceJointe(id: string): Promise<ActionResult<PieceJointe>> {
  try {
    const data = await piecesJointes.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getPieceJointe] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la pièce jointe" };
  }
}

export async function listPiecesJointes(params?: {
  search?: string;
  typeMime?: string;
}): Promise<ActionResult<ListPieceJointeResponse>> {
  try {
    const data = await piecesJointes.list({
      search: params?.search || "",
      typeMime: params?.typeMime || "",
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listPiecesJointes] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des pièces jointes" };
  }
}

export async function listPiecesJointesByEntite(params: {
  entiteType: string;
  entiteId: string;
}): Promise<ActionResult<ListPieceJointeResponse>> {
  try {
    const data = await piecesJointes.listByEntite({
      entiteType: params.entiteType,
      entiteId: params.entiteId,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listPiecesJointesByEntite] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des pièces jointes" };
  }
}

export async function createPieceJointeAction(input: {
  nomFichier: string;
  url: string;
  typeMime: string;
  taille: number;
  entiteType: string;
  entiteId: string;
  uploadedBy: string;
}): Promise<ActionResult<PieceJointe>> {
  try {
    const data = await piecesJointes.create(input);
    revalidatePath("/documents");
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createPieceJointe] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création de la pièce jointe" };
  }
}

export async function updatePieceJointeAction(input: {
  id: string;
  nomFichier?: string;
  url?: string;
}): Promise<ActionResult<PieceJointe>> {
  try {
    const data = await piecesJointes.update(input);
    revalidatePath("/documents");
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updatePieceJointe] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la pièce jointe" };
  }
}

export async function deletePieceJointeAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await piecesJointes.delete({ id });
    revalidatePath("/documents");
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deletePieceJointe] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de la pièce jointe" };
  }
}

// ============================================================================
// BoiteMail Actions
// ============================================================================

export async function getBoiteMail(id: string): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la boîte mail" };
  }
}

export async function getBoiteMailByUtilisateur(
  utilisateurId: string
): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.getByUtilisateur({ utilisateurId });
    return { data, error: null };
  } catch (err) {
    console.error("[getBoiteMailByUtilisateur] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la boîte mail" };
  }
}

export async function getDefaultBoiteMail(
  utilisateurId: string
): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.getDefault({ utilisateurId });
    return { data, error: null };
  } catch (err) {
    console.error("[getDefaultBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la boîte mail par défaut" };
  }
}

export async function listBoitesMail(params?: {
  search?: string;
  fournisseur?: string;
  actif?: boolean;
}): Promise<ActionResult<ListBoiteMailResponse>> {
  try {
    const data = await boitesMail.list({
      search: params?.search || "",
      fournisseur: params?.fournisseur || "",
      actif: params?.actif ?? true,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listBoitesMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des boîtes mail" };
  }
}

export async function listBoitesMailByUtilisateur(params: {
  utilisateurId: string;
  actif?: boolean;
}): Promise<ActionResult<ListBoiteMailResponse>> {
  try {
    const data = await boitesMail.listByUtilisateur({
      utilisateurId: params.utilisateurId,
      actif: params.actif ?? true,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listBoitesMailByUtilisateur] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des boîtes mail" };
  }
}

export async function createBoiteMailAction(input: {
  nom: string;
  adresseEmail: string;
  fournisseur: string;
  typeConnexion: string;
  serveurSmtp?: string;
  portSmtp?: number;
  serveurImap?: string;
  portImap?: number;
  utiliseSsl?: boolean;
  utiliseTls?: boolean;
  username?: string;
  motDePasse?: string;
  clientId?: string;
  clientSecret?: string;
  signatureHtml?: string;
  signatureTexte?: string;
  estParDefaut?: boolean;
  utilisateurId: string;
}): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.create(input);
    revalidatePath("/settings");
    revalidatePath("/email");
    return { data, error: null };
  } catch (err) {
    console.error("[createBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création de la boîte mail" };
  }
}

export async function updateBoiteMailAction(input: {
  id: string;
  nom?: string;
  serveurSmtp?: string;
  portSmtp?: number;
  serveurImap?: string;
  portImap?: number;
  utiliseSsl?: boolean;
  utiliseTls?: boolean;
  username?: string;
  motDePasse?: string;
  signatureHtml?: string;
  signatureTexte?: string;
}): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.update(input);
    revalidatePath("/settings");
    revalidatePath("/email");
    return { data, error: null };
  } catch (err) {
    console.error("[updateBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la boîte mail" };
  }
}

export async function setDefaultBoiteMailAction(input: {
  id: string;
  utilisateurId: string;
}): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.setDefault(input);
    revalidatePath("/settings");
    revalidatePath("/email");
    return { data, error: null };
  } catch (err) {
    console.error("[setDefaultBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la définition de la boîte mail par défaut" };
  }
}

export async function activerBoiteMailAction(id: string): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.activer({ id });
    revalidatePath("/settings");
    revalidatePath("/email");
    return { data, error: null };
  } catch (err) {
    console.error("[activerBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de l'activation de la boîte mail" };
  }
}

export async function desactiverBoiteMailAction(id: string): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.desactiver({ id });
    revalidatePath("/settings");
    revalidatePath("/email");
    return { data, error: null };
  } catch (err) {
    console.error("[desactiverBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la désactivation de la boîte mail" };
  }
}

export async function updateOAuthTokensAction(input: {
  id: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiration: string;
}): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.updateOAuthTokens(input);
    revalidatePath("/settings");
    return { data, error: null };
  } catch (err) {
    console.error("[updateOAuthTokens] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour des tokens OAuth" };
  }
}

export async function testBoiteMailConnectionAction(
  id: string
): Promise<ActionResult<TestConnectionResponse>> {
  try {
    const data = await boitesMail.testConnection({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[testBoiteMailConnection] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du test de connexion de la boîte mail" };
  }
}

export async function deleteBoiteMailAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await boitesMail.delete({ id });
    revalidatePath("/settings");
    revalidatePath("/email");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de la boîte mail" };
  }
}

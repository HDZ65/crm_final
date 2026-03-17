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
  DocumentAuditLog,
} from "@proto/documents/documents";
import { TypeDocument } from "@proto/documents/documents";

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
  typeDocument?: TypeDocument;
  organisationId?: string;
}): Promise<ActionResult<PieceJointe>> {
  try {
    const data = await piecesJointes.create({
      nomFichier: input.nomFichier,
      url: input.url,
      typeMime: input.typeMime,
      taille: input.taille,
      entiteType: input.entiteType,
      entiteId: input.entiteId,
      uploadedBy: input.uploadedBy,
      typeDocument: input.typeDocument ?? TypeDocument.AUTRE,
      organisationId: input.organisationId ?? "",
    });
    revalidatePath("/clients");
    revalidatePath("/documents");
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
    const data = await piecesJointes.update({
      id: input.id,
      nomFichier: input.nomFichier || "",
      url: input.url || "",
    });
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
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deletePieceJointe] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de la pièce jointe" };
  }
}

// ============================================================================
// GED (Document Management) Actions
// ============================================================================

export async function listDocumentsGED(params?: {
  search?: string;
  typeDocument?: TypeDocument;
  organisationId?: string;
}): Promise<ActionResult<ListPieceJointeResponse>> {
  try {
    const data = await piecesJointes.list({
      search: params?.search || "",
      typeMime: "",
      pagination: undefined,
    });
    // Client-side filter by typeDocument if specified (until backend supports it)
    if (params?.typeDocument !== undefined && data.pieces) {
      data.pieces = data.pieces.filter(
        (p) => p.typeDocument === params.typeDocument
      );
    }
    if (params?.organisationId && data.pieces) {
      data.pieces = data.pieces.filter(
        (p) => p.organisationId === params.organisationId
      );
    }
    return { data, error: null };
  } catch (err) {
    console.error("[listDocumentsGED] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des documents" };
  }
}

export async function getDocumentDownloadUrl(id: string): Promise<ActionResult<{ url: string }>> {
  try {
    const data = await piecesJointes.get({ id });
    return { data: { url: data.url }, error: null };
  } catch (err) {
    console.error("[getDocumentDownloadUrl] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la récupération de l'URL" };
  }
}

export async function deleteDocumentGED(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await piecesJointes.delete({ id });
    revalidatePath("/documents");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteDocumentGED] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du document" };
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
    const data = await boitesMail.create({
      nom: input.nom,
      adresseEmail: input.adresseEmail,
      fournisseur: input.fournisseur,
      typeConnexion: input.typeConnexion,
      serveurSmtp: input.serveurSmtp || "",
      portSmtp: input.portSmtp || 0,
      serveurImap: input.serveurImap || "",
      portImap: input.portImap || 0,
      utiliseSsl: input.utiliseSsl || false,
      utiliseTls: input.utiliseTls || false,
      username: input.username || "",
      motDePasse: input.motDePasse || "",
      clientId: input.clientId || "",
      clientSecret: input.clientSecret || "",
      signatureHtml: input.signatureHtml || "",
      signatureTexte: input.signatureTexte || "",
      estParDefaut: input.estParDefaut || false,
      utilisateurId: input.utilisateurId,
    });
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
    const data = await boitesMail.update({
      id: input.id,
      nom: input.nom || "",
      serveurSmtp: input.serveurSmtp || "",
      portSmtp: input.portSmtp || 0,
      serveurImap: input.serveurImap || "",
      portImap: input.portImap || 0,
      utiliseSsl: input.utiliseSsl || false,
      utiliseTls: input.utiliseTls || false,
      username: input.username || "",
      motDePasse: input.motDePasse || "",
      signatureHtml: input.signatureHtml || "",
      signatureTexte: input.signatureTexte || "",
    });
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
    return { data, error: null };
  } catch (err) {
    console.error("[setDefaultBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la définition de la boîte mail par défaut" };
  }
}

export async function activerBoiteMailAction(id: string): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.activer({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[activerBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de l'activation de la boîte mail" };
  }
}

export async function desactiverBoiteMailAction(id: string): Promise<ActionResult<BoiteMail>> {
  try {
    const data = await boitesMail.desactiver({ id });
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
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteBoiteMail] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de la boîte mail" };
  }
}

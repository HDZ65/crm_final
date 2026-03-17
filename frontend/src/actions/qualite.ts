"use server";

import type { ActionResult } from "@/lib/types/common";

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:3405";

export async function getControles(params: {
  organisationId: string;
  statut?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ controles: unknown[]; total: number }>> {
  try {
    const query = new URLSearchParams({
      organisationId: params.organisationId,
      ...(params.statut && { statut: params.statut }),
      ...(params.page && { page: String(params.page) }),
      ...(params.limit && { limit: String(params.limit) }),
    });
    const res = await fetch(`${GATEWAY_URL}/api/qualite/controles?${query}`);
    if (!res.ok) return { data: null, error: `Erreur ${res.status}` };
    const result = await res.json();
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

export async function getControle(id: string): Promise<ActionResult<unknown>> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/qualite/controles/${id}`);
    if (!res.ok) return { data: null, error: `Erreur ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

export async function validerCritere(data: {
  controleId: string;
  critereId: string;
  conforme: boolean;
  commentaire?: string;
  verifiePar: string;
}): Promise<ActionResult<unknown>> {
  try {
    const { controleId, critereId, ...body } = data;
    const res = await fetch(
      `${GATEWAY_URL}/api/qualite/controles/${controleId}/criteres/${critereId}/valider`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    if (!res.ok) return { data: null, error: `Erreur ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

export async function validerControle(
  id: string,
  validateurId: string
): Promise<ActionResult<unknown>> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/qualite/controles/${id}/valider`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ validateurId }),
    });
    if (!res.ok) return { data: null, error: `Erreur ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

export async function rejeterControle(
  id: string,
  motif: string,
  validateurId: string
): Promise<ActionResult<unknown>> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/qualite/controles/${id}/rejeter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motif, validateurId }),
    });
    if (!res.ok) return { data: null, error: `Erreur ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

export async function getCriteres(
  organisationId: string
): Promise<ActionResult<unknown[]>> {
  try {
    const res = await fetch(
      `${GATEWAY_URL}/api/qualite/criteres?organisationId=${organisationId}`
    );
    if (!res.ok) return { data: null, error: `Erreur ${res.status}` };
    const result = await res.json();
    return { data: result.criteres ?? result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

export async function getStatistiques(
  organisationId: string
): Promise<ActionResult<{
  enAttente: number;
  enCours: number;
  valide: number;
  rejete: number;
  retour: number;
  tauxValidation: number;
}>> {
  try {
    const res = await fetch(
      `${GATEWAY_URL}/api/qualite/statistiques?organisationId=${organisationId}`
    );
    if (!res.ok) return { data: null, error: `Erreur ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

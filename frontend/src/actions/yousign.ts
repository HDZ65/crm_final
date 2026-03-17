"use server";

import type { ActionResult } from "@/lib/types/common";

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:3405";

export async function createSignatureRequest(data: {
  contratId: string;
  signerName: string;
  signerEmail: string;
  documentId: string;
}): Promise<ActionResult<{ signatureRequestId: string; signerUrl: string }>> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/yousign/signature-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.text();
      return { data: null, error: err || `Erreur ${res.status}` };
    }
    const result = await res.json();
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

export async function getSignatureStatus(
  signatureRequestId: string
): Promise<ActionResult<{ id: string; status: string; signerUrl?: string }>> {
  try {
    const res = await fetch(
      `${GATEWAY_URL}/api/yousign/signature-requests/${signatureRequestId}`
    );
    if (!res.ok) {
      return { data: null, error: `Erreur ${res.status}` };
    }
    const result = await res.json();
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

export async function downloadSignedDoc(
  signatureRequestId: string,
  docId: string
): Promise<ActionResult<{ content: string; filename: string }>> {
  try {
    const res = await fetch(
      `${GATEWAY_URL}/api/yousign/signature-requests/${signatureRequestId}/documents/${docId}/download`
    );
    if (!res.ok) {
      return { data: null, error: `Erreur ${res.status}` };
    }
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const filename = `document-signe-${docId}.pdf`;
    return { data: { content: base64, filename }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Erreur réseau" };
  }
}

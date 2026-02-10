"use server";

import type { ActionResult } from "@/lib/types/common";

export interface ContratCommercialStat {
  nom: string;
  count: number;
  montant: number;
}

export interface ContratsCommercialResponse {
  commerciaux: ContratCommercialStat[];
}

/**
 * Fetch contracts statistics per sales representative
 * TODO: Replace mock data with actual gRPC call when backend is ready
 */
export async function getContratsParCommercial(
  organisationId: string
): Promise<ActionResult<ContratsCommercialResponse>> {
  try {
    // Mock data for now
    const mockData: ContratsCommercialResponse = {
      commerciaux: [
        { nom: "John Doe", count: 5, montant: 12500 },
        { nom: "Jane Smith", count: 4, montant: 9800 },
        { nom: "Marc Dupont", count: 3, montant: 7200 },
        { nom: "Sophie Martin", count: 2, montant: 4500 },
      ],
    };

    return { data: mockData, error: null };
  } catch (err) {
    console.error("[getContratsParCommercial] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des contrats par commercial",
    };
  }
}

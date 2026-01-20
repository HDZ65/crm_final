"use server";

import { credentials, type ServiceError } from "@grpc/grpc-js";

// Service endpoints configuration
const SERVICES = {
  referentiel: process.env.GRPC_REFERENTIEL_URL || "localhost:50065",
  commerciaux: process.env.GRPC_COMMERCIAUX_URL || "localhost:50053",
  contrats: process.env.GRPC_CONTRATS_URL || "localhost:50055",
  organisations: process.env.GRPC_ORGANISATIONS_URL || "localhost:50062",
} as const;

/**
 * Promisify a gRPC callback-style method
 */
function promisify<TRequest, TResponse>(
  client: unknown,
  method: string
): (request: TRequest) => Promise<TResponse> {
  return (request: TRequest): Promise<TResponse> => {
    return new Promise((resolve, reject) => {
      const fn = (client as Record<string, unknown>)[method] as (
        request: TRequest,
        callback: (error: ServiceError | null, response: TResponse) => void
      ) => void;

      fn.call(client, request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  };
}

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

// ============================================
// CONDITIONS PAIEMENT
// ============================================

import {
  ConditionPaiementServiceClient,
  type ConditionPaiement,
  type ListConditionPaiementRequest,
  type ListConditionPaiementResponse,
} from "@proto-grpc/referentiel/referentiel";

let conditionPaiementInstance: ConditionPaiementServiceClient | null = null;

function getConditionPaiementClient(): ConditionPaiementServiceClient {
  if (!conditionPaiementInstance) {
    conditionPaiementInstance = new ConditionPaiementServiceClient(
      SERVICES.referentiel,
      credentials.createInsecure()
    );
  }
  return conditionPaiementInstance;
}

export async function getConditionsPaiement(): Promise<ActionResult<ConditionPaiement[]>> {
  try {
    const response = await promisify<ListConditionPaiementRequest, ListConditionPaiementResponse>(
      getConditionPaiementClient(),
      "list"
    )({ search: "" });
    return { data: response.conditions || [], error: null };
  } catch (err) {
    console.error("[getConditionsPaiement] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des conditions de paiement",
    };
  }
}

// ============================================
// MODELES DISTRIBUTION
// ============================================

import {
  ModeleDistributionServiceClient,
  type ModeleDistribution,
  type ListModeleDistributionRequest,
  type ListModeleDistributionResponse,
} from "@proto-grpc/commerciaux/commerciaux";

let modeleDistributionInstance: ModeleDistributionServiceClient | null = null;

function getModeleDistributionClient(): ModeleDistributionServiceClient {
  if (!modeleDistributionInstance) {
    modeleDistributionInstance = new ModeleDistributionServiceClient(
      SERVICES.commerciaux,
      credentials.createInsecure()
    );
  }
  return modeleDistributionInstance;
}

export async function getModelesDistribution(): Promise<ActionResult<ModeleDistribution[]>> {
  try {
    const response = await promisify<ListModeleDistributionRequest, ListModeleDistributionResponse>(
      getModeleDistributionClient(),
      "list"
    )({ search: "" });
    return { data: response.modeles || [], error: null };
  } catch (err) {
    console.error("[getModelesDistribution] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des modèles de distribution",
    };
  }
}

// ============================================
// STATUTS CONTRAT
// ============================================

import {
  StatutContratServiceClient,
  type StatutContrat,
  type ListStatutContratRequest,
  type ListStatutContratResponse,
} from "@proto-grpc/contrats/contrats";

let statutContratInstance: StatutContratServiceClient | null = null;

function getStatutContratClient(): StatutContratServiceClient {
  if (!statutContratInstance) {
    statutContratInstance = new StatutContratServiceClient(
      SERVICES.contrats,
      credentials.createInsecure()
    );
  }
  return statutContratInstance;
}

export async function getStatutsContrat(): Promise<ActionResult<StatutContrat[]>> {
  try {
    const response = await promisify<ListStatutContratRequest, ListStatutContratResponse>(
      getStatutContratClient(),
      "list"
    )({});
    return { data: response.statuts || [], error: null };
  } catch (err) {
    console.error("[getStatutsContrat] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des statuts de contrat",
    };
  }
}

// ============================================
// PARTENAIRES MARQUE BLANCHE
// ============================================

import {
  PartenaireMarqueBlancheServiceClient,
  type PartenaireMarqueBlanche,
  type ListPartenaireRequest,
  type ListPartenaireResponse,
} from "@proto-grpc/organisations/organisations";

let partenaireInstance: PartenaireMarqueBlancheServiceClient | null = null;

function getPartenaireClient(): PartenaireMarqueBlancheServiceClient {
  if (!partenaireInstance) {
    partenaireInstance = new PartenaireMarqueBlancheServiceClient(
      SERVICES.organisations,
      credentials.createInsecure()
    );
  }
  return partenaireInstance;
}

export async function getPartenaires(_organisationId?: string): Promise<ActionResult<PartenaireMarqueBlanche[]>> {
  try {
    const response = await promisify<ListPartenaireRequest, ListPartenaireResponse>(
      getPartenaireClient(),
      "list"
    )({ search: "", statutId: "" });
    return { data: response.partenaires || [], error: null };
  } catch (err) {
    console.error("[getPartenaires] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des partenaires",
    };
  }
}

// Re-export types
export type {
  ConditionPaiement,
  ModeleDistribution,
  StatutContrat,
  PartenaireMarqueBlanche,
};

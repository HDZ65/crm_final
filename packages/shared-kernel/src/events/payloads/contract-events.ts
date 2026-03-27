/**
 * Contract Event Payloads
 *
 * Centralized interfaces for contract-related event payloads
 * used across multiple services (commercial, finance, telecom, logistics, engagement).
 *
 * @module @crm/shared-kernel/events/payloads
 */

/**
 * Invoice line payload for contract creation events.
 */
export interface LigneFacturePayload {
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
}

/**
 * Payload for contrat.created events.
 * All optional fields allow handlers to consume only what they need.
 */
export interface ContratCreatedPayload {
  correlationId: string;
  contratId: string;
  clientId: string;
  keycloakGroupId: string;
  apporteurId?: string;
  societeId?: string;
  montant?: number;
  type?: string;
  dateSignature?: string;
  fournisseur?: string;
  hasEsim?: boolean;
  conserveNumero?: boolean;
  rio?: string;
  lignesFacture?: LigneFacturePayload[];
}

/**
 * Payload for contrat.deleted events.
 */
export interface ContratDeletedPayload {
  correlationId: string;
  contratId: string;
  keycloakGroupId: string;
  reason?: string;
}

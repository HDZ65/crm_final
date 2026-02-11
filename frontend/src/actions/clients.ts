"use server";

import { z } from "zod";
import {
  clients,
  adresses,
  clientEntreprise,
  clientPartenaire,
  statutClient,
  conditionPaiement,
  emissionFacture,
  facturationPar,
  periodeFacturation,
  transporteurCompte,
} from "@/lib/grpc";
import { revalidatePath } from "next/cache";
import { createFormAction, formDataTransformers } from "@/lib/forms/validation";
import {
  createClientSchema,
  type CreateClientFormData,
  updateClientSchema,
  type UpdateClientFormData,
} from "@/lib/schemas/clients";
import type { FormState } from "@/lib/forms/state";
import type {
  ClientBase,
  ListClientsBaseResponse,
  Adresse,
  ListAdressesResponse,
  ClientEntreprise,
  ListClientsEntrepriseResponse,
  ClientPartenaire,
  ListClientsPartenaireResponse,
  StatutClient,
  ListStatutsClientResponse,
} from "@proto/clients/clients";
import type {
  ConditionPaiement,
  ListConditionPaiementResponse,
  EmissionFacture,
  ListEmissionFactureResponse,
  FacturationPar,
  ListFacturationParResponse,
  PeriodeFacturation,
  ListPeriodeFacturationResponse,
  TransporteurCompte,
  ListTransporteurCompteResponse,
} from "@proto/referentiel/referentiel";
import type { ActionResult } from "@/lib/types/common";

/**
 * Fetch liste des clients par organisation via gRPC
 */
export async function getClientsByOrganisation(params: {
  organisationId: string;
  statutId?: string;
  societeId?: string;
  search?: string;
  source?: string;
}): Promise<ActionResult<ListClientsBaseResponse>> {
  try {
    const data = await clients.list({
      organisationId: params.organisationId,
      statutId: params.statutId,
      societeId: params.societeId,
      search: params.search,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[getClientsByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des clients",
    };
  }
}

/**
 * Fetch un client par ID via gRPC
 */
export async function getClient(
  id: string
): Promise<ActionResult<ClientBase>> {
  try {
    const data = await clients.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement du client",
    };
  }
}

/**
 * Rechercher un client par téléphone ou nom via gRPC
 */
export async function searchClient(params: {
  organisationId: string;
  telephone?: string;
  nom?: string;
}): Promise<ActionResult<{ found: boolean; client?: ClientBase }>> {
  try {
    const data = await clients.search({
      organisationId: params.organisationId,
      telephone: params.telephone || "",
      nom: params.nom || "",
    });
    return { data, error: null };
  } catch (err) {
    console.error("[searchClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la recherche du client",
    };
  }
}

/**
 * Créer un client via gRPC
 */
export async function createClient(input: {
  organisationId: string;
  typeClient: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  compteCode?: string;
  partenaireId?: string;
  telephone: string;
  email: string;
  statut: string;
  societeId?: string;
}): Promise<ActionResult<ClientBase>> {
  try {
    const data = await clients.create({
      ...input,
      dateNaissance: input.dateNaissance || "",
      compteCode: input.compteCode || "",
      partenaireId: input.partenaireId || "",
      societeId: input.societeId,
    });
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création du client",
    };
  }
}

/**
 * Mettre à jour un client via gRPC
 */
export async function updateClient(input: {
  id: string;
  typeClient?: string;
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  compteCode?: string;
  partenaireId?: string;
  telephone?: string;
  email?: string;
  statut?: string;
  societeId?: string | null;
}): Promise<ActionResult<ClientBase>> {
  try {
    const data = await clients.update({
      ...input,
      societeId: input.societeId ?? undefined,
    });
    revalidatePath("/clients");
    revalidatePath(`/clients/${input.id}`);
    return { data, error: null };
  } catch (err) {
    console.error("[updateClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du client",
    };
  }
}

/**
 * Supprimer un client via gRPC
 */
export async function deleteClient(
  id: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await clients.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteClient] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du client",
    };
  }
}



// ============================================================================
// Form Actions (Next.js 15 native pattern)
// ============================================================================

/**
 * Action native pour créer un client
 */
export const createClientAction = createFormAction(
  createClientSchema,
  async (data) => {
    try {
      const client = await clients.create({
        organisationId: data.organisationId,
        typeClient: data.typeClient,
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance || "",
        telephone: data.telephone,
        email: data.email || "",
        statut: data.statutId,
        compteCode: `CLI-${Date.now().toString(36).toUpperCase()}`,
        partenaireId: data.organisationId,
        societeId: data.societeId && data.societeId !== "__none__" ? data.societeId : undefined,
      });
      revalidatePath("/clients");
      return { data: client, error: null };
    } catch (err) {
      console.error("[createClientAction] gRPC error:", err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "Erreur lors de la création du client",
      };
    }
  }
);

/**
 * Action native pour mettre à jour un client
 */
export const updateClientAction = createFormAction(
  updateClientSchema,
  async (data) => {
    try {
      const client = await clients.update({
        id: data.id,
        typeClient: data.typeClient,
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance,
        telephone: data.telephone,
        email: data.email,
        statut: data.statutId,
        societeId: data.societeId && data.societeId !== "__none__" ? data.societeId : undefined,
      });
      revalidatePath("/clients");
      revalidatePath(`/clients/${data.id}`);
      return { data: client, error: null };
    } catch (err) {
      console.error("[updateClientAction] gRPC error:", err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du client",
      };
    }
  }
);

// ============================================================================
// Sub-Entity Actions: Adresses
// ============================================================================

export async function getAdressesByClient(
  clientBaseId: string
): Promise<ActionResult<ListAdressesResponse>> {
  try {
    const data = await adresses.listByClient({ clientBaseId, pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[getAdressesByClient] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des adresses" };
  }
}

export async function getAdresse(id: string): Promise<ActionResult<Adresse>> {
  try {
    const data = await adresses.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getAdresse] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de l'adresse" };
  }
}

export async function createAdresse(input: {
  clientBaseId: string;
  ligne1: string;
  ligne2?: string;
  codePostal: string;
  ville: string;
  pays: string;
  type: string;
}): Promise<ActionResult<Adresse>> {
  try {
    const data = await adresses.create({
      clientBaseId: input.clientBaseId,
      ligne1: input.ligne1,
      ligne2: input.ligne2 || "",
      codePostal: input.codePostal,
      ville: input.ville,
      pays: input.pays,
      type: input.type,
    });
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createAdresse] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création de l'adresse" };
  }
}

export async function updateAdresse(input: {
  id: string;
  ligne1?: string;
  ligne2?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  type?: string;
}): Promise<ActionResult<Adresse>> {
  try {
    const data = await adresses.update(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updateAdresse] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de l'adresse" };
  }
}

export async function deleteAdresse(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await adresses.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteAdresse] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de l'adresse" };
  }
}

// ============================================================================
// Sub-Entity Actions: ClientEntreprise
// ============================================================================

export async function getClientEntreprise(id: string): Promise<ActionResult<ClientEntreprise>> {
  try {
    const data = await clientEntreprise.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getClientEntreprise] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du client entreprise" };
  }
}

export async function listClientsEntreprise(): Promise<ActionResult<ListClientsEntrepriseResponse>> {
  try {
    const data = await clientEntreprise.list({ pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listClientsEntreprise] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des clients entreprise" };
  }
}

export async function createClientEntrepriseAction(input: {
  raisonSociale: string;
  numeroTva: string;
  siren: string;
}): Promise<ActionResult<ClientEntreprise>> {
  try {
    const data = await clientEntreprise.create(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createClientEntreprise] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du client entreprise" };
  }
}

export async function updateClientEntrepriseAction(input: {
  id: string;
  raisonSociale?: string;
  numeroTva?: string;
  siren?: string;
}): Promise<ActionResult<ClientEntreprise>> {
  try {
    const data = await clientEntreprise.update(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updateClientEntreprise] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du client entreprise" };
  }
}

export async function deleteClientEntrepriseAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await clientEntreprise.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteClientEntreprise] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du client entreprise" };
  }
}

// ============================================================================
// Sub-Entity Actions: ClientPartenaire
// ============================================================================

export async function getClientPartenaire(id: string): Promise<ActionResult<ClientPartenaire>> {
  try {
    const data = await clientPartenaire.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getClientPartenaire] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du client partenaire" };
  }
}

export async function listClientsPartenaire(params?: {
  clientBaseId?: string;
  partenaireId?: string;
}): Promise<ActionResult<ListClientsPartenaireResponse>> {
  try {
    const data = await clientPartenaire.list({
      clientBaseId: params?.clientBaseId,
      partenaireId: params?.partenaireId,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listClientsPartenaire] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des clients partenaire" };
  }
}

export async function createClientPartenaireAction(input: {
  clientBaseId: string;
  partenaireId: string;
  rolePartenaireId: string;
  validFrom: string;
  validTo: string;
}): Promise<ActionResult<ClientPartenaire>> {
  try {
    const data = await clientPartenaire.create(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createClientPartenaire] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du client partenaire" };
  }
}

export async function updateClientPartenaireAction(input: {
  id: string;
  partenaireId?: string;
  rolePartenaireId?: string;
  validFrom?: string;
  validTo?: string;
}): Promise<ActionResult<ClientPartenaire>> {
  try {
    const data = await clientPartenaire.update(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updateClientPartenaire] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du client partenaire" };
  }
}

export async function deleteClientPartenaireAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await clientPartenaire.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteClientPartenaire] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du client partenaire" };
  }
}

// ============================================================================
// Sub-Entity Actions: StatutClient
// ============================================================================

export async function getStatutClient(id: string): Promise<ActionResult<StatutClient>> {
  try {
    const data = await statutClient.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getStatutClient] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du statut client" };
  }
}

export async function getStatutClientByCode(code: string): Promise<ActionResult<StatutClient>> {
  try {
    const data = await statutClient.getByCode({ code });
    return { data, error: null };
  } catch (err) {
    console.error("[getStatutClientByCode] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du statut client" };
  }
}

export async function listStatutsClient(): Promise<ActionResult<ListStatutsClientResponse>> {
  try {
    const data = await statutClient.list({ pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listStatutsClient] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des statuts client" };
  }
}

export async function createStatutClientAction(input: {
  code: string;
  nom: string;
  description: string;
  ordreAffichage: number;
}): Promise<ActionResult<StatutClient>> {
  try {
    const data = await statutClient.create(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createStatutClient] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du statut client" };
  }
}

export async function updateStatutClientAction(input: {
  id: string;
  code?: string;
  nom?: string;
  description?: string;
  ordreAffichage?: number;
}): Promise<ActionResult<StatutClient>> {
  try {
    const data = await statutClient.update(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updateStatutClient] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du statut client" };
  }
}

export async function deleteStatutClientAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await statutClient.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteStatutClient] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du statut client" };
  }
}

// ============================================================================
// Sub-Entity Actions: ConditionPaiement
// ============================================================================

export async function getConditionPaiement(id: string): Promise<ActionResult<ConditionPaiement>> {
  try {
    const data = await conditionPaiement.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getConditionPaiement] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la condition de paiement" };
  }
}

export async function getConditionPaiementByCode(code: string): Promise<ActionResult<ConditionPaiement>> {
  try {
    const data = await conditionPaiement.getByCode({ code });
    return { data, error: null };
  } catch (err) {
    console.error("[getConditionPaiementByCode] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la condition de paiement" };
  }
}

export async function listConditionsPaiement(search?: string): Promise<ActionResult<ListConditionPaiementResponse>> {
  try {
    const data = await conditionPaiement.list({ search: search || "", pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listConditionsPaiement] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des conditions de paiement" };
  }
}

export async function createConditionPaiementAction(input: {
  code: string;
  nom: string;
  description: string;
  delaiJours: number;
}): Promise<ActionResult<ConditionPaiement>> {
  try {
    const data = await conditionPaiement.create(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createConditionPaiement] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création de la condition de paiement" };
  }
}

export async function updateConditionPaiementAction(input: {
  id: string;
  code: string;
  nom: string;
  description: string;
  delaiJours: number;
}): Promise<ActionResult<ConditionPaiement>> {
  try {
    const data = await conditionPaiement.update(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updateConditionPaiement] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la condition de paiement" };
  }
}

export async function deleteConditionPaiementAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await conditionPaiement.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteConditionPaiement] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de la condition de paiement" };
  }
}

// ============================================================================
// Sub-Entity Actions: EmissionFacture
// ============================================================================

export async function getEmissionFacture(id: string): Promise<ActionResult<EmissionFacture>> {
  try {
    const data = await emissionFacture.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getEmissionFacture] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du type d'émission facture" };
  }
}

export async function getEmissionFactureByCode(code: string): Promise<ActionResult<EmissionFacture>> {
  try {
    const data = await emissionFacture.getByCode({ code });
    return { data, error: null };
  } catch (err) {
    console.error("[getEmissionFactureByCode] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du type d'émission facture" };
  }
}

export async function listEmissionsFacture(search?: string): Promise<ActionResult<ListEmissionFactureResponse>> {
  try {
    const data = await emissionFacture.list({ search: search || "", pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listEmissionsFacture] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des types d'émission facture" };
  }
}

export async function createEmissionFactureAction(input: {
  code: string;
  nom: string;
  description: string;
}): Promise<ActionResult<EmissionFacture>> {
  try {
    const data = await emissionFacture.create(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createEmissionFacture] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du type d'émission facture" };
  }
}

export async function updateEmissionFactureAction(input: {
  id: string;
  code: string;
  nom: string;
  description: string;
}): Promise<ActionResult<EmissionFacture>> {
  try {
    const data = await emissionFacture.update(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updateEmissionFacture] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du type d'émission facture" };
  }
}

export async function deleteEmissionFactureAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await emissionFacture.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteEmissionFacture] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du type d'émission facture" };
  }
}

// ============================================================================
// Sub-Entity Actions: FacturationPar
// ============================================================================

export async function getFacturationPar(id: string): Promise<ActionResult<FacturationPar>> {
  try {
    const data = await facturationPar.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getFacturationPar] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du mode de facturation" };
  }
}

export async function getFacturationParByCode(code: string): Promise<ActionResult<FacturationPar>> {
  try {
    const data = await facturationPar.getByCode({ code });
    return { data, error: null };
  } catch (err) {
    console.error("[getFacturationParByCode] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du mode de facturation" };
  }
}

export async function listFacturationsPar(search?: string): Promise<ActionResult<ListFacturationParResponse>> {
  try {
    const data = await facturationPar.list({ search: search || "", pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listFacturationsPar] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des modes de facturation" };
  }
}

export async function createFacturationParAction(input: {
  code: string;
  nom: string;
  description: string;
}): Promise<ActionResult<FacturationPar>> {
  try {
    const data = await facturationPar.create(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createFacturationPar] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du mode de facturation" };
  }
}

export async function updateFacturationParAction(input: {
  id: string;
  code: string;
  nom: string;
  description: string;
}): Promise<ActionResult<FacturationPar>> {
  try {
    const data = await facturationPar.update(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updateFacturationPar] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du mode de facturation" };
  }
}

export async function deleteFacturationParAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await facturationPar.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteFacturationPar] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du mode de facturation" };
  }
}

// ============================================================================
// Sub-Entity Actions: PeriodeFacturation
// ============================================================================

export async function getPeriodeFacturation(id: string): Promise<ActionResult<PeriodeFacturation>> {
  try {
    const data = await periodeFacturation.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getPeriodeFacturation] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la période de facturation" };
  }
}

export async function getPeriodeFacturationByCode(code: string): Promise<ActionResult<PeriodeFacturation>> {
  try {
    const data = await periodeFacturation.getByCode({ code });
    return { data, error: null };
  } catch (err) {
    console.error("[getPeriodeFacturationByCode] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement de la période de facturation" };
  }
}

export async function listPeriodesFacturation(search?: string): Promise<ActionResult<ListPeriodeFacturationResponse>> {
  try {
    const data = await periodeFacturation.list({ search: search || "", pagination: undefined });
    return { data, error: null };
  } catch (err) {
    console.error("[listPeriodesFacturation] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des périodes de facturation" };
  }
}

export async function createPeriodeFacturationAction(input: {
  code: string;
  nom: string;
  description: string;
}): Promise<ActionResult<PeriodeFacturation>> {
  try {
    const data = await periodeFacturation.create(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createPeriodeFacturation] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création de la période de facturation" };
  }
}

export async function updatePeriodeFacturationAction(input: {
  id: string;
  code: string;
  nom: string;
  description: string;
}): Promise<ActionResult<PeriodeFacturation>> {
  try {
    const data = await periodeFacturation.update(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updatePeriodeFacturation] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la période de facturation" };
  }
}

export async function deletePeriodeFacturationAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await periodeFacturation.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deletePeriodeFacturation] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression de la période de facturation" };
  }
}

// ============================================================================
// Sub-Entity Actions: TransporteurCompte
// ============================================================================

export async function getTransporteurCompte(id: string): Promise<ActionResult<TransporteurCompte>> {
  try {
    const data = await transporteurCompte.get({ id });
    return { data, error: null };
  } catch (err) {
    console.error("[getTransporteurCompte] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement du compte transporteur" };
  }
}

export async function listTransporteursCompte(params?: {
  type?: string;
  actif?: boolean;
}): Promise<ActionResult<ListTransporteurCompteResponse>> {
  try {
    const data = await transporteurCompte.list({
      type: params?.type || "",
      actif: params?.actif ?? true,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listTransporteursCompte] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des comptes transporteur" };
  }
}

export async function listTransporteursCompteByOrganisation(params: {
  organisationId: string;
  actif?: boolean;
}): Promise<ActionResult<ListTransporteurCompteResponse>> {
  try {
    const data = await transporteurCompte.listByOrganisation({
      organisationId: params.organisationId,
      actif: params.actif ?? true,
      pagination: undefined,
    });
    return { data, error: null };
  } catch (err) {
    console.error("[listTransporteursCompteByOrganisation] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors du chargement des comptes transporteur" };
  }
}

export async function createTransporteurCompteAction(input: {
  type: string;
  organisationId: string;
  contractNumber: string;
  password: string;
  labelFormat: string;
}): Promise<ActionResult<TransporteurCompte>> {
  try {
    const data = await transporteurCompte.create(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[createTransporteurCompte] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la création du compte transporteur" };
  }
}

export async function updateTransporteurCompteAction(input: {
  id: string;
  contractNumber: string;
  password: string;
  labelFormat: string;
}): Promise<ActionResult<TransporteurCompte>> {
  try {
    const data = await transporteurCompte.update(input);
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[updateTransporteurCompte] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du compte transporteur" };
  }
}

export async function activerTransporteurCompte(id: string): Promise<ActionResult<TransporteurCompte>> {
  try {
    const data = await transporteurCompte.activer({ id });
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[activerTransporteurCompte] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de l'activation du compte transporteur" };
  }
}

export async function desactiverTransporteurCompte(id: string): Promise<ActionResult<TransporteurCompte>> {
  try {
    const data = await transporteurCompte.desactiver({ id });
    revalidatePath("/clients");
    return { data, error: null };
  } catch (err) {
    console.error("[desactiverTransporteurCompte] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la désactivation du compte transporteur" };
  }
}

export async function deleteTransporteurCompteAction(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await transporteurCompte.delete({ id });
    revalidatePath("/clients");
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error("[deleteTransporteurCompte] gRPC error:", err);
    return { data: null, error: err instanceof Error ? err.message : "Erreur lors de la suppression du compte transporteur" };
  }
}

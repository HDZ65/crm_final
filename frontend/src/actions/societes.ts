"use server";

import { societes } from "@/lib/grpc";
import type { Societe } from "@proto-frontend/organisations/organisations";

export interface SocieteDto {
  id: string;
  organisationId: string;
  raisonSociale: string;
  siren?: string;
  numeroTva?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocieteActionResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Map gRPC Societe to frontend SocieteDto
 */
function mapSocieteToDto(societe: Societe): SocieteDto {
  return {
    id: societe.id,
    organisationId: societe.organisationId,
    raisonSociale: societe.raisonSociale,
    siren: societe.siren || undefined,
    numeroTva: societe.numeroTva || undefined,
    createdAt: societe.createdAt,
    updatedAt: societe.updatedAt,
  };
}

/**
 * List societes by organisation
 */
export async function listSocietesByOrganisation(
  organisationId: string
): Promise<SocieteActionResult<SocieteDto[]>> {
  try {
    const data = await societes.listByOrganisation({ organisationId });
    return {
      data: data.societes.map(mapSocieteToDto),
      error: null,
    };
  } catch (err) {
    console.error("[listSocietesByOrganisation] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement des sociétés",
    };
  }
}

/**
 * Get societe by ID
 */
export async function getSociete(id: string): Promise<SocieteActionResult<SocieteDto>> {
  try {
    const data = await societes.get({ id });
    return { data: mapSocieteToDto(data), error: null };
  } catch (err) {
    console.error("[getSociete] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du chargement de la société",
    };
  }
}

/**
 * Create a new societe
 */
export interface CreateSocieteInput {
  organisationId: string;
  raisonSociale: string;
  siren: string;
  numeroTva: string;
}

export async function createSociete(
  input: CreateSocieteInput
): Promise<SocieteActionResult<SocieteDto>> {
  console.log("[createSociete] Input received:", JSON.stringify(input));

  try {
    const data = await societes.create({
      organisationId: input.organisationId,
      raisonSociale: input.raisonSociale,
      siren: input.siren,
      numeroTva: input.numeroTva,
    });
    return { data: mapSocieteToDto(data), error: null };
  } catch (err) {
    console.error("[createSociete] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de la société",
    };
  }
}

/**
 * Update a societe
 */
export interface UpdateSocieteInput {
  id: string;
  raisonSociale: string;
  siren: string;
  numeroTva: string;
}

export async function updateSociete(
  input: UpdateSocieteInput
): Promise<SocieteActionResult<SocieteDto>> {
  try {
    const data = await societes.update({
      id: input.id,
      raisonSociale: input.raisonSociale,
      siren: input.siren,
      numeroTva: input.numeroTva,
    });
    return { data: mapSocieteToDto(data), error: null };
  } catch (err) {
    console.error("[updateSociete] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de la société",
    };
  }
}

/**
 * Delete a societe
 */
export async function deleteSociete(id: string): Promise<SocieteActionResult<boolean>> {
  try {
    await societes.delete({ id });
    return { data: true, error: null };
  } catch (err) {
    console.error("[deleteSociete] gRPC error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de la société",
    };
  }
}

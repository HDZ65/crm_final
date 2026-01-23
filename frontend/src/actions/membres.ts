"use server";

import { membresCompte, users } from "@/lib/grpc";
import type { MembreCompte, Utilisateur } from "@proto/organisations/users";

export interface MembreWithUserDto {
  id: string;
  organisationId: string;
  utilisateurId: string;
  roleId: string;
  etat: string;
  dateInvitation: string | null;
  dateActivation: string | null;
  createdAt: string;
  updatedAt: string;
  utilisateur?: {
    id: string;
    email: string;
    nom: string | null;
    prenom: string | null;
  };
}

export interface MembresActionResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Map gRPC MembreCompte + Utilisateur to frontend MembreWithUserDto
 */
function mapMembreToDto(
  membre: MembreCompte,
  utilisateur?: Utilisateur
): MembreWithUserDto {
  return {
    id: membre.id,
    organisationId: membre.organisationId,
    utilisateurId: membre.utilisateurId,
    roleId: membre.roleId,
    etat: membre.etat,
    dateInvitation: membre.dateInvitation || null,
    dateActivation: membre.dateActivation || null,
    createdAt: membre.createdAt,
    updatedAt: membre.updatedAt,
    utilisateur: utilisateur
      ? {
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom || null,
          prenom: utilisateur.prenom || null,
        }
      : undefined,
  };
}

/**
 * List membres by organisation with utilisateur data
 * Filters only active members (etat === 'actif')
 */
export async function listMembresWithUsers(
  organisationId: string
): Promise<MembresActionResult<MembreWithUserDto[]>> {
  try {
    // Fetch membres
    const membresData = await membresCompte.listByOrganisation({
      organisationId,
    });

    // Filter only active members
    const activeMembres = membresData.membres.filter((m) => m.etat === "actif");

    // Fetch utilisateur data for each membre in parallel
    const membresWithUsers = await Promise.all(
      activeMembres.map(async (membre) => {
        try {
          const utilisateur = await users.get({ id: membre.utilisateurId });
          return mapMembreToDto(membre, utilisateur);
        } catch {
          // If we can't fetch the user, return membre without user data
          return mapMembreToDto(membre);
        }
      })
    );

    return {
      data: membresWithUsers,
      error: null,
    };
  } catch (err) {
    console.error("[listMembresWithUsers] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des membres",
    };
  }
}

/**
 * Get single membre by ID
 */
export async function getMembre(
  id: string
): Promise<MembresActionResult<MembreWithUserDto>> {
  try {
    const membre = await membresCompte.get({ id });
    let utilisateur: Utilisateur | undefined;

    try {
      utilisateur = await users.get({ id: membre.utilisateurId });
    } catch {
      // Ignore user fetch errors
    }

    return { data: mapMembreToDto(membre, utilisateur), error: null };
  } catch (err) {
    console.error("[getMembre] gRPC error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du membre",
    };
  }
}

"use server";

import { comptes, organisations, membresCompte, rolesPartenaire, membresPartenaire, invitationsCompte } from "@/lib/grpc";
import type { ActionResult } from "@/lib/types/common";

export interface OrganisationResponse {
  id: string;
  nom: string;
  description?: string;
  siret?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  actif: boolean;
  etat?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompteWithOwnerResponse {
  compte: {
    id: string;
    nom: string;
    etat: string;
    dateCreation?: string;
    createdByUserId?: string;
  };
  owner: {
    id: string;
    keycloakId: string;
    email: string;
    nom: string;
    prenom: string;
  };
  membre: {
    id: string;
    organisationId: string;
    utilisateurId: string;
    roleId: string;
    etat: string;
  };
}

/**
 * Create an organisation/compte with the current user as owner
 * This is the main method for creating a new organisation
 */
export async function createOrganisationWithOwner(
  nom: string,
  keycloakUser: {
    sub: string;
    email: string;
    givenName?: string;
    familyName?: string;
    preferredUsername?: string;
    name?: string;
  }
): Promise<ActionResult<CompteWithOwnerResponse>> {
  try {
    const result = await comptes.createWithOwner({
      nom: nom.trim(),
      keycloakUser: {
        sub: keycloakUser.sub,
        email: keycloakUser.email,
        givenName: keycloakUser.givenName || "",
        familyName: keycloakUser.familyName || "",
        preferredUsername: keycloakUser.preferredUsername || "",
        name: keycloakUser.name || "",
      },
    });

    if (!result.compte || !result.owner || !result.membre) {
      return { data: null, error: "Erreur lors de la création de l'organisation" };
    }

    return {
      data: {
        compte: {
          id: result.compte.id,
          nom: result.compte.nom,
          etat: result.compte.etat,
          dateCreation: result.compte.dateCreation,
          createdByUserId: result.compte.createdByUserId,
        },
        owner: {
          id: result.owner.id,
          keycloakId: result.owner.keycloakId,
          email: result.owner.email,
          nom: result.owner.nom,
          prenom: result.owner.prenom,
        },
        membre: {
          id: result.membre.id,
          organisationId: result.membre.organisationId,
          utilisateurId: result.membre.utilisateurId,
          roleId: result.membre.roleId,
          etat: result.membre.etat,
        },
      },
      error: null,
    };
  } catch (err) {
    console.error("[createOrganisationWithOwner] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de l'organisation",
    };
  }
}

/**
 * Get an organisation by ID
 */
export async function getOrganisation(id: string): Promise<ActionResult<OrganisationResponse>> {
  try {
    const result = await organisations.get({ id });
    return {
      data: {
        id: result.id,
        nom: result.nom,
        description: result.description,
        siret: result.siret,
        adresse: result.adresse,
        telephone: result.telephone,
        email: result.email,
        actif: result.actif,
        etat: result.etat,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      error: null,
    };
  } catch (err) {
    console.error("[getOrganisation] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération de l'organisation",
    };
  }
}

/**
 * Update an organisation
 */
export async function updateOrganisation(
  id: string,
  data: {
    nom?: string;
    description?: string;
    siret?: string;
    adresse?: string;
    telephone?: string;
    email?: string;
    actif?: boolean;
    etat?: string;
  }
): Promise<ActionResult<OrganisationResponse>> {
  try {
    const result = await organisations.update({
      id,
      nom: data.nom || "",
      description: data.description || "",
      siret: data.siret || "",
      adresse: data.adresse || "",
      telephone: data.telephone || "",
      email: data.email || "",
      actif: data.actif ?? true,
      etat: data.etat || "",
    });
    return {
      data: {
        id: result.id,
        nom: result.nom,
        description: result.description,
        siret: result.siret,
        adresse: result.adresse,
        telephone: result.telephone,
        email: result.email,
        actif: result.actif,
        etat: result.etat,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      error: null,
    };
  } catch (err) {
    console.error("[updateOrganisation] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour de l'organisation",
    };
  }
}

/**
 * Delete an organisation
 */
export async function deleteOrganisation(id: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const result = await organisations.delete({ id });
    return {
      data: { success: result.success },
      error: null,
    };
  } catch (err) {
    console.error("[deleteOrganisation] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de l'organisation",
    };
  }
}

/**
 * Leave an organisation (delete membership)
 */
export async function leaveOrganisation(
  organisationId: string,
  utilisateurId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    // First, find the member record
    const membres = await membresCompte.listByOrganisation({ organisationId, pagination: undefined });
    const membre = membres.membres?.find((m) => m.utilisateurId === utilisateurId);

    if (!membre) {
      return { data: null, error: "Membre non trouvé dans cette organisation" };
    }

    // Delete the membership
    const result = await membresCompte.delete({ id: membre.id });
    return {
      data: { success: result.success },
      error: null,
    };
  } catch (err) {
    console.error("[leaveOrganisation] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du départ de l'organisation",
    };
  }
}

/**
 * Remove a member from an organisation (owner only)
 */
export async function removeMember(membreId: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    const result = await membresCompte.delete({ id: membreId });
    return {
      data: { success: result.success },
      error: null,
    };
  } catch (err) {
    console.error("[removeMember] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression du membre",
    };
  }
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  membreId: string,
  roleId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    await membresCompte.update({
      id: membreId,
      roleId,
      etat: "actif", // Keep the current state as active
    });
    return {
      data: { success: true },
      error: null,
    };
  } catch (err) {
    console.error("[updateMemberRole] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la mise à jour du rôle",
    };
  }
}

// ============================================
// ROLE PARTENAIRE (Organisation Roles)
// ============================================

export interface RolePartenaireResponse {
  id: string;
  code: string;
  nom: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all available roles for an organisation (partenaire)
 */
export async function getAvailableRoles(): Promise<ActionResult<RolePartenaireResponse[]>> {
  try {
    const result = await rolesPartenaire.list({ pagination: undefined });
    return {
      data: result.roles?.map((role) => ({
        id: role.id,
        code: role.code,
        nom: role.nom,
        description: role.description,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })) || [],
      error: null,
    };
  } catch (err) {
    console.error("[getAvailableRoles] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération des rôles",
    };
  }
}

// ============================================
// MEMBRE PARTENAIRE (Organisation Members)
// ============================================

export interface MembrePartenaireResponse {
  id: string;
  partenaireId: string;
  utilisateurId: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
  utilisateur?: {
    id: string;
    email: string;
    nom: string | null;
    prenom: string | null;
  };
  role?: {
    id: string;
    code: string;
    nom: string;
  };
}

/**
 * Get all members of an organisation (partenaire)
 */
export async function getOrganisationMembers(
  partenaireId: string
): Promise<ActionResult<MembrePartenaireResponse[]>> {
  try {
    const result = await membresPartenaire.listByPartenaire({ partenaireId, pagination: undefined });
    return {
      data: result.membres || [],
      error: null,
    };
  } catch (err) {
    console.error("[getOrganisationMembers] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération des membres",
    };
  }
}

/**
 * Get my role in an organisation
 */
export async function getMyRole(
  partenaireId: string,
  utilisateurId: string
): Promise<ActionResult<MembrePartenaireResponse | null>> {
  try {
    const result = await membresPartenaire.listByUtilisateur({ utilisateurId, pagination: undefined });
    const myMember = result.membres?.find((m) => m.partenaireId === partenaireId);
    return {
      data: myMember || null,
      error: null,
    };
  } catch (err) {
    console.error("[getMyRole] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération du rôle",
    };
  }
}

// ============================================
// INVITATION COMPTE (Organisation Invitations)
// ============================================

export interface InvitationCompteResponse {
  id: string;
  organisationId: string;
  emailInvite: string;
  roleId: string;
  token: string;
  expireAt: string;
  etat: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all invitations for an organisation
 */
export async function getOrganisationInvitations(
  organisationId: string
): Promise<ActionResult<InvitationCompteResponse[]>> {
  try {
    const result = await invitationsCompte.listByOrganisation({ organisationId, pagination: undefined });
    return {
      data: result.invitations || [],
      error: null,
    };
  } catch (err) {
    console.error("[getOrganisationInvitations] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération des invitations",
    };
  }
}

/**
 * Create an invitation for an organisation
 */
export async function createInvitation(
  organisationId: string,
  emailInvite: string,
  roleId: string
): Promise<ActionResult<InvitationCompteResponse>> {
  try {
    // Calculer une date d'expiration par défaut (7 jours à partir d'aujourd'hui)
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 7);
    const expireAtIso = expireAt.toISOString();

    // Utiliser create() pour construire le message protobuf correctement
    const { CreateInvitationCompteRequest } = await import("@proto/organisations/organisations");
    const request = CreateInvitationCompteRequest.create({
      organisationId,
      emailInvite,
      roleId,
      expireAt: expireAtIso,
    });

    const result = await invitationsCompte.create(request);
    return {
      data: result,
      error: null,
    };
  } catch (err) {
    console.error("[createInvitation] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la création de l'invitation",
    };
  }
}

/**
 * Delete an invitation
 */
export async function deleteInvitation(
  invitationId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const result = await invitationsCompte.delete({ id: invitationId });
    return {
      data: { success: result.success },
      error: null,
    };
  } catch (err) {
    console.error("[deleteInvitation] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la suppression de l'invitation",
    };
  }
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  invitationId: string
): Promise<ActionResult<InvitationCompteResponse>> {
  try {
    const result = await invitationsCompte.accept({ id: invitationId });
    return {
      data: result,
      error: null,
    };
  } catch (err) {
    console.error("[acceptInvitation] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'acceptation de l'invitation",
    };
  }
}

/**
 * Reject an invitation
 */
export async function rejectInvitation(
  invitationId: string
): Promise<ActionResult<InvitationCompteResponse>> {
  try {
    const result = await invitationsCompte.reject({ id: invitationId });
    return {
      data: result,
      error: null,
    };
  } catch (err) {
    console.error("[rejectInvitation] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors du rejet de l'invitation",
    };
  }
}

/**
 * Validate an invitation by token
 */
export async function validateInvitationByToken(
  token: string
): Promise<ActionResult<InvitationCompteResponse & {
  organisationNom?: string;
  roleNom?: string;
}>> {
  try {
    const result = await invitationsCompte.getByToken({ token });

    // Enrichir avec les infos de l'organisation et du rôle si disponibles
    const enriched = {
      ...result,
      // Ces champs pourraient être enrichis en appelant les services appropriés
      organisationNom: "Organisation",
      roleNom: "Membre",
    };

    return {
      data: enriched,
      error: null,
    };
  } catch (err) {
    console.error("[validateInvitationByToken] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la validation de l'invitation",
    };
  }
}

/**
 * Accept an invitation by token (public endpoint)
 */
export async function acceptInvitationByToken(
  token: string
): Promise<ActionResult<{ success: boolean; message?: string }>> {
  try {
    const result = await invitationsCompte.accept({ id: token });
    return {
      data: { success: true },
      error: null,
    };
  } catch (err) {
    console.error("[acceptInvitationByToken] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de l'acceptation de l'invitation",
    };
  }
}


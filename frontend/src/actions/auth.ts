"use server";

import { cookies } from "next/headers";
import {
  loginSchema,
  type LoginFormData,
  signupSchema,
} from "@/lib/schemas/auth";
import { parseFormData } from "@/lib/forms/validation";
import { users, membresCompte, comptes, roles } from "@/lib/grpc";
import type { FormState } from "@/lib/forms/state";
import type {
  UserOrganisation,
  UserRole,
  Utilisateur,
} from "@proto/organisations/users";
import { COOKIE_NAMES, TOKEN_CONFIG } from "@/lib/auth/auth.config";

// =============================================================================
// Types
// =============================================================================

export interface AuthMeResponse {
  utilisateur: Utilisateur;
  organisations: UserOrganisation[];
  hasOrganisation: boolean;
}

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

// =============================================================================
// Organisation Cookie Management
// =============================================================================

/**
 * Get the current user's organisation ID from cookies
 */
export async function getActiveOrganisationId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.ACTIVE_ORG)?.value ?? null;
}

/**
 * Set the active organisation ID in cookies
 */
export async function setActiveOrganisationId(
  organisationId: string
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.ACTIVE_ORG, organisationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_CONFIG.ORG_COOKIE_MAX_AGE,
  });
}

// =============================================================================
// User Profile Fetching (via gRPC)
// =============================================================================

interface UserInfo {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Get current user by Keycloak ID via gRPC
 * Creates user automatically if they don't exist
 */
export async function getCurrentUserByKeycloakId(
  keycloakId: string,
  userInfo?: UserInfo
): Promise<ActionResult<AuthMeResponse>> {
  try {
    const user = await getOrCreateUser(keycloakId, userInfo);
    const organisations = await fetchUserOrganisations(user.id);

    return {
      data: {
        utilisateur: {
          id: user.id,
          keycloakId: user.keycloakId,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          telephone: user.telephone || "",
          actif: user.actif,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        organisations,
        hasOrganisation: organisations.length > 0,
      },
      error: null,
    };
  } catch (err) {
    console.error("[getCurrentUserByKeycloakId] Error:", err);
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Erreur lors de la recuperation du profil",
    };
  }
}

// =============================================================================
// Form Actions (Next.js 15 pattern)
// =============================================================================

/**
 * Validate login form data
 * Note: Actual authentication is handled by signIn from NextAuth on client
 */
export async function validateLoginAction(
  prevState: FormState<LoginFormData>,
  formData: FormData
): Promise<FormState<LoginFormData>> {
  const result = parseFormData(loginSchema, formData);

  if (!result.success) {
    return {
      success: false,
      errors: result.errors,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Validate and create account
 */
export async function signupAction(
  prevState: FormState<{ success: boolean }>,
  formData: FormData
): Promise<FormState<{ success: boolean }>> {
  const result = parseFormData(signupSchema, formData);

  if (!result.success) {
    return {
      success: false,
      errors: result.errors,
    };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        errors: { _form: [error.message || "Erreur lors de l'inscription"] },
      };
    }

    return {
      success: true,
      data: { success: true },
    };
  } catch {
    return {
      success: false,
      errors: { _form: ["Une erreur est survenue. Veuillez reessayer."] },
    };
  }
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Get existing user or create new one
 */
async function getOrCreateUser(keycloakId: string, userInfo?: UserInfo) {
  try {
    return await users.getByKeycloakId({ keycloakId });
  } catch (err) {
    const error = err as { code?: number; details?: string };
    const isNotFound =
      error.code === 5 ||
      error.details?.includes("not found") ||
      error.details?.includes("NOT_FOUND");

    if (!isNotFound || !userInfo?.email) {
      throw err;
    }

    console.log(
      `[getOrCreateUser] Creating new user for keycloakId: ${keycloakId}`
    );

    const { nom, prenom } = parseNameFromUserInfo(userInfo);

    const user = await users.create({
      keycloakId,
      email: userInfo.email,
      nom,
      prenom,
      telephone: "",
      actif: true,
    });

    console.log(`[getOrCreateUser] User created: ${user.id}`);
    return user;
  }
}

/**
 * Parse name from user info
 */
function parseNameFromUserInfo(userInfo: UserInfo): {
  nom: string;
  prenom: string;
} {
  let nom = userInfo.family_name || "";
  let prenom = userInfo.given_name || "";

  if (!nom && !prenom && userInfo.name) {
    const nameParts = userInfo.name.trim().split(" ");
    if (nameParts.length >= 2) {
      prenom = nameParts[0];
      nom = nameParts.slice(1).join(" ");
    } else {
      nom = userInfo.name;
    }
  }

  return {
    nom: nom || "Utilisateur",
    prenom: prenom || "",
  };
}

/**
 * Fetch user organisations with details
 */
async function fetchUserOrganisations(
  userId: string
): Promise<UserOrganisation[]> {
  const membresResponse = await membresCompte.listByUtilisateur({
    utilisateurId: userId,
  });

  return Promise.all(
    (membresResponse.membres || []).map(async (membre) => {
      const [compteResult, roleResult] = await Promise.allSettled([
        comptes.get({ id: membre.organisationId }),
        roles.get({ id: membre.roleId }),
      ]);

      const organisationNom =
        compteResult.status === "fulfilled" ? compteResult.value.nom : "";

      const role: UserRole =
        roleResult.status === "fulfilled"
          ? {
              id: roleResult.value.id,
              code: roleResult.value.code,
              nom: roleResult.value.nom,
            }
          : { id: "", code: "", nom: "" };

      return {
        organisationId: membre.organisationId,
        organisationNom,
        role,
        etat: membre.etat || "actif",
      };
    })
  );
}

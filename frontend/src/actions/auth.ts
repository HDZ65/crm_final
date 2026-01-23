"use server";

import { cookies } from "next/headers";
import { loginSchema, type LoginFormData, signupSchema, type SignupFormData } from "@/lib/schemas/auth";
import { parseFormData } from "@/lib/form-validation";
import { users, membresCompte, comptes, roles } from "@/lib/grpc";
import type { FormState } from "@/lib/form-state";
import type {
  UserProfile,
  UserOrganisation,
  UserRole,
  Utilisateur,
} from "@proto/organisations/users";

export interface AuthMeResponse {
  utilisateur: Utilisateur;
  organisations: UserOrganisation[];
  hasOrganisation: boolean;
}

export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Get the current user's organisation ID from cookies
 * This is a workaround since we can't access NextAuth session directly in server actions
 */
export async function getActiveOrganisationId(): Promise<string | null> {
  const cookieStore = await cookies();
  // Try to get stored organisation ID from cookie
  const orgCookie = cookieStore.get("active_organisation_id");
  return orgCookie?.value || null;
}

/**
 * Set the active organisation ID in cookies
 */
export async function setActiveOrganisationId(organisationId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("active_organisation_id", organisationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Get current user by Keycloak ID via gRPC
 * This replaces the REST API /auth/me endpoint
 * If user doesn't exist, creates them automatically
 */
export async function getCurrentUserByKeycloakId(
  keycloakId: string,
  userInfo?: { email?: string; name?: string; given_name?: string; family_name?: string }
): Promise<ActionResult<AuthMeResponse>> {
  try {
    let user;
    
    try {
      // Try to get user by keycloak ID
      user = await users.getByKeycloakId({ keycloakId });
    } catch (err) {
      // User doesn't exist - create them if we have userInfo
      const error = err as { code?: number; details?: string };
      const isNotFound = error.code === 5 || error.details?.includes("not found") || error.details?.includes("NOT_FOUND");
      
      if (isNotFound && userInfo?.email) {
        console.log(`[getCurrentUserByKeycloakId] User not found, creating new user for keycloakId: ${keycloakId}`);
        
        // Parse name from userInfo
        let nom = "";
        let prenom = "";
        
        if (userInfo.family_name) {
          nom = userInfo.family_name;
        }
        if (userInfo.given_name) {
          prenom = userInfo.given_name;
        }
        // Fallback: split the full name
        if (!nom && !prenom && userInfo.name) {
          const nameParts = userInfo.name.trim().split(" ");
          if (nameParts.length >= 2) {
            prenom = nameParts[0];
            nom = nameParts.slice(1).join(" ");
          } else {
            nom = userInfo.name;
          }
        }
        
        // Create the user
        user = await users.create({
          keycloakId,
          email: userInfo.email,
          nom: nom || "Utilisateur",
          prenom: prenom || "",
          telephone: "",
          actif: true,
        });
        
        console.log(`[getCurrentUserByKeycloakId] User created successfully: ${user.id}`);
      } else {
        // Re-throw if not a "not found" error or no userInfo
        throw err;
      }
    }

    // Get user's organisations via membre_compte
    const membresResponse = await membresCompte.listByUtilisateur({
      utilisateurId: user.id,
    });

    // Fetch organisation and role details for each membre
    const userOrganisations: UserOrganisation[] = await Promise.all(
      (membresResponse.membres || []).map(async (m) => {
        // Fetch compte/organisation details (comptes are in service-users, not service-organisations)
        let organisationNom = "";
        try {
          const compte = await comptes.get({ id: m.organisationId });
          organisationNom = compte.nom;
        } catch {
          console.warn(`[getCurrentUserByKeycloakId] Could not fetch compte ${m.organisationId}`);
        }

        // Fetch role details
        let role: UserRole = { id: "", code: "", nom: "" };
        try {
          const roleData = await roles.get({ id: m.roleId });
          role = { id: roleData.id, code: roleData.code, nom: roleData.nom };
        } catch {
          console.warn(`[getCurrentUserByKeycloakId] Could not fetch role ${m.roleId}`);
        }

        return {
          organisationId: m.organisationId,
          organisationNom,
          role,
          etat: m.etat || "actif",
        };
      })
    );

    const data: AuthMeResponse = {
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
      organisations: userOrganisations,
      hasOrganisation: userOrganisations.length > 0,
    };

    return { data, error: null };
  } catch (err) {
    console.error("[getCurrentUserByKeycloakId] error:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "Erreur lors de la récupération du profil",
    };
  }
}

// ============================================================================
// Form Actions (Next.js 15 native pattern)
// ============================================================================

/**
 * Action de validation du formulaire de connexion
 * Valide les données côté serveur et retourne les erreurs ou succès
 * Note: L'authentification réelle est gérée par signIn de NextAuth côté client
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

  // Validation réussie - retourner les données pour que le client appelle signIn
  return {
    success: true,
    data: result.data,
  };
}

/**
 * Action de validation et création de compte
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
    // Appeler l'API d'inscription
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });

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
  } catch (error) {
    return {
      success: false,
      errors: { _form: ["Une erreur est survenue. Veuillez réessayer."] },
    };
  }
}

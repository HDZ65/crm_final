import { cookies } from "next/headers";
import { users, membresCompte, comptes, roles } from "@/lib/grpc";
import type { UserOrganisation, UserRole } from "@proto/organisations/users";
import type { AuthMeResponse } from "@/actions/auth";
import { parseJWT } from "./token-manager";
import { auth, handlers, signIn, signOut } from "./auth";
import { authConfig, COOKIE_NAMES } from "./auth.config";

export { auth, handlers, signIn, signOut, authConfig };

/** @deprecated Use `auth()` directly */
export async function getServerAuth() {
  return auth();
}

export async function getActiveOrgIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.ACTIVE_ORG)?.value ?? null;
}

export async function getServerUserProfile(): Promise<AuthMeResponse | null> {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return null;
    }

    const tokenPayload = parseJWT(session.accessToken);
    if (!tokenPayload?.sub) {
      return null;
    }

    const keycloakId = tokenPayload.sub;
    const user = await getOrCreateUser(keycloakId, tokenPayload);

    if (!user) {
      return null;
    }

    const organisations = await fetchUserOrganisations(user.id);

    return {
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
    };
  } catch (error) {
    console.error("[getServerUserProfile] Error:", error);
    return null;
  }
}

interface TokenPayloadInfo {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
}

async function getOrCreateUser(
  keycloakId: string,
  tokenPayload: TokenPayloadInfo
) {
  try {
    return await users.getByKeycloakId({ keycloakId });
  } catch (err) {
    const error = err as { code?: number; details?: string };
    const isNotFound =
      error.code === 5 ||
      error.details?.includes("not found") ||
      error.details?.includes("NOT_FOUND");

    if (!isNotFound || !tokenPayload.email) {
      throw err;
    }

    console.log(
      `[getOrCreateUser] Creating new user for keycloakId: ${keycloakId}`
    );

    const { nom, prenom } = parseNameFromToken(tokenPayload);

    const user = await users.create({
      keycloakId,
      email: tokenPayload.email,
      nom,
      prenom,
      telephone: "",
      actif: true,
    });

    console.log(`[getOrCreateUser] User created: ${user.id}`);
    return user;
  }
}

function parseNameFromToken(tokenPayload: TokenPayloadInfo): {
  nom: string;
  prenom: string;
} {
  let nom = tokenPayload.family_name || "";
  let prenom = tokenPayload.given_name || "";

  if (!nom && !prenom && tokenPayload.name) {
    const nameParts = tokenPayload.name.trim().split(" ");
    if (nameParts.length >= 2) {
      prenom = nameParts[0];
      nom = nameParts.slice(1).join(" ");
    } else {
      nom = tokenPayload.name;
    }
  }

  return {
    nom: nom || "Utilisateur",
    prenom: prenom || "",
  };
}

async function fetchUserOrganisations(
  userId: string
): Promise<UserOrganisation[]> {
  const membresResponse = await membresCompte.listByUtilisateur({
    utilisateurId: userId,
  });

  const organisations = await Promise.all(
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

  return organisations;
}

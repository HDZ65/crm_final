import { cookies } from "next/headers";
import { users } from "@/lib/grpc";
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

    // Try to get profile directly
    let profile = await users.getProfile({ keycloakId });

    // If not found, create user and retry
    if (!profile) {
      await getOrCreateUser(keycloakId, tokenPayload);
      profile = await users.getProfile({ keycloakId });
    }

    if (!profile?.utilisateur) {
      return null;
    }

    return {
      utilisateur: profile.utilisateur,
      organisations: profile.organisations || [],
      hasOrganisation: profile.hasOrganisation || false,
    };
  } catch (error) {
    const err = error as { code?: number; details?: string };
    const isNotFound =
      err.code === 5 ||
      err.details?.includes("not found") ||
      err.details?.includes("NOT_FOUND");

    // If not found and we have token payload, try creating user
    if (isNotFound) {
      try {
        const session = await auth();
        if (!session?.accessToken) {
          return null;
        }

        const tokenPayload = parseJWT(session.accessToken);
        if (!tokenPayload?.sub) {
          return null;
        }

        await getOrCreateUser(tokenPayload.sub, tokenPayload);
        const profile = await users.getProfile({ keycloakId: tokenPayload.sub });

        if (!profile?.utilisateur) {
          return null;
        }

        return {
          utilisateur: profile.utilisateur,
          organisations: profile.organisations || [],
          hasOrganisation: profile.hasOrganisation || false,
        };
      } catch {
        return null;
      }
    }

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



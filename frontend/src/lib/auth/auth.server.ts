import { cookies } from "next/headers";
import { users } from "@/lib/grpc";
import { getServerUserProfile as getMockProfile } from "./auth.server.mock";
import type { AuthMeResponse } from "@/actions/auth";
import { parseJWT, type JWTPayload } from "./token-manager";
import { auth, handlers, signIn, signOut } from "./auth";
import { authConfig, COOKIE_NAMES } from "./auth.config";

export { auth, handlers, signIn, signOut, authConfig };

/** @deprecated Use `auth()` directly */
export async function getServerAuth() {
  return auth();
}

export async function getActiveOrgIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const orgId = cookieStore.get(COOKIE_NAMES.ACTIVE_ORG)?.value;
  if (orgId) return orgId;
  // Use mock org id for development
  return "mock-org-id";
}

async function _old_getActiveOrgIdFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.ACTIVE_ORG)?.value ?? null;
}

export async function getServerUserProfile(): Promise<AuthMeResponse | null> {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      console.log("[getServerUserProfile] No session, using mock auth");
      return getMockProfile();
    }

    const tokenPayload = parseJWT(session.accessToken);
    if (!tokenPayload?.sub) {
      return getMockProfile();
    }

    const keycloakId = tokenPayload.sub;

    let profile = await users.getProfile({ keycloakId });

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
    console.log("[getServerUserProfile] Error, using mock auth:", error);
    return getMockProfile();
  }
}

async function getOrCreateUser(
  keycloakId: string,
  tokenPayload: JWTPayload
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

function parseNameFromToken(tokenPayload: JWTPayload): {
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



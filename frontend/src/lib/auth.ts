import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { users, membresCompte, comptes, roles } from "@/lib/grpc";
import type { UserOrganisation, UserRole } from "@proto/organisations/users";
import type { AuthMeResponse } from "@/actions/auth";
import {
  authenticateWithCredentials,
  refreshAccessToken,
  shouldRefreshToken,
  parseJWT,
  COOKIE_NAMES,
} from "@/lib/auth/index";

// Re-export auth utilities for convenience
export {
  parseJWT,
  getKeycloakIdFromToken,
  getRolesFromToken,
  isTokenExpired,
  getTokenTimeRemaining,
  PUBLIC_ROUTES,
  TOKEN_CONFIG,
  COOKIE_NAMES,
  AUTH_URLS,
  AUTH_ERRORS,
  type JWTPayload,
  type TokenData,
} from "@/lib/auth/index";

// =============================================================================
// NextAuth Configuration
// =============================================================================

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { user, error } = await authenticateWithCredentials(
          credentials.email,
          credentials.password
        );

        if (error || !user) {
          return null;
        }

        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Premier login - stocker les tokens
      if (user) {
        const userData = user as {
          accessToken?: string;
          refreshToken?: string;
          expiresAt?: number;
        };
        return {
          ...token,
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          expiresAt: userData.expiresAt,
        };
      }

      // Verifier si le token doit etre rafraichi
      const expiresAt = token.expiresAt as number;
      if (!shouldRefreshToken(expiresAt)) {
        return token;
      }

      // Rafraichir le token
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

// =============================================================================
// Server-side Auth Helpers
// =============================================================================

/**
 * Get server session - use in Server Components
 */
export async function getServerAuth() {
  return getServerSession(authOptions);
}

/**
 * Get active organisation ID from cookie (server-side)
 */
export async function getActiveOrgIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAMES.ACTIVE_ORG)?.value ?? null;
}

// =============================================================================
// User Profile Fetching
// =============================================================================

/**
 * Get user profile server-side - fetches all data in one go
 * Creates user automatically if they don't exist
 */
export async function getServerUserProfile(): Promise<AuthMeResponse | null> {
  try {
    const session = await getServerAuth();
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

// =============================================================================
// Internal Helpers
// =============================================================================

interface TokenPayloadInfo {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Get existing user or create new one
 */
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

    // Create new user
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

/**
 * Parse name from token payload
 */
function parseNameFromToken(tokenPayload: TokenPayloadInfo): {
  nom: string;
  prenom: string;
} {
  let nom = tokenPayload.family_name || "";
  let prenom = tokenPayload.given_name || "";

  // Fallback: split full name
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

/**
 * Fetch user organisations with details
 */
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

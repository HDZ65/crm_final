import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { users, membresCompte, comptes, roles } from "@/lib/grpc";
import type { UserOrganisation, UserRole } from "@proto/organisations/users";
import type { AuthMeResponse } from "@/actions/auth";

/**
 * Refresh access token using refresh token
 */
interface TokenData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  [key: string]: unknown;
}

async function refreshToken(token: TokenData): Promise<TokenData> {
  try {
    const response = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_ID!,
          client_secret: process.env.KEYCLOAK_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken || "",
        }),
      }
    );

    const tokens = await response.json();

    if (!response.ok) throw tokens;

    return {
      ...token,
      accessToken: tokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
      refreshToken: tokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

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

        try {
          const tokenResponse = await fetch(
            `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_ID!,
                client_secret: process.env.KEYCLOAK_SECRET!,
                grant_type: "password",
                username: credentials.email as string,
                password: credentials.password as string,
                scope: "openid email profile",
              }),
            }
          );

          if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json().catch(() => ({}));
            console.error("Keycloak authentication failed:", tokenResponse.status, errorData);
            return null;
          }

          const tokens = await tokenResponse.json();

          const userInfoResponse = await fetch(
            `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`,
            {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            }
          );

          if (!userInfoResponse.ok) {
            return null;
          }

          const userInfo = await userInfoResponse.json();

          return {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim(),
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
          };
        } catch (error) {
          console.error("Error during Keycloak authentication:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const userData = user as { accessToken?: string; refreshToken?: string; expiresAt?: number };
        return {
          ...token,
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          expiresAt: userData.expiresAt,
        };
      }

      const expiresAt = token.expiresAt as number;
      const now = Date.now() / 1000;
      const timeUntilExpiry = expiresAt - now;
      
      // Refresh si le token expire dans moins de 60 secondes
      if (timeUntilExpiry > 60) {
        return token;
      }

      const refreshed = await refreshToken(token);
      if (refreshed.error) {
        return { ...token, error: "RefreshAccessTokenError" };
      }
      return refreshed;
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

/**
 * Get server session - use this in Server Components
 */
export async function getServerAuth() {
  return getServerSession(authOptions);
}

/**
 * Get keycloak ID from JWT token
 */
function getKeycloakIdFromToken(accessToken: string): string | null {
  try {
    const base64Url = accessToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    return payload.sub || null;
  } catch {
    return null;
  }
}

/**
 * Get user profile server-side - fetches all data in one go
 * Use this in Server Components for optimal performance
 */
export async function getServerUserProfile(): Promise<AuthMeResponse | null> {
  try {
    const session = await getServerAuth();

    if (!session?.accessToken) {
      return null;
    }

    const keycloakId = getKeycloakIdFromToken(session.accessToken);
    if (!keycloakId) {
      return null;
    }

    // Fetch user by keycloak ID
    const user = await users.getByKeycloakId({ keycloakId });

    // Fetch user's organisations
    const membresResponse = await membresCompte.listByUtilisateur({
      utilisateurId: user.id,
    });

    // Fetch all organisation and role details in parallel
    const userOrganisations: UserOrganisation[] = await Promise.all(
      (membresResponse.membres || []).map(async (m) => {
        // Fetch compte and role in parallel (optimization!)
        const [compteResult, roleResult] = await Promise.allSettled([
          comptes.get({ id: m.organisationId }),
          roles.get({ id: m.roleId }),
        ]);

        const organisationNom = compteResult.status === 'fulfilled' ? compteResult.value.nom : "";
        const role: UserRole = roleResult.status === 'fulfilled'
          ? { id: roleResult.value.id, code: roleResult.value.code, nom: roleResult.value.nom }
          : { id: "", code: "", nom: "" };

        return {
          organisationId: m.organisationId,
          organisationNom,
          role,
          etat: m.etat || "actif",
        };
      })
    );

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
      organisations: userOrganisations,
      hasOrganisation: userOrganisations.length > 0,
    };
  } catch (error) {
    console.error("[getServerUserProfile] Error:", error);
    return null;
  }
}

/**
 * Get active organisation ID from cookie (server-side)
 */
export async function getActiveOrgIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("active_organisation_id")?.value || null;
}

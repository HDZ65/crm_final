import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/auth",
  "/invite",
  "/forgot-password",
  "/reset-password",
  "/catalogue",
] as const;

export const TOKEN_CONFIG = {
  REFRESH_THRESHOLD_SECONDS: 60,
  ORG_COOKIE_MAX_AGE: 60 * 60 * 24 * 30,
} as const;

export const COOKIE_NAMES = {
  SESSION_TOKEN: "authjs.session-token",
  CSRF_TOKEN: "authjs.csrf-token",
  ACTIVE_ORG: "active_organisation_id",
} as const;

export const AUTH_URLS = {
  LOGIN: "/login",
  UNAUTHORIZED: "/unauthorized",
  DEFAULT_CALLBACK: "/",
} as const;

export const AUTH_ERRORS = {
  REFRESH_TOKEN_ERROR: "RefreshAccessTokenError",
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
  GENERIC_ERROR: "Une erreur est survenue. Veuillez reessayer.",
} as const;

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface KeycloakUserInfo {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
}

interface TokenData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  [key: string]: unknown;
}

const getKeycloakConfig = () => ({
  issuer: process.env.KEYCLOAK_ISSUER!,
  clientId: process.env.KEYCLOAK_ID!,
  clientSecret: process.env.KEYCLOAK_SECRET!,
});

async function authenticateWithCredentials(
  email: string,
  password: string
): Promise<{
  user: {
    id: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } | null;
  error?: string;
}> {
  const config = getKeycloakConfig();

  try {
    const tokenResponse = await fetch(
      `${config.issuer}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: "password",
          username: email,
          password: password,
          scope: "openid email profile",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error(
        "Keycloak authentication failed:",
        tokenResponse.status,
        errorData
      );
      return { user: null, error: AUTH_ERRORS.INVALID_CREDENTIALS };
    }

    const tokens: KeycloakTokenResponse = await tokenResponse.json();

    const userInfoResponse = await fetch(
      `${config.issuer}/protocol/openid-connect/userinfo`,
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      return { user: null, error: "Failed to fetch user info" };
    }

    const userInfo: KeycloakUserInfo = await userInfoResponse.json();

    const name =
      userInfo.name ||
      [userInfo.given_name, userInfo.family_name].filter(Boolean).join(" ") ||
      userInfo.email ||
      "";

    return {
      user: {
        id: userInfo.sub,
        email: userInfo.email || email,
        name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
      },
    };
  } catch (error) {
    console.error("Error during Keycloak authentication:", error);
    return { user: null, error: AUTH_ERRORS.GENERIC_ERROR };
  }
}

async function refreshAccessToken(token: TokenData): Promise<TokenData> {
  const config = getKeycloakConfig();

  try {
    const response = await fetch(
      `${config.issuer}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken || "",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error_description || "Token refresh failed");
    }

    const tokens: KeycloakTokenResponse = await response.json();

    return {
      ...token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: AUTH_ERRORS.REFRESH_TOKEN_ERROR,
    };
  }
}

function shouldRefreshToken(expiresAt: number): boolean {
  const now = Date.now() / 1000;
  const timeUntilExpiry = expiresAt - now;
  return timeUntilExpiry <= TOKEN_CONFIG.REFRESH_THRESHOLD_SECONDS;
}

export const authConfig: NextAuthConfig = {
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
          credentials.email as string,
          credentials.password as string
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
    async jwt({ token, user }: { token: JWT; user?: User }) {
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

      const expiresAt = token.expiresAt as number;
      if (!shouldRefreshToken(expiresAt)) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }: { session: Session; token: JWT }) {
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

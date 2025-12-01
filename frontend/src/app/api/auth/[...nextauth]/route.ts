import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
          refresh_token: token.refreshToken,
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

const handler = NextAuth({
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
          // Call Keycloak token endpoint with Resource Owner Password Credentials Grant
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

          // Get user info from Keycloak
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

          // Return user object with tokens
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
      // First-time login: user object from authorize() contains tokens
      if (user) {
        const userData = user as { accessToken?: string; refreshToken?: string; expiresAt?: number };
        return {
          ...token,
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          expiresAt: userData.expiresAt,
        };
      }

      // Subsequent requests: check if access_token is still valid
      if (!token.expiresAt || Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      // Token expired: refresh it
      return refreshToken(token);
    },
    async session({ session, token }) {
      // Send properties to client
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      if (token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };

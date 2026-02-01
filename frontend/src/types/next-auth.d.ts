import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extended User type returned by authorize callback
   */
  interface User {
    id: string;
    email?: string;
    name?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }

  /**
   * Extended Session type available in useSession and getServerSession
   */
  interface Session {
    /** JWT access token for API calls */
    accessToken?: string;
    /** ID token from Keycloak */
    idToken?: string;
    /** Error state (e.g., "RefreshAccessTokenError") */
    error?: string;
    /** User information */
    user?: {
      /** Keycloak user ID (sub claim) */
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT type stored in the session cookie
   */
  interface JWT {
    /** Access token for API calls */
    accessToken?: string;
    /** ID token from Keycloak */
    idToken?: string;
    /** Refresh token for token renewal */
    refreshToken?: string;
    /** Token expiration timestamp (Unix seconds) */
    expiresAt?: number;
    /** Error state (e.g., "RefreshAccessTokenError") */
    error?: string;
    /** Keycloak user ID */
    sub?: string;
  }
}

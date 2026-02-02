import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email?: string;
    name?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }

  interface Session {
    accessToken?: string;
    idToken?: string;
    error?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    sub?: string;
  }
}

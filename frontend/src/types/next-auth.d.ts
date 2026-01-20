import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
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
  }
}

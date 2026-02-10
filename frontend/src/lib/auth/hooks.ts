"use client";

import { useSession } from "next-auth/react";
import type { Session, User } from "next-auth";

interface SessionWithRoles extends Session {
  user?: Session["user"] & {
    roles?: unknown;
  };
}

function getSessionRoles(session: Session | null): string[] {
  const user = session?.user;
  if (!user || typeof user !== "object") {
    return [];
  }

  if (!("roles" in user)) {
    return [];
  }

  const rolesValue = (user as { roles?: unknown }).roles;
  if (!Array.isArray(rolesValue)) {
    return [];
  }

  return rolesValue.filter((role): role is string => typeof role === "string");
}

export function useAuth(): {
  user: User | undefined;
  accessToken: string | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | undefined;
} {
  const { data: session, status } = useSession();

  return {
    user: (session?.user as User) ?? undefined,
    accessToken: session?.accessToken,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    error: session?.error,
  };
}

export function useUser(): User | undefined {
  const { data: session } = useSession();
  return (session?.user as User) ?? undefined;
}

export function useHasRole(role: string): boolean {
  const { data: session } = useSession();
  const roles = getSessionRoles(session as SessionWithRoles | null);
  return roles.includes(role);
}

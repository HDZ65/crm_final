"use client";

import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  roles,
  fallbackUrl = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, ready, hasAnyRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.push(fallbackUrl);
    }

    if (ready && isAuthenticated && roles && roles.length > 0) {
      if (!hasAnyRole(roles)) {
        // User doesn't have required roles
        router.push("/unauthorized");
      }
    }
  }, [ready, isAuthenticated, roles, hasAnyRole, router, fallbackUrl]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Vérification de l&apos;authentification...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Redirection vers la connexion...</h2>
        </div>
      </div>
    );
  }

  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Accès non autorisé</h2>
          <p className="mt-2 text-gray-600">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
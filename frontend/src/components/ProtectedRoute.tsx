"use client";

import { useAuth } from "@/hooks/auth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AUTH_URLS } from "@/lib/auth/index";

// =============================================================================
// Types
// =============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  /** Required roles (user must have at least one) */
  roles?: string[];
  /** URL to redirect if not authenticated */
  fallbackUrl?: string;
  /** Custom loading component */
  loadingComponent?: ReactNode;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Client-side route protection wrapper
 * 
 * Note: For better UX, prefer server-side protection via middleware.
 * Use this component for role-based access control.
 * 
 * @example
 * ```tsx
 * <ProtectedRoute roles={['admin']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  roles,
  fallbackUrl = AUTH_URLS.LOGIN,
  loadingComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyRole } = useAuth();
  const router = useRouter();

  const hasRequiredRoles = !roles?.length || hasAnyRole(roles);

  // Handle redirects
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(fallbackUrl);
      return;
    }

    if (!hasRequiredRoles) {
      router.push(AUTH_URLS.UNAUTHORIZED);
    }
  }, [isLoading, isAuthenticated, hasRequiredRoles, router, fallbackUrl]);

  // Loading state
  if (isLoading) {
    return loadingComponent ?? <LoadingScreen message="Verification de l'authentification..." />;
  }

  // Not authenticated - show redirect message
  if (!isAuthenticated) {
    return <LoadingScreen message="Redirection vers la connexion..." />;
  }

  // Missing roles
  if (!hasRequiredRoles) {
    return <UnauthorizedScreen />;
  }

  // Authorized
  return <>{children}</>;
}

// =============================================================================
// Sub-components
// =============================================================================

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function UnauthorizedScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">
          Acces non autorise
        </h2>
        <p className="text-muted-foreground">
          Vous n'avez pas les permissions necessaires pour acceder a cette page.
        </p>
      </div>
    </div>
  );
}

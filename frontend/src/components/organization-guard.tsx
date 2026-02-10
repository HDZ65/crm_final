"use client";

import { useAuth } from "@/hooks/auth";
import { useOrganisation } from "@/contexts/organisation-context";
import { WelcomeForm } from "@/components/welcome-form";

export function OrganizationGuard({ children }: { children: React.ReactNode }) {
    const { ready, isAuthenticated } = useAuth();
    const { hasOrganisation, isLoading, error } = useOrganisation();

    // Not authenticated users pass through (middleware handles redirect to login)
    if (!isAuthenticated && ready) {
        return <>{children}</>;
    }

    // While loading auth or organisation data, render nothing — never expose content
    if (!ready || isLoading) {
        return null;
    }

    // API error: show the welcome form anyway so the user can retry creating an org
    // NEVER fall through to children when we can't confirm organisation membership
    if (error) {
        return (
            <div className="h-screen w-screen fixed inset-0 z-50 bg-background flex items-center justify-center">
                <WelcomeForm />
            </div>
        );
    }

    // User is authenticated but has no organisation — block with welcome form
    if (!hasOrganisation) {
        return (
            <div className="h-screen w-screen fixed inset-0 z-50 bg-background flex items-center justify-center">
                <WelcomeForm />
            </div>
        );
    }

    // User is authenticated AND has an organisation — render the app
    return <>{children}</>;
}

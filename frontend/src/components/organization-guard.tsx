"use client";

import { useAuth } from "@/hooks/auth";
import { useOrganisation } from "@/contexts/organisation-context";
import { WelcomeForm } from "@/components/welcome-form";
import { Loader2 } from "lucide-react";

export function OrganizationGuard({ children }: { children: React.ReactNode }) {
    const { ready, isAuthenticated } = useAuth();
    const { hasOrganisation, isLoading, error } = useOrganisation();

    // Afficher un loader pendant le chargement
    if (!ready || (isAuthenticated && isLoading)) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Si erreur API, afficher quand même le contenu
    if (error) {
        console.error("OrganizationGuard error:", error);
        return <>{children}</>;
    }

    // Afficher le formulaire si l'utilisateur n'a pas d'organisation
    const showWelcome = isAuthenticated && !hasOrganisation;

    return (
        <>
            {children}
            {showWelcome && (
                <div className="h-screen w-screen fixed inset-0 z-50 bg-sidebar/50 backdrop-blur-sm flex items-center justify-center">
                    <WelcomeForm />
                </div>
            )}
        </>
    );
}

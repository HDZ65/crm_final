"use client";

import { ReactNode, useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { GlobalErrorDisplay } from "@/components/error/global-error-display";
import { ConnectionStatus } from "@/components/error/connection-status";
import { useAppStore } from "@/stores/app-store";

type ProvidersProps = {
  children: ReactNode;
};

/**
 * Initialise l'application et les stores
 */
function AppInitializer({ children }: { children: ReactNode }) {
  const setAppReady = useAppStore((state) => state.setAppReady);
  const setInitializing = useAppStore((state) => state.setInitializing);
  const setOnline = useAppStore((state) => state.setOnline);

  useEffect(() => {
    // Marquer l'app comme initialisee
    setInitializing(false);
    setAppReady(true);

    // Ecouter les changements de connexion
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setAppReady, setInitializing, setOnline]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  // Create QueryClient instance once per app (not per render)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AppInitializer>
          {children}
          
          {/* Affichage des erreurs globales */}
          <GlobalErrorDisplay position="top" maxErrors={3} />
          
          {/* Status de connexion (affiche seulement si deconnecte) */}
          <ConnectionStatus showWhenConnected={false} />
          
          {/* Toast notifications */}
          <Toaster richColors position="bottom-right" />
        </AppInitializer>
      </SessionProvider>
    </QueryClientProvider>
  );
}
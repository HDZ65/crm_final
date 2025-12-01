"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (ready) {
      if (isAuthenticated) {
        // Si déjà authentifié, rediriger vers la page principale
        router.push(callbackUrl);
      } else {
        // Sinon, rediriger vers la page de connexion
        router.push(`/login${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
      }
    }
  }, [ready, isAuthenticated, router, callbackUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
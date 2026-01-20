"use client";

import { Suspense, useEffect } from "react";
import { useAuth } from "@/hooks/auth";
import { useRouter, useSearchParams } from "next/navigation";

function AuthContent() {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (ready) {
      if (isAuthenticated) {
        router.push(callbackUrl);
      } else {
        router.push(`/login${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
      }
    }
  }, [ready, isAuthenticated, router, callbackUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center">
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
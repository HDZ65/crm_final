"use client";

/**
 * REST/SSE EXCEPTION — AI Briefing with Server-Sent Events
 *
 * This component intentionally uses REST (fetch + SSE streaming) instead of gRPC because:
 * 1. SSE streaming requires HTTP chunked transfer encoding (text/event-stream)
 * 2. The AI generate endpoint streams tokens progressively via SSE
 * 3. gRPC server streaming is not supported from the browser
 * 4. ReadableStream API is used for real-time token display
 *
 * Documented exception in the REST→gRPC migration (Wave 3 Task 8).
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useOrganisation } from "@/contexts/organisation-context";
import { useAiHealthContext } from "@/contexts/ai-health-context";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GreetingBriefingProps {
  initialKpis: any;
  initialAlertes: any;
}

export function GreetingBriefing({
  initialKpis,
  initialAlertes,
}: GreetingBriefingProps) {
  const { utilisateur } = useOrganisation();
  const { isOnline: isAiHealthy } = useAiHealthContext();
  const [briefing, setBriefing] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get user name with fallback
  const userName = utilisateur?.prenom || utilisateur?.email?.split("@")[0] || "";

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bonjour";
    return "Bonsoir";
  };

  // Generate fallback briefing from KPI data
  const generateFallbackBriefing = useCallback(() => {
    const contratsActifs = initialKpis?.contratsActifs || 0;
    const mrr = initialKpis?.mrr || 0;
    const alertCount = initialAlertes?.alertes?.length || 0;

    let text = `Aujourd'hui : ${contratsActifs} contrats actifs`;
    if (mrr > 0) {
      text += `, MRR à ${mrr.toLocaleString("fr-FR")}€`;
    }
    if (alertCount > 0) {
      text += `, ${alertCount} alerte${alertCount > 1 ? "s" : ""} à traiter`;
    } else {
      text += ", aucune alerte critique";
    }
    return text;
  }, [initialKpis, initialAlertes]);

  // Fetch AI briefing with SSE streaming
  const fetchBriefing = useCallback(async () => {
    // If AI is not healthy, show fallback immediately
    if (!isAiHealthy) {
      setBriefing(generateFallbackBriefing());
      setShowFallback(true);
      return;
    }

    setIsLoading(true);
    setBriefing("");
    setShowFallback(false);

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
      setShowFallback(true);
      setBriefing(generateFallbackBriefing());
      setIsLoading(false);
    }, 10000);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000";
      const url = `${backendUrl}/ai/generate`;

      // Prepare context for AI
      const context = {
        kpis: initialKpis,
        alertes: initialAlertes,
        userName,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: `Génère un briefing quotidien concis pour un manager CRM. Contexte: ${JSON.stringify(context)}`,
          session_id: `briefing-${Date.now()}`,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonData = line.substring(6);
              const data = JSON.parse(jsonData) as { token: string; is_final: boolean };
              fullText += data.token;
              setBriefing(fullText);

              if (data.is_final) {
                clearTimeout(timeoutId);
                setIsLoading(false);
              }
            } catch (err) {
              console.error("Error parsing SSE:", err);
            }
          }
        }
      }

      clearTimeout(timeoutId);
      setIsLoading(false);
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as Error).name !== "AbortError") {
        console.error("Error fetching briefing:", err);
        setShowFallback(true);
        setBriefing(generateFallbackBriefing());
      }
      setIsLoading(false);
    }
  }, [isAiHealthy, initialKpis, initialAlertes, userName, generateFallbackBriefing]);

  // Initial fetch
  useEffect(() => {
    fetchBriefing();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchBriefing]);

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}{userName ? `, ${userName}` : ""}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchBriefing}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* AI Briefing */}
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        {isLoading && !briefing ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {showFallback && (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <span className="text-xs">(Mode hors-ligne)</span>
                </span>
              )}
            </p>
            <p className="text-sm leading-relaxed">
              {briefing || generateFallbackBriefing()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

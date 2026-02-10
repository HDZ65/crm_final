"use client";

import React from "react";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import type { AlertesResponse, Alerte } from "@proto/dashboard/dashboard";

interface AlertBannersProps {
  initialAlertes: AlertesResponse | null;
}

export function AlertBanners({ initialAlertes }: AlertBannersProps) {
  const alertes = initialAlertes?.alertes || [];
  const total = initialAlertes?.total || 0;

  // Show max 5 alerts
  const displayedAlerts = alertes.slice(0, 5);
  const hasMore = total > 5;

  if (alertes.length === 0) {
    return (
      <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-700 dark:text-green-300">
          Aucune alerte — tout va bien ✓
        </AlertDescription>
      </Alert>
    );
  }

  const getAlertIcon = (niveau: string) => {
    switch (niveau) {
      case "critique":
        return <AlertCircle className="h-4 w-4" />;
      case "avertissement":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (niveau: string) => {
    switch (niveau) {
      case "critique":
        return "destructive";
      case "avertissement":
        return "default";
      default:
        return "default";
    }
  };

  const getAlertClassName = (niveau: string) => {
    switch (niveau) {
      case "critique":
        return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900";
      case "avertissement":
        return "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900";
      default:
        return "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900";
    }
  };

  return (
    <div className="space-y-2">
      {displayedAlerts.map((alerte, index) => (
        <Alert
          key={index}
          variant={getAlertVariant(alerte.niveau)}
          className={getAlertClassName(alerte.niveau)}
        >
          {getAlertIcon(alerte.niveau)}
          <AlertTitle className="text-sm font-semibold">
            {alerte.titre}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {alerte.description}
            {alerte.valeurActuelle > 0 && (
              <span className="ml-1 text-muted-foreground">
                (Valeur: {alerte.valeurActuelle.toFixed(1)} / Seuil: {alerte.seuil.toFixed(1)})
              </span>
            )}
            <Link
              href={alerte.entiteId ? `/${alerte.entiteConcernee}/${alerte.entiteId}` : "#"}
              className="ml-2 text-xs underline hover:no-underline"
            >
              Voir détails →
            </Link>
          </AlertDescription>
        </Alert>
      ))}
      {hasMore && (
        <div className="text-center">
          <Link
            href="/alertes"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Voir les {total} alertes
          </Link>
        </div>
      )}
    </div>
  );
}

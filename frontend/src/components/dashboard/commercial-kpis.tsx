"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ShoppingCart, Target, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOrganisation } from "@/contexts/organisation-context";
import { getKpisCommerciaux } from "@/actions/dashboard";
import { AskAiCardButton } from "@/components/dashboard/ask-ai-card-button";
import type { KpisCommerciauxResponse } from "@proto/dashboard/dashboard";

interface KPICard {
  label: string;
  value: number;
  format: "number" | "currency" | "percentage";
  icon: React.ComponentType<{ className?: string }>;
}

function transformKpisToCards(kpis: KpisCommerciauxResponse): KPICard[] {
  return [
    {
      label: "Taux de conversion",
      value: kpis.tauxConversion || 0,
      format: "percentage",
      icon: TrendingUp,
    },
    {
      label: "Panier moyen",
      value: kpis.panierMoyen || 0,
      format: "currency",
      icon: ShoppingCart,
    },
    {
      label: "Prévision CA 3 mois",
      value: kpis.caPrevisionnel3Mois || 0,
      format: "currency",
      icon: Target,
    },
    {
      label: "Nouveaux clients",
      value: kpis.nouveauxClientsMois || 0,
      format: "number",
      icon: Users,
    },
  ];
}

interface CommercialKpisProps {
  /** Initial commercial KPIs data from server */
  initialData?: KpisCommerciauxResponse | null;
}

export function CommercialKpis({ initialData }: CommercialKpisProps) {
  const { activeOrganisation } = useOrganisation();
  const [kpiCards, setKpiCards] = React.useState<KPICard[]>(
    initialData ? transformKpisToCards(initialData) : []
  );
  const [loading, setLoading] = React.useState(!initialData);
  const [error, setError] = React.useState<string | null>(null);
  const hasFetched = React.useRef(!!initialData);

  const fetchKpis = React.useCallback(async () => {
    if (!activeOrganisation) return;

    setLoading(true);
    setError(null);

    const result = await getKpisCommerciaux({
      organisationId: activeOrganisation.organisationId,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setKpiCards(transformKpisToCards(result.data));
    }

    setLoading(false);
  }, [activeOrganisation]);

  // Only fetch client-side if no initial data was provided
  React.useEffect(() => {
    if (!hasFetched.current && activeOrganisation) {
      hasFetched.current = true;
      fetchKpis();
    }
  }, [fetchKpis, activeOrganisation]);

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "number":
      default:
        return new Intl.NumberFormat("fr-FR").format(value);
    }
  };

  const aiPrompt = `Analyse les KPIs commerciaux et propose 3 actions concretes pour augmenter la performance. Donnees: ${kpiCards
    .map((kpi) => `${kpi.label}: ${formatValue(kpi.value, kpi.format)}`)
    .join(" | ")}.`;

  if (!activeOrganisation) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full p-6">
          <p className="text-sm text-muted-foreground">Sélectionnez une organisation</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full gap-3 p-6">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchKpis}>
            <RefreshCw className="size-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <CardTitle className="text-base md:text-lg">KPIs Commerciaux</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <AskAiCardButton prompt={aiPrompt} title="Demander une analyse IA des KPIs commerciaux" />
            <Button variant="ghost" size="icon" onClick={fetchKpis} className="size-8">
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-lg border bg-background p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {kpi.label}
                </span>
                <Icon className="size-4 text-muted-foreground shrink-0" />
              </div>
              <div className={cn("text-lg font-bold tabular-nums")}>
                {formatValue(kpi.value, kpi.format)}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

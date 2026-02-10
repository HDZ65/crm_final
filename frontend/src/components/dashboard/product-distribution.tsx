"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganisation } from "@/contexts/organisation-context";
import { getRepartitionProduits } from "@/actions/dashboard";
import { AskAiCardButton } from "@/components/dashboard/ask-ai-card-button";
import type { RepartitionProduitsResponse, RepartitionProduit } from "@proto/dashboard/dashboard";

interface ProductDistributionProps {
  /** Initial product distribution data from server */
  initialData?: RepartitionProduitsResponse | null;
}

const colorVars = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ProductDistribution({ initialData }: ProductDistributionProps) {
  const { activeOrganisation } = useOrganisation();
  const [produits, setProduits] = React.useState<RepartitionProduit[]>(
    initialData?.produits || []
  );
  const [caTotal, setCaTotal] = React.useState<number>(initialData?.caTotal || 0);
  const [loading, setLoading] = React.useState(!initialData);
  const [error, setError] = React.useState<string | null>(null);
  const hasFetched = React.useRef(!!initialData);

  const fetchData = React.useCallback(async () => {
    if (!activeOrganisation) return;

    setLoading(true);
    setError(null);

    const result = await getRepartitionProduits({
      organisationId: activeOrganisation.organisationId,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setProduits(result.data.produits || []);
      setCaTotal(result.data.caTotal || 0);
    }

    setLoading(false);
  }, [activeOrganisation]);

  // Only fetch client-side if no initial data was provided
  React.useEffect(() => {
    if (!hasFetched.current && activeOrganisation) {
      hasFetched.current = true;
      fetchData();
    }
  }, [fetchData, activeOrganisation]);

  // Format data for chart
  const chartData = React.useMemo(() => {
    return produits.map((p, i) => ({
      name: p.nomProduit,
      value: p.ca,
      fill: colorVars[i % colorVars.length],
      percentage: p.pourcentage,
    }));
  }, [produits]);

  const chartConfig: ChartConfig = {
    value: {
      label: "CA (€)",
    },
  };

  const aiPrompt = `Analyse la repartition du chiffre d'affaires par produit et propose 3 recommandations business. CA total: ${caTotal.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  })}. Produits: ${produits
    .slice(0, 5)
    .map((p) => `${p.nomProduit} (${p.pourcentage.toFixed(1)}%)`)
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
          <Button variant="outline" size="sm" onClick={fetchData}>
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
        <CardContent className="flex items-center justify-center h-[200px]">
          <Skeleton className="h-32 w-32 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (produits.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <CardTitle className="text-base md:text-lg">Répartition par produit</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[200px] gap-2">
          <Package className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground text-center">
            Aucun produit avec CA sur cette période
          </p>
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
              <Package className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <CardTitle className="text-base md:text-lg">Répartition par produit</CardTitle>
              <p className="text-xs text-muted-foreground">
                CA total: {caTotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <AskAiCardButton prompt={aiPrompt} title="Demander une analyse IA de la repartition produit" />
            <Button variant="ghost" size="icon" onClick={fetchData} className="size-8">
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square w-full h-[200px]"
          >
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                        </p>
                        <p className="text-sm font-medium">{data.percentage.toFixed(1)}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Legend */}
          <div className="space-y-2">
            {produits.slice(0, 5).map((produit, index) => (
              <div key={produit.produitId} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: colorVars[index % colorVars.length] }}
                  />
                  <span className="truncate max-w-[150px]" title={produit.nomProduit}>
                    {produit.nomProduit}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{produit.pourcentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

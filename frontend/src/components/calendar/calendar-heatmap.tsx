"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeatmapCellDto } from "@/types/calendar";
import { getVolumeHeatmap } from "@/actions/calendar-admin";
import { cn } from "@/lib/utils";

interface CalendarHeatmapProps {
  organisationId: string;
}

const INTENSITY_COLORS: Record<string, string> = {
  LOW: "bg-green-200 dark:bg-green-900/40",
  MEDIUM: "bg-yellow-200 dark:bg-yellow-900/40",
  HIGH: "bg-orange-300 dark:bg-orange-900/40",
  CRITICAL: "bg-red-400 dark:bg-red-900/60",
};

function formatCurrency(amountCents: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export function CalendarHeatmap({ organisationId }: CalendarHeatmapProps) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [cells, setCells] = useState<HeatmapCellDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHeatmap = useCallback(async () => {
    setLoading(true);
    const result = await getVolumeHeatmap({
      organisationId,
      year,
      month,
      includeForecast: true,
    });
    if (result.data) {
      setCells(result.data.cells);
    }
    setLoading(false);
  }, [organisationId, year, month]);

  useEffect(() => {
    loadHeatmap();
  }, [loadHeatmap]);

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  const groupedByWeek = cells.reduce((acc, cell) => {
    const key = `${cell.weekOfMonth}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(cell);
    return acc;
  }, {} as Record<string, HeatmapCellDto[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Heatmap des volumes</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setYear(year - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[60px] text-center font-medium">{year}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setYear(year + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={month?.toString() || "all"}
              onValueChange={(v) => setMonth(v === "all" ? undefined : parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tous les mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {monthNames.map((name, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? null : cells.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Aucune donnée de volume pour cette période
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Faible</span>
                <div className="flex gap-1">
                  {Object.entries(INTENSITY_COLORS).map(([level, color]) => (
                    <div
                      key={level}
                      className={cn("h-4 w-4 rounded", color)}
                      title={level}
                    />
                  ))}
                </div>
                <span>Critique</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {cells.map((cell, i) => (
                <TooltipProvider key={i}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex h-16 flex-col items-center justify-center rounded-md border p-2 transition-colors",
                          INTENSITY_COLORS[cell.intensityLevel] || "bg-muted",
                          cell.exceedsThreshold && "ring-2 ring-red-500"
                        )}
                      >
                        <span className="text-xs text-muted-foreground">
                          {new Date(cell.date).getDate()}
                        </span>
                        <span className="text-sm font-medium">
                          {cell.transactionCount}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {new Date(cell.date).toLocaleDateString("fr-FR")}
                        </p>
                        <p>{cell.transactionCount} transactions</p>
                        <p>{formatCurrency(cell.totalAmountCents, cell.currency)}</p>
                        {cell.exceedsThreshold && (
                          <p className="text-red-500">Seuil dépassé</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { KPICard } from "@/types/stats"

interface KPICardProps extends KPICard {
  icon?: LucideIcon
}

export function KPICardComponent({ label, value, evolution, format = "number", status = "neutral", icon: Icon }: KPICardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      case "percentage":
        return `${val.toFixed(1)} %`
      case "number":
      default:
        return new Intl.NumberFormat("fr-FR").format(val)
    }
  }

  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    neutral: "text-foreground",
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", statusColors[status])}>
          {formatValue(value)}
        </div>
        {evolution !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {evolution > 0 ? (
              <>
                <TrendingUp className="size-3 text-success" />
                <span className="text-success">+{evolution.toFixed(1)}%</span>
              </>
            ) : evolution < 0 ? (
              <>
                <TrendingDown className="size-3 text-destructive" />
                <span className="text-destructive">{evolution.toFixed(1)}%</span>
              </>
            ) : (
              <span>=</span>
            )}
            <span className="ml-1">vs mois dernier</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

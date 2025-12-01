"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Euro,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
} from "lucide-react"
import type { PaymentStats } from "@/types/payment"
import { cn } from "@/lib/utils"

interface PaymentKPICardsProps {
  stats: PaymentStats
}

export function PaymentKPICards({ stats }: PaymentKPICardsProps) {
  const kpis = [
    {
      title: "Total Paiements",
      value: stats.total_payments.toString(),
      subtitle: `${stats.total_amount.toFixed(2)} €`,
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Payés",
      value: stats.paid_count.toString(),
      subtitle: `${stats.paid_amount.toFixed(2)} €`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      percentage: stats.total_payments > 0
        ? ((stats.paid_count / stats.total_payments) * 100).toFixed(1)
        : "0",
    },
    {
      title: "En Attente",
      value: stats.pending_count.toString(),
      subtitle: `${stats.pending_amount.toFixed(2)} €`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      percentage: stats.total_payments > 0
        ? ((stats.pending_count / stats.total_payments) * 100).toFixed(1)
        : "0",
    },
    {
      title: "Rejets",
      value: stats.rejected_count.toString(),
      subtitle: `${stats.rejected_amount.toFixed(2)} €`,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-500/10",
      percentage: stats.reject_rate.toFixed(1),
      trend: stats.reject_rate > 20 ? "up" : stats.reject_rate < 10 ? "down" : undefined,
    },
    {
      title: "Montant Moyen",
      value: `${stats.average_amount.toFixed(2)} €`,
      subtitle: "Par paiement",
      icon: Euro,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon

        return (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={cn("rounded-lg p-2", kpi.bgColor)}>
                <Icon className={cn("size-4", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  {kpi.percentage && (
                    <div className="flex items-center gap-1">
                      {kpi.trend === "up" && (
                        <TrendingUp className="size-3 text-red-500" />
                      )}
                      {kpi.trend === "down" && (
                        <TrendingDown className="size-3 text-green-500" />
                      )}
                      <span
                        className={cn(
                          "text-xs font-medium",
                          kpi.trend === "up" && "text-red-600",
                          kpi.trend === "down" && "text-green-600",
                          !kpi.trend && "text-muted-foreground"
                        )}
                      >
                        {kpi.percentage}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

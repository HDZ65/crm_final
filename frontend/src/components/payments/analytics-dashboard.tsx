"use client"

import * as React from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AnalyticsEmptyState } from "@/components/payments/empty-states"
import type {
  AnalyticsTimeRange,
  RejectionTrend,
  DayHeatmapEntry,
  ClientScore,
  ForecastVsActual,
} from "@/lib/ui/display-types/payment"

// ---------- Heatmap color utility ----------
function heatmapColor(intensity: DayHeatmapEntry["intensity"]): string {
  switch (intensity) {
    case "high":
      return "bg-red-500/80 dark:bg-red-500/70"
    case "medium":
      return "bg-amber-400/70 dark:bg-amber-400/60"
    case "low":
      return "bg-emerald-400/60 dark:bg-emerald-400/50"
    default:
      return "bg-muted"
  }
}

// ---------- Props ----------
interface AnalyticsDashboardProps {
  societeId: string
}

export function AnalyticsDashboard({ societeId }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = React.useState<AnalyticsTimeRange>("3M")
  const [isLoading, setIsLoading] = React.useState(false)

  // Data arrays — stub (no gRPC call yet), always empty → empty states
  const [rejectionTrends, setRejectionTrends] = React.useState<RejectionTrend[]>([])
  const [heatmapData, setHeatmapData] = React.useState<DayHeatmapEntry[]>([])
  const [clientScores, setClientScores] = React.useState<ClientScore[]>([])
  const [forecastData, setForecastData] = React.useState<ForecastVsActual[]>([])

  // Suppress unused-var warnings for stub setters & props used later
  void societeId
  void isLoading
  void setIsLoading
  void setRejectionTrends
  void setHeatmapData
  void setClientScores
  void setForecastData

  // ---------- Time range selector ----------
  const timeRangeOptions: { value: AnalyticsTimeRange; label: string }[] = [
    { value: "1M", label: "1M" },
    { value: "3M", label: "3M" },
    { value: "6M", label: "6M" },
    { value: "12M", label: "12M" },
  ]

  // ---------- Chart helpers ----------
  const rejectionChartData = React.useMemo(
    () =>
      rejectionTrends.map((t) => ({
        label: `${String(t.month).padStart(2, "0")}/${t.year}`,
        rejectionRate: t.rejectionRate,
      })),
    [rejectionTrends],
  )

  const forecastChartData = React.useMemo(
    () =>
      forecastData.map((f) => ({
        label: `${String(f.month).padStart(2, "0")}/${f.year}`,
        prévu: f.expectedCount,
        réel: f.actualCount,
      })),
    [forecastData],
  )

  return (
    <div className="space-y-4">
      {/* ── Time-range selector ── */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Période :</span>
        <ToggleGroup
          type="single"
          value={timeRange}
          onValueChange={(v) => {
            if (v) setTimeRange(v as AnalyticsTimeRange)
          }}
          variant="outline"
        >
          {timeRangeOptions.map((opt) => (
            <ToggleGroupItem key={opt.value} value={opt.value} className="px-4">
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* ── 2-column chart grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ─── Chart 1 — Rejection Trends ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance des rejets</CardTitle>
          </CardHeader>
          <CardContent>
            {rejectionTrends.length === 0 ? (
              <AnalyticsEmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={rejectionChartData}>
                  <defs>
                    <linearGradient id="fillRejection" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [
                      `${(value ?? 0).toFixed(1)}%`,
                      "Taux de rejet",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="rejectionRate"
                    stroke="var(--color-chart-1)"
                    fill="url(#fillRejection)"
                    name="Taux de rejet"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ─── Chart 2 — Day Heatmap ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Heatmap des jours du mois</CardTitle>
          </CardHeader>
          <CardContent>
            {heatmapData.length === 0 ? (
              <AnalyticsEmptyState />
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {heatmapData.slice(0, 28).map((entry) => (
                  <div
                    key={entry.dayOfMonth}
                    title={`Jour ${entry.dayOfMonth} — ${entry.rejectionRate.toFixed(1)}% rejet (${entry.rejectedCount}/${entry.totalCount})`}
                    className={`flex items-center justify-center rounded-md aspect-square text-xs font-medium ${heatmapColor(entry.intensity)}`}
                  >
                    {entry.dayOfMonth}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Chart 3 — Client Top / Flop ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top / Flop clients</CardTitle>
          </CardHeader>
          <CardContent>
            {clientScores.length === 0 ? (
              <AnalyticsEmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart layout="vertical" data={clientScores}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="clientName"
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [
                      `${(value ?? 0).toFixed(1)}%`,
                      "Taux de réussite",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="successRate"
                    name="Taux de réussite"
                    fill="var(--color-chart-2)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ─── Chart 4 — Forecast vs Actual ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prévisions vs Réalisé</CardTitle>
          </CardHeader>
          <CardContent>
            {forecastData.length === 0 ? (
              <AnalyticsEmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="prévu"
                    name="Prévu"
                    fill="var(--color-chart-3)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="réel"
                    name="Réel"
                    fill="var(--color-chart-4)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

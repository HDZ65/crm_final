"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import type { CAEvolution } from "@/types/stats"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

interface ChartCAEvolutionProps {
  data: CAEvolution[]
}

const chartConfig = {
  ca: {
    label: "CA réalisé",
    color: "var(--chart-1)",
  },
  objectif: {
    label: "Objectif",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartCAEvolution({ data }: ChartCAEvolutionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution du CA</CardTitle>
        <CardDescription>12 mois glissants</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="mois"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => formatCurrency(value as number)}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent className="text-sm font-medium" />} />
            <Line
              dataKey="ca"
              type="monotone"
              stroke="var(--color-ca)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="objectif"
              type="monotone"
              stroke="var(--color-objectif)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import type { CommercialRanking } from "@/types/stats"
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
} from "@/components/ui/chart"

interface ChartCommercialRankingProps {
  data: CommercialRanking[]
  metric?: "ventes" | "ca" | "tauxConversion"
}

const metricLabels = {
  ventes: "Nombre de ventes",
  ca: "Chiffre d'affaires",
  tauxConversion: "Taux de conversion",
}

const chartConfig = {
  value: {
    label: "Valeur",
    color: "var(--chart-1)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

export function ChartCommercialRanking({ data, metric = "ventes" }: ChartCommercialRankingProps) {
  const formatValue = (value: number) => {
    if (metric === "ca") {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }
    if (metric === "tauxConversion") {
      return `${value.toFixed(1)}%`
    }
    return value.toString()
  }

  const formatName = (name: string, index: number) => {
    const medals = ["🥇", "🥈", "🥉"]
    if (index < 3) {
      return `${medals[index]} ${name}`
    }
    return name
  }

  // Sort data by metric
  const sortedData = [...data].sort((a, b) => b[metric] - a[metric]).slice(0, 8)

  const chartData = sortedData.map((item, index) => ({
    name: item.name,
    displayName: formatName(item.name, index),
    value: item[metric],
    rank: index,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classement commerciaux</CardTitle>
        <CardDescription>{metricLabels[metric]}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="displayName"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis dataKey="value" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="value"
              layout="vertical"
              fill="var(--color-value)"
              radius={4}
            >
              <LabelList
                dataKey="displayName"
                position="insideLeft"
                offset={8}
                className="fill-(--color-label)"
                fontSize={12}
                fontWeight={(item: any) => item.rank < 3 ? "bold" : "normal"}
              />
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                fontWeight={(item: any) => item.rank < 3 ? "bold" : "normal"}
                formatter={(value: number) => formatValue(value)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

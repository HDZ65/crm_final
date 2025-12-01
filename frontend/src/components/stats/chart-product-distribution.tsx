"use client"

import { LabelList, Pie, PieChart } from "recharts"
import type { ProductStats } from "@/types/stats"
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

interface ChartProductDistributionProps {
  data: ProductStats[]
}

export function ChartProductDistribution({ data }: ChartProductDistributionProps) {
  const chartData = data.map((item, index) => ({
    product: item.produit,
    ca: item.ca,
    fill: `var(--color-product${index + 1})`,
  }))

  const chartConfig = data.reduce(
    (config, item, index) => {
      const key = `product${index + 1}`
      config[key] = {
        label: item.produit,
        color: `var(--chart-${(index % 5) + 1})`,
      }
      return config
    },
    {
      ca: {
        label: "Chiffre d'affaires",
      },
    } as ChartConfig
  )

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Répartition CA par produit</CardTitle>
        <CardDescription>Distribution du chiffre d&apos;affaires</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="ca" hideLabel />}
            />
            <Pie data={chartData} dataKey="ca">
              <LabelList
                dataKey="product"
                className="fill-background"
                stroke="none"
                fontSize={12}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

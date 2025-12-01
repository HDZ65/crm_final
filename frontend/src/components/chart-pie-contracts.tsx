"use client"

import { Pie, PieChart, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart"

const data = [
  { name: "France Téléphone", value: 6, fill: "hsl(var(--chart-1, 47 95% 53%))" },
  { name: "Mondial TV", value: 9, fill: "hsl(var(--chart-2, 25 95% 65%))" },
  { name: "Action Prévoyance", value: 12, fill: "hsl(var(--chart-3, 350 95% 68%))" },
  { name: "Dépanssur", value: 4, fill: "hsl(var(--chart-4, 200 95% 60%))" },
]

const chartConfig = {
  value: { label: "Contrats" },
} satisfies ChartConfig

export function ChartPieContracts() {
  return (
    <ChartContainer config={chartConfig} className="aspect-square h-[260px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={100}
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

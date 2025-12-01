"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"
import type { CompanyStats } from "@/types/stats"

interface CompanyStatsTableProps {
  data: CompanyStats[]
}

export function CompanyStatsTable({ data }: CompanyStatsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value)
  }

  const getChurnStatus = (rate: number) => {
    if (rate < 5) return { variant: "success" as const, label: "Bon" }
    if (rate < 8) return { variant: "warning" as const, label: "Attention" }
    return { variant: "destructive" as const, label: "Critique" }
  }

  const getImpayesStatus = (rate: number) => {
    if (rate < 3) return { variant: "success" as const, label: "Bon" }
    if (rate < 5) return { variant: "warning" as const, label: "Attention" }
    return { variant: "destructive" as const, label: "Critique" }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Statistiques par société</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-sidebar hover:bg-sidebar">
                <TableHead>Société</TableHead>
                <TableHead className="text-right">Contrats actifs</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">ARR</TableHead>
                <TableHead className="text-right">Nouveaux clients</TableHead>
                <TableHead className="text-right">Taux churn</TableHead>
                <TableHead className="text-right">Taux impayés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((company) => {
                const churnStatus = getChurnStatus(company.tauxChurn)
                const impayesStatus = getImpayesStatus(company.tauxImpayes)

                return (
                  <TableRow key={company.companyId}>
                    <TableCell className="font-medium">
                      {company.companyName}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(company.contratsActifs)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(company.mrr)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(company.arr)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="size-3 text-success" />
                        {formatNumber(company.nouveauxClients)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={churnStatus.variant}>
                        {company.tauxChurn.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={impayesStatus.variant}>
                        {company.tauxImpayes.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

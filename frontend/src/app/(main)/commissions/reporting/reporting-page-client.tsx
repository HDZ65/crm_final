"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, TrendingDown, Download } from "lucide-react"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export function ReportingPageClient() {
  const [periode, setPeriode] = React.useState("2026-02")
  
  // Données mockées
  const kpis = {
    brut: 125000,
    net: 98000,
    reprises: 27000,
    recurrence: 15000,
    tauxReprise: 21.6,
    volume: 45
  }

  const productionData = [
    { produit: "Assurance Vie", montant: 45000 },
    { produit: "Prévoyance", montant: 32000 },
    { produit: "Santé", montant: 28000 },
    { produit: "IARD", montant: 20000 },
  ]

  const trendData = [
    { mois: "Août", brut: 95000, net: 75000, reprises: 20000 },
    { mois: "Sept", brut: 105000, net: 82000, reprises: 23000 },
    { mois: "Oct", brut: 115000, net: 90000, reprises: 25000 },
    { mois: "Nov", brut: 120000, net: 95000, reprises: 25000 },
    { mois: "Déc", brut: 110000, net: 88000, reprises: 22000 },
    { mois: "Jan", brut: 118000, net: 93000, reprises: 25000 },
    { mois: "Fév", brut: 125000, net: 98000, reprises: 27000 },
  ]

  const comparatifs = [
    { periode: "M-1 (Jan 2026)", brut: 118000, delta: "+5.9%" },
    { periode: "M-3 (Nov 2025)", brut: 120000, delta: "+4.2%" },
    { periode: "M-12 (Fév 2025)", brut: 98000, delta: "+27.6%" },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reporting Commissions</h1>
          <p className="text-muted-foreground">Tableau de bord et KPIs</p>
        </div>
        <div className="flex gap-2">
          <Select value={periode} onValueChange={setPeriode}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-02">Février 2026</SelectItem>
              <SelectItem value="2026-01">Janvier 2026</SelectItem>
              <SelectItem value="2025-12">Décembre 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Brute</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.brut.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">Total période</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Nette</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.net.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">Après reprises</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reprises</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.reprises.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">Total reprises</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récurrence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.recurrence.toLocaleString()} €</div>
            <p className="text-xs text-muted-foreground">Commissions récurrentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Reprise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.tauxReprise}%</div>
            <p className="text-xs text-muted-foreground">Reprises / Brut</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Contrats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.volume}</div>
            <p className="text-xs text-muted-foreground">Contrats validés</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Production par Produit</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="produit" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="montant" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendance 7 Mois</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="brut" stroke="hsl(var(--primary))" name="Brut" />
                <Line type="monotone" dataKey="net" stroke="#10b981" name="Net" />
                <Line type="monotone" dataKey="reprises" stroke="#ef4444" name="Reprises" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comparatifs */}
      <Card>
        <CardHeader>
          <CardTitle>Comparatifs Temporels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparatifs.map((comp) => (
              <div key={comp.periode} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{comp.periode}</p>
                  <p className="text-sm text-muted-foreground">{comp.brut.toLocaleString()} €</p>
                </div>
                <div className={`text-sm font-medium ${comp.delta.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {comp.delta}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

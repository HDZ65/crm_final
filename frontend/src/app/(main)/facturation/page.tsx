"use client"

import * as React from "react"
import { Plus, RefreshCw, Download, FileText, Calendar, Euro, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table-basic"
import { columns } from "./columns"
import { toast } from "sonner"
import { useFactures, useStatutFactures } from "@/hooks/factures"
import { useOrganisation } from "@/contexts/organisation-context"
import type { Facture } from "@/types/facture"
import { format } from "date-fns"

export default function FacturationPage() {
  const { activeOrganisation } = useOrganisation()
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Filtres locaux
  const [filters, setFilters] = React.useState({
    numero: "",
    client: "",
    statutId: "",
    dateDebut: "",
    dateFin: "",
  })

  // Filtrer par organisation active
  const apiFilters = React.useMemo(() => ({
    organisationId: activeOrganisation?.id,
  }), [activeOrganisation?.id])

  const { factures, loading, refetch } = useFactures(apiFilters)
  const { statuts } = useStatutFactures()

  // Filtrage côté client
  const filteredFactures = React.useMemo(() => {
    return factures.filter((facture: Facture) => {
      if (filters.numero) {
        if (!facture.numero.toLowerCase().includes(filters.numero.toLowerCase())) {
          return false
        }
      }

      if (filters.client && facture.client) {
        const clientName = `${facture.client.prenom} ${facture.client.nom}`.toLowerCase()
        if (!clientName.includes(filters.client.toLowerCase())) {
          return false
        }
      } else if (filters.client && !facture.client) {
        return false
      }

      if (filters.statutId && filters.statutId !== "all" && facture.statutId !== filters.statutId) {
        return false
      }

      if (filters.dateDebut) {
        const factureDate = new Date(facture.dateEmission)
        const filterDate = new Date(filters.dateDebut)
        if (factureDate < filterDate) {
          return false
        }
      }

      if (filters.dateFin) {
        const factureDate = new Date(facture.dateEmission)
        const filterDate = new Date(filters.dateFin)
        if (factureDate > filterDate) {
          return false
        }
      }

      return true
    })
  }, [factures, filters])

  // Calculs des totaux
  const totals = React.useMemo(() => {
    return filteredFactures.reduce(
      (acc, f) => ({
        ht: acc.ht + (f.montantHT || 0),
        ttc: acc.ttc + (f.montantTTC || 0),
      }),
      { ht: 0, ttc: 0 }
    )
  }, [filteredFactures])

  const handleFilterChange = (field: keyof typeof filters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
    toast.success("Liste actualisée")
  }, [refetch])

  const handleExport = React.useCallback(() => {
    if (filteredFactures.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }

    const headers = ["Numéro", "Date", "Client", "Montant HT", "Montant TTC", "Statut"]
    const rows = filteredFactures.map((f) => [
      f.numero,
      f.dateEmission ? format(new Date(f.dateEmission), "dd/MM/yyyy") : "",
      f.client ? `${f.client.prenom} ${f.client.nom}` : "",
      f.montantHT?.toFixed(2) || "0.00",
      f.montantTTC?.toFixed(2) || "0.00",
      f.statut?.nom || "",
    ])

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `factures_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Export CSV téléchargé")
  }, [filteredFactures])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      <div className="flex flex-col gap-4 min-h-full">
        {/* Card des filtres */}
        <Card className="bg-blue-100 border border-blue-200 shrink-0">
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="N° Facture"
                  className="bg-white pl-10"
                  value={filters.numero}
                  onChange={handleFilterChange("numero")}
                />
              </div>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Client"
                  className="bg-white pl-10"
                  value={filters.client}
                  onChange={handleFilterChange("client")}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
                <Select
                  value={filters.statutId || "all"}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, statutId: value }))}
                >
                  <SelectTrigger className="bg-white w-full pl-10">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {statuts.map((statut) => (
                      <SelectItem key={statut.id} value={statut.id}>
                        {statut.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Date début"
                  className="bg-white pl-10"
                  value={filters.dateDebut}
                  onChange={handleFilterChange("dateDebut")}
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Date fin"
                  className="bg-white pl-10"
                  value={filters.dateFin}
                  onChange={handleFilterChange("dateFin")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card du tableau */}
        <Card className="flex-1 min-h-0 bg-blue-100 border-blue-200 flex flex-col">
          <CardContent className="flex-1 min-h-0 flex flex-col">
            {/* Barre d'actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {filteredFactures.length} facture{filteredFactures.length > 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Total HT:</span>
                  <span className="font-medium">{formatCurrency(totals.ht)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Total TTC:</span>
                  <span className="font-semibold text-blue-700">{formatCurrency(totals.ttc)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button onClick={() => toast.info("Création de facture à venir")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle facture
                </Button>
              </div>
            </div>

            {/* Tableau */}
            <div className="flex-1 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredFactures}
                  headerClassName="bg-sidebar hover:bg-sidebar"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

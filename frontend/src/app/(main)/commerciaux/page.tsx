"use client"

import * as React from "react"
import { Plus, RefreshCw, Upload, Download, User, Mail, Phone, Briefcase, Power } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table-basic"
import { createColumns } from "./columns"
import { toast } from "sonner"
import { CreateCommercialDialog } from "@/components/commerciaux/create-commercial-dialog"
import { ImportCommercialDialog } from "@/components/commerciaux/import-commercial-dialog"
import { useApporteurs } from "@/hooks/commissions/use-apporteurs"
import { useOrganisation } from "@/contexts/organisation-context"
import type { Commercial } from "@/types/commercial"
import { getCommercialFullName, TYPE_COMMERCIAL_LABELS } from "@/types/commercial"

export default function CommerciauxPage() {
  const { activeOrganisation } = useOrganisation()
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Filtres locaux
  const [filters, setFilters] = React.useState({
    nom: "",
    email: "",
    telephone: "",
    typeApporteur: "",
    actif: "",
  })

  // Filtrer par organisation active
  const apiFilters = React.useMemo(() => ({
    organisationId: activeOrganisation?.id,
  }), [activeOrganisation?.id])

  const { apporteurs: commerciaux, loading, refetch } = useApporteurs(apiFilters)

  // Créer les colonnes avec la fonction de rafraîchissement
  const columns = React.useMemo(() => createColumns(refetch), [refetch])

  // Filtrage côté client
  const filteredCommerciaux = React.useMemo(() => {
    return commerciaux.filter((commercial: Commercial) => {
      if (filters.nom) {
        const fullName = getCommercialFullName(commercial).toLowerCase()
        if (!fullName.includes(filters.nom.toLowerCase())) {
          return false
        }
      }

      if (filters.email && commercial.email) {
        if (!commercial.email.toLowerCase().includes(filters.email.toLowerCase())) {
          return false
        }
      } else if (filters.email && !commercial.email) {
        return false
      }

      if (filters.telephone && commercial.telephone) {
        if (!commercial.telephone.includes(filters.telephone)) {
          return false
        }
      } else if (filters.telephone && !commercial.telephone) {
        return false
      }

      if (filters.typeApporteur && filters.typeApporteur !== "all" && commercial.typeApporteur !== filters.typeApporteur) {
        return false
      }

      if (filters.actif && filters.actif !== "all") {
        const isActif = filters.actif === "true"
        if (commercial.actif !== isActif) {
          return false
        }
      }

      return true
    })
  }, [commerciaux, filters])

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
    if (filteredCommerciaux.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }

    const headers = ["Nom", "Prénom", "Type", "Email", "Téléphone", "Actif"]
    const rows = filteredCommerciaux.map((c) => [
      c.nom,
      c.prenom,
      c.typeApporteur,
      c.email || "",
      c.telephone || "",
      c.actif ? "Oui" : "Non",
    ])

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `commerciaux_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Export CSV téléchargé")
  }, [filteredCommerciaux])

  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      <div className="flex flex-col gap-4 min-h-full">
        {/* Card des filtres */}
        <Card className="bg-slate-300 border border-slate-200 shrink-0">
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Nom"
                  className="bg-white pl-10"
                  value={filters.nom}
                  onChange={handleFilterChange("nom")}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Email"
                  type="email"
                  className="bg-white pl-10"
                  value={filters.email}
                  onChange={handleFilterChange("email")}
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Téléphone"
                  className="bg-white pl-10"
                  value={filters.telephone}
                  onChange={handleFilterChange("telephone")}
                />
              </div>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
                <Select
                  value={filters.typeApporteur || "all"}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, typeApporteur: value }))}
                >
                  <SelectTrigger className="bg-white w-full pl-10">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {Object.entries(TYPE_COMMERCIAL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Power className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
                <Select
                  value={filters.actif || "all"}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, actif: value }))}
                >
                  <SelectTrigger className="bg-white w-full pl-10">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="true">Actif</SelectItem>
                    <SelectItem value="false">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card du tableau */}
        <Card className="flex-1 min-h-0 bg-slate-300 border-slate-200 flex flex-col">
          <CardContent className="flex-1 min-h-0 flex flex-col">
            {/* Barre d'actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {filteredCommerciaux.length} commercial{filteredCommerciaux.length > 1 ? "s" : ""}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importer
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau commercial
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
                  data={filteredCommerciaux}
                  headerClassName="bg-sidebar hover:bg-sidebar"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateCommercialDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />

      <ImportCommercialDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={refetch}
      />
    </main>
  )
}

"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/data-table-basic"
import { columns } from "./columns"
import { useClientSearchStore } from "@/stores/client-search-store"
import { useClients, useGroupeEntites, useStatutClients } from "@/hooks/clients"
import { useOrganisation } from "@/contexts/organisation-context"
import { User, Mail, Phone, Building2, CreditCard, Globe, Plus, Shield } from "lucide-react"
import { AddGroupeDialog } from "./add-groupe-dialog"
import { GroupeTab } from "./groupe-tab"

const normalizePhone = (value: string) => value.replace(/\D/g, "")

export default function ClientsPage() {
  const { activeOrganisation } = useOrganisation()
  const { groupes, refetch: refetchGroupes } = useGroupeEntites(activeOrganisation?.id)
  const { statuts } = useStatutClients()
  const [addGroupeOpen, setAddGroupeOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("tous")

  // Utiliser les sélecteurs Zustand pour optimiser les re-renders
  const filters = useClientSearchStore((state) => state.filters)
  const updateFilter = useClientSearchStore((state) => state.updateFilter)

  // Construire les filtres API à partir des filtres UI
  const apiFilters = React.useMemo(() => {
    const result: { organisationId?: string; statutId?: string; societeId?: string } = {}

    // Filtre par organisation (obligatoire pour multi-tenant)
    if (activeOrganisation?.id) {
      result.organisationId = activeOrganisation.id
    }

    // Filtre par statut (utilise directement l'UUID)
    if (filters.clientType) {
      result.statutId = filters.clientType
    }

    // Filtre par société (onglet actif)
    if (activeTab !== "tous") {
      result.societeId = activeTab
    }

    return result
  }, [activeOrganisation?.id, filters.clientType, activeTab])

  // Appel API avec les filtres
  const { clients, error } = useClients(apiFilters)

  const handleFilterChange = (field: keyof typeof filters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateFilter(field, e.target.value)
  }

  const handleSelectChange = (value: string) => {
    updateFilter("clientType", value)
  }

  // Filtrage local pour les champs texte (nom, email, téléphone)
  const filteredClients = React.useMemo(() => {
    return clients.filter((client) => {
      const matchesName = !filters.name || client.name.toLowerCase().includes(filters.name.toLowerCase())
      const matchesEmail = !filters.email || (client.email?.toLowerCase().includes(filters.email.toLowerCase()) ?? false)
      const clientPhone = client.phone ? normalizePhone(client.phone) : ""
      const filterPhone = normalizePhone(filters.phone)
      const matchesPhone = !filters.phone || clientPhone.includes(filterPhone)

      return matchesName && matchesEmail && matchesPhone
    })
  }, [filters.name, filters.email, filters.phone, clients])


  return (
    <main className="flex flex-1 flex-col gap-4 min-h-0">
      <div className="flex flex-col gap-4 min-h-full">
        <Card className="bg-blue-100 border border-blue-200 shrink-0">
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Nom"
                  className="bg-white pl-10"
                  value={filters.name}
                  onChange={handleFilterChange("name")}
                />
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Prénom"
                  className="bg-white pl-10"
                  value={filters.firstName}
                  onChange={handleFilterChange("firstName")}
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
                  value={filters.phone}
                  onChange={handleFilterChange("phone")}
                />
              </div>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Select value={filters.clientType || ""} onValueChange={(value) => handleSelectChange(value === "all" ? "" : value)}>
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
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Société"
                  className="bg-white pl-10"
                  value={filters.company}
                  onChange={handleFilterChange("company")}
                />
              </div>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Iban"
                  className="bg-white pl-10"
                  value={filters.iban}
                  onChange={handleFilterChange("iban")}
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Source"
                  className="bg-white pl-10"
                  value={filters.source}
                  onChange={handleFilterChange("source")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-h-0 bg-blue-100 border-blue-200 flex flex-col">
          <CardContent className="flex-1 min-h-0 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
              <TabsList className="bg-white">
                <TabsTrigger value="tous">Tous les clients</TabsTrigger>
                {groupes.map((groupe) => (
                  <GroupeTab
                    key={groupe.id}
                    id={groupe.id}
                    nom={groupe.nom}
                    onDeleted={refetchGroupes}
                  />
                ))}
                <Button variant="ghost" className="gap-2" onClick={() => setAddGroupeOpen(true)}>
                  <Plus className="size-4" />
                  Ajouter un groupe
                </Button>
                <AddGroupeDialog
                  open={addGroupeOpen}
                  onOpenChange={setAddGroupeOpen}
                  onSuccess={refetchGroupes}
                />
              </TabsList>

              {error ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <p className="text-destructive">Erreur lors du chargement des clients</p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 mt-6">
                  <DataTable
                    columns={columns}
                    data={filteredClients}
                    headerClassName="bg-sidebar hover:bg-sidebar"
                  />
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

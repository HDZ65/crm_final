"use client"

import * as React from "react"
import { CommercialsFilters } from "@/components/commerciaux/commerciaux-filters"
import { CommercialsTable } from "@/components/commerciaux/commerciaux-table"
import { useApporteurs } from "@/hooks/commissions/use-apporteurs"
import { useOrganisation } from "@/contexts/organisation-context"
import type { CommercialFilters, Commercial } from "@/types/commercial"
import { getCommercialFullName } from "@/types/commercial"

export default function CommerciauxPage() {
  const { activeOrganisation } = useOrganisation()
  const [filters, setFilters] = React.useState<CommercialFilters>({})

  // Filtrer par organisation active
  const apiFilters = React.useMemo(() => ({
    organisationId: activeOrganisation?.id,
  }), [activeOrganisation?.id])

  const { apporteurs: commerciaux, loading } = useApporteurs(apiFilters)

  // Filtrage côté client pour les filtres supplémentaires
  const filteredCommerciaux = React.useMemo(() => {
    return commerciaux.filter((commercial: Commercial) => {
      // Filtre par nom (recherche dans nom et prénom)
      if (filters.nom) {
        const fullName = getCommercialFullName(commercial).toLowerCase()
        if (!fullName.includes(filters.nom.toLowerCase())) {
          return false
        }
      }

      // Filtre par email
      if (filters.email && commercial.email) {
        if (!commercial.email.toLowerCase().includes(filters.email.toLowerCase())) {
          return false
        }
      } else if (filters.email && !commercial.email) {
        return false
      }

      // Filtre par téléphone
      if (filters.telephone && commercial.telephone) {
        if (!commercial.telephone.includes(filters.telephone)) {
          return false
        }
      } else if (filters.telephone && !commercial.telephone) {
        return false
      }

      // Filtre par type
      if (filters.typeApporteur && commercial.typeApporteur !== filters.typeApporteur) {
        return false
      }

      // Filtre par statut actif/inactif
      if (filters.actif !== undefined && commercial.actif !== filters.actif) {
        return false
      }

      return true
    })
  }, [commerciaux, filters])

  return (
    <main className="flex flex-1 flex-col">
      <div
        className="min-h-0 flex-1 gap-4 flex flex-col overflow-hidden"
        style={{ height: "calc(100dvh - var(--header-height))" }}
      >
        <CommercialsFilters filters={filters} onFiltersChange={setFilters} />
        <CommercialsTable commerciaux={filteredCommerciaux} isLoading={loading} />
      </div>
    </main>
  )
}

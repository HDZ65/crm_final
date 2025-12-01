"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { PartnersFilters } from "@/components/partners/partners-filters"
import { PartnersTable } from "@/components/partners/partners-table"
import { mockPartners } from "@/data/mock-partner-data"
import type { PartnerFilters } from "@/types/partner"

export default function PartnersPage() {
  const [filters, setFilters] = React.useState<PartnerFilters>({})

  // Filtrer les commerciaux en fonction des filtres actifs
  const filteredPartners = React.useMemo(() => {
    return mockPartners.filter((partner) => {
      if (filters.name && !partner.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false
      }
      if (filters.siren && !partner.siren.includes(filters.siren)) {
        return false
      }
      if (filters.email && !partner.email.toLowerCase().includes(filters.email.toLowerCase())) {
        return false
      }
      // Les filtres phone, company et product nécessiteraient des champs supplémentaires dans le type Partner
      return true
    })
  }, [filters])

  return (
    <main className="flex flex-1 flex-col ">
      <div
        className="min-h-0 flex-1 gap-4 flex flex-col overflow-hidden"
        style={{ height: "calc(100dvh - var(--header-height))" }}
      >
        <PartnersFilters filters={filters} onFiltersChange={setFilters} />
        <PartnersTable partners={filteredPartners} />
      </div>
    </main>
  )
}

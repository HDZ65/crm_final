"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { DateRange } from "react-day-picker"
import { Search, RotateCcw } from "lucide-react"
import type {
  ApporteurResponseDto,
  StatutCommissionResponseDto,
  TypeProduit,
  TypeApporteur,
} from "@/types/commission"

export interface CommissionFiltersState {
  periode?: string
  produit?: TypeProduit | ""
  compagnie?: string
  apporteurId?: string
  statutId?: string
  profileType?: TypeApporteur | ""
  dateDebut?: string
  dateFin?: string
}

interface CommissionFiltersProps {
  filters: CommissionFiltersState
  onFiltersChange: (filters: CommissionFiltersState) => void
  apporteurs?: ApporteurResponseDto[]
  statuts?: StatutCommissionResponseDto[]
  loadingApporteurs?: boolean
  loadingStatuts?: boolean
}

// Labels pour les types de produit
const produitLabels: Record<TypeProduit, string> = {
  telecom: "Télécom",
  assurance_sante: "Santé",
  prevoyance: "Prévoyance",
  energie: "Énergie",
  depanssur: "Dépanssur",
  mondial_tv: "Mondial TV",
  conciergerie: "Conciergerie",
}

// Labels pour les types d'apporteur
const typeApporteurLabels: Record<TypeApporteur, string> = {
  vrp: "VRP",
  manager: "Manager",
  directeur: "Directeur",
  partenaire: "Partenaire",
}

export function CommissionFilters({
  filters,
  onFiltersChange,
  apporteurs = [],
  statuts = [],
  loadingApporteurs = false,
  loadingStatuts = false,
}: CommissionFiltersProps) {
  const handleInputChange =
    (field: keyof CommissionFiltersState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ ...filters, [field]: e.target.value })
    }

  const handleSelectChange =
    (field: keyof CommissionFiltersState) => (value: string) => {
      onFiltersChange({ ...filters, [field]: value === "all" ? "" : value })
    }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    const formatLocalDate = (date: Date | undefined) => {
      if (!date) return ""
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    onFiltersChange({
      ...filters,
      dateDebut: formatLocalDate(range?.from),
      dateFin: formatLocalDate(range?.to),
    })
  }

  const handleReset = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = React.useMemo(() => {
    return Boolean(
      filters.produit ||
      filters.compagnie ||
      filters.apporteurId ||
      filters.statutId ||
      filters.profileType ||
      filters.dateDebut ||
      filters.dateFin
    )
  }, [filters])

  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!filters.dateDebut && !filters.dateFin) return undefined
    return {
      from: filters.dateDebut ? new Date(filters.dateDebut) : undefined,
      to: filters.dateFin ? new Date(filters.dateFin) : undefined,
    }
  }, [filters.dateDebut, filters.dateFin])

  return (
    <div className="shrink-0">
      <div className="flex flex-wrap items-end gap-2">
        {/* Recherche compagnie */}
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher compagnie..."
            value={filters.compagnie || ""}
            onChange={handleInputChange("compagnie")}
            className="h-9 pl-9"
          />
        </div>

        {/* Produit */}
        <Select
          value={filters.produit || "all"}
          onValueChange={handleSelectChange("produit")}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Produit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous produits</SelectItem>
            {(Object.keys(produitLabels) as TypeProduit[]).map((key) => (
              <SelectItem key={key} value={key}>
                {produitLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Apporteur */}
        <Select
          value={filters.apporteurId || "all"}
          onValueChange={handleSelectChange("apporteurId")}
          disabled={loadingApporteurs}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder={loadingApporteurs ? "..." : "Apporteur"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous apporteurs</SelectItem>
            {apporteurs.map((apporteur) => (
              <SelectItem key={apporteur.id} value={apporteur.id}>
                {apporteur.prenom} {apporteur.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Statut */}
        <Select
          value={filters.statutId || "all"}
          onValueChange={handleSelectChange("statutId")}
          disabled={loadingStatuts}
        >
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder={loadingStatuts ? "..." : "Statut"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {statuts.map((statut) => (
              <SelectItem key={statut.id} value={statut.id}>
                {statut.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type profil */}
        <Select
          value={filters.profileType || "all"}
          onValueChange={handleSelectChange("profileType")}
        >
          <SelectTrigger className="h-9 w-[120px]">
            <SelectValue placeholder="Profil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous profils</SelectItem>
            {(Object.keys(typeApporteurLabels) as TypeApporteur[]).map((key) => (
              <SelectItem key={key} value={key}>
                {typeApporteurLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Période de dates */}
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          className="h-9"
        />

        {/* Reset */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 gap-1.5">
            <RotateCcw className="size-4" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  )
}

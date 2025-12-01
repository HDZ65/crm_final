"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import type { StatsFilters } from "@/types/stats"

interface StatsFiltersProps {
  filters: StatsFilters
  onFiltersChange: (filters: StatsFilters) => void
  userRole?: "DIRECTION" | "MANAGER" | "COMMERCIAL" | "ADV"
}

export function StatsFilters({ filters, onFiltersChange, userRole = "DIRECTION" }: StatsFiltersProps) {
  const handleSelectChange = (field: keyof StatsFilters) => (value: string) => {
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

  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!filters.dateDebut && !filters.dateFin) return undefined
    return {
      from: filters.dateDebut ? new Date(filters.dateDebut) : undefined,
      to: filters.dateFin ? new Date(filters.dateFin) : undefined,
    }
  }, [filters.dateDebut, filters.dateFin])

  return (
    <Card className="shrink-0">
      <CardHeader>
        <CardTitle className="text-sm">Filtres</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="periode" className="text-xs text-muted-foreground">Période rapide</Label>
            <Select
              value={filters.periode || "all"}
              onValueChange={handleSelectChange("periode")}
            >
              <SelectTrigger id="periode" className="h-9 w-full">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="mois-en-cours">Mois en cours</SelectItem>
                <SelectItem value="mois-dernier">Mois dernier</SelectItem>
                <SelectItem value="trimestre-en-cours">Trimestre en cours</SelectItem>
                <SelectItem value="annee-en-cours">Année en cours</SelectItem>
                <SelectItem value="12-mois">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userRole === "DIRECTION" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="societe" className="text-xs text-muted-foreground">Société</Label>
              <Select
                value={filters.societe || "all"}
                onValueChange={handleSelectChange("societe")}
              >
                <SelectTrigger id="societe" className="h-9 w-full">
                  <SelectValue placeholder="Toutes les sociétés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sociétés</SelectItem>
                  <SelectItem value="ft">French Telecom</SelectItem>
                  <SelectItem value="mtv">Mondial TV</SelectItem>
                  <SelectItem value="ap">Assurance Plus</SelectItem>
                  <SelectItem value="sfpp">SFPP</SelectItem>
                  <SelectItem value="usgp">USGP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="produit" className="text-xs text-muted-foreground">Produit</Label>
            <Select
              value={filters.produit || "all"}
              onValueChange={handleSelectChange("produit")}
            >
              <SelectTrigger id="produit" className="h-9 w-full">
                <SelectValue placeholder="Tous les produits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                <SelectItem value="Télécom">Télécom</SelectItem>
                <SelectItem value="Énergie">Énergie</SelectItem>
                <SelectItem value="Santé">Santé</SelectItem>
                <SelectItem value="Prévoyance">Prévoyance</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Conciergerie">Conciergerie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="canal" className="text-xs text-muted-foreground">Canal</Label>
            <Select
              value={filters.canal || "all"}
              onValueChange={handleSelectChange("canal")}
            >
              <SelectTrigger id="canal" className="h-9 w-full">
                <SelectValue placeholder="Tous les canaux" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les canaux</SelectItem>
                <SelectItem value="porte-a-porte">Porte-à-porte</SelectItem>
                <SelectItem value="televente">Télévente</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="partenaire">Partenaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dateRange" className="text-xs text-muted-foreground">Période personnalisée</Label>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

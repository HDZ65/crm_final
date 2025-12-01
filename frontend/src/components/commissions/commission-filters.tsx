"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import type {
  ApporteurResponseDto,
  StatutCommissionResponseDto,
  TypeProduit,
  TypeApporteur,
} from "@/types/commission-dto"

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

  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!filters.dateDebut && !filters.dateFin) return undefined
    return {
      from: filters.dateDebut ? new Date(filters.dateDebut) : undefined,
      to: filters.dateFin ? new Date(filters.dateFin) : undefined,
    }
  }, [filters.dateDebut, filters.dateFin])

  return (
    <div className="shrink-0">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="periode" className="text-xs text-muted-foreground">
            Période
          </Label>
          <Input
            id="periode"
            placeholder="Ex: 2024-01"
            value={filters.periode || ""}
            onChange={handleInputChange("periode")}
            className="h-9 w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="produit" className="text-xs text-muted-foreground">
            Produit
          </Label>
          <Select
            value={filters.produit || "all"}
            onValueChange={handleSelectChange("produit")}
          >
            <SelectTrigger id="produit" className="h-9 w-full">
              <SelectValue placeholder="Tous les produits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les produits</SelectItem>
              {(Object.keys(produitLabels) as TypeProduit[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {produitLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="compagnie" className="text-xs text-muted-foreground">
            Compagnie
          </Label>
          <Input
            id="compagnie"
            placeholder="Nom de la compagnie"
            value={filters.compagnie || ""}
            onChange={handleInputChange("compagnie")}
            className="h-9 w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="apporteur" className="text-xs text-muted-foreground">
            Apporteur
          </Label>
          <Select
            value={filters.apporteurId || "all"}
            onValueChange={handleSelectChange("apporteurId")}
            disabled={loadingApporteurs}
          >
            <SelectTrigger id="apporteur" className="h-9 w-full">
              <SelectValue
                placeholder={loadingApporteurs ? "Chargement..." : "Tous les apporteurs"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les apporteurs</SelectItem>
              {apporteurs.map((apporteur) => (
                <SelectItem key={apporteur.id} value={apporteur.id}>
                  {apporteur.prenom} {apporteur.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="statut" className="text-xs text-muted-foreground">
            Statut
          </Label>
          <Select
            value={filters.statutId || "all"}
            onValueChange={handleSelectChange("statutId")}
            disabled={loadingStatuts}
          >
            <SelectTrigger id="statut" className="h-9 w-full">
              <SelectValue
                placeholder={loadingStatuts ? "Chargement..." : "Tous les statuts"}
              />
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profileType" className="text-xs text-muted-foreground">
            Type de profil
          </Label>
          <Select
            value={filters.profileType || "all"}
            onValueChange={handleSelectChange("profileType")}
          >
            <SelectTrigger id="profileType" className="h-9 w-full">
              <SelectValue placeholder="Tous les profils" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les profils</SelectItem>
              {(Object.keys(typeApporteurLabels) as TypeApporteur[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {typeApporteurLabels[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="dateRange" className="text-xs text-muted-foreground">
            Période de dates
          </Label>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </div>
    </div>
  )
}

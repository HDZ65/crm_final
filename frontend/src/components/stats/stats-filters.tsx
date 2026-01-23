"use client"

import * as React from "react"
import { Calendar as CalendarIcon, RotateCcw } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { StatsFilters } from "@/types/stats"

interface StatsFiltersProps {
  filters: StatsFilters
  onFiltersChange: (filters: StatsFilters) => void
  userRole?: "DIRECTION" | "MANAGER" | "COMMERCIAL" | "ADV"
}

// Préréglages de périodes
const PERIOD_PRESETS = [
  { label: "Ce mois", value: "mois-en-cours", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Mois dernier", value: "mois-dernier", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "Ce trimestre", value: "trimestre-en-cours", getRange: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
  { label: "Cette année", value: "annee-en-cours", getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
  { label: "12 derniers mois", value: "12-mois", getRange: () => ({ from: subDays(new Date(), 365), to: new Date() }) },
]

export function StatsFiltersComponent({ filters, onFiltersChange }: StatsFiltersProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelectChange = (field: keyof StatsFilters) => (value: string) => {
    onFiltersChange({ ...filters, [field]: value === "all" ? "" : value })
  }

  const formatLocalDate = (date: Date | undefined) => {
    if (!date) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      periode: "", // Reset preset when custom dates are selected
      dateDebut: formatLocalDate(range?.from),
      dateFin: formatLocalDate(range?.to),
    })
  }

  const handlePresetClick = (preset: typeof PERIOD_PRESETS[0]) => {
    const range = preset.getRange()
    onFiltersChange({
      ...filters,
      periode: preset.value,
      dateDebut: formatLocalDate(range.from),
      dateFin: formatLocalDate(range.to),
    })
    setOpen(false)
  }

  const handleReset = () => {
    onFiltersChange({
      periode: "",
      produit: "",
      canal: "",
      dateDebut: "",
      dateFin: "",
    })
  }

  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!filters.dateDebut && !filters.dateFin) return undefined
    return {
      from: filters.dateDebut ? new Date(filters.dateDebut) : undefined,
      to: filters.dateFin ? new Date(filters.dateFin) : undefined,
    }
  }, [filters.dateDebut, filters.dateFin])

  const hasActiveFilters = Boolean(filters.periode || filters.produit || filters.canal || filters.dateDebut || filters.dateFin)

  // Trouver le label du preset actif
  const activePresetLabel = PERIOD_PRESETS.find(p => p.value === filters.periode)?.label

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Période avec préréglages intégrés */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Période</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left h-9",
                !dateRange && !filters.periode && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {activePresetLabel ? (
                activePresetLabel
              ) : dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd MMM", { locale: fr })} - {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                  </>
                ) : (
                  format(dateRange.from, "dd MMM yyyy", { locale: fr })
                )
              ) : (
                "Sélectionner une période"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex">
              {/* Préréglages à gauche */}
              <div className="border-r p-2 space-y-1">
                {PERIOD_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={filters.periode === preset.value ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              {/* Calendrier à droite */}
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                locale={fr}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Produit */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Produit</Label>
        <Select
          value={filters.produit || "all"}
          onValueChange={handleSelectChange("produit")}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Tous" />
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

      {/* Canal */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Canal</Label>
        <Select
          value={filters.canal || "all"}
          onValueChange={handleSelectChange("canal")}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Tous" />
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

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 gap-1.5">
          <RotateCcw className="size-4" />
          Réinitialiser
        </Button>
      )}
    </div>
  )
}

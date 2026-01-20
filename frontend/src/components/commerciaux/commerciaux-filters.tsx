"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Phone, Briefcase } from "lucide-react"
import type { CommercialFilters, TypeCommercial } from "@/types/commercial"
import { TYPE_COMMERCIAL_LABELS } from "@/types/commercial"

interface CommercialsFiltersProps {
  filters: CommercialFilters
  onFiltersChange: (filters: CommercialFilters) => void
}

export function CommercialsFilters({ filters, onFiltersChange }: CommercialsFiltersProps) {
  const handleInputChange = (field: keyof CommercialFilters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onFiltersChange({
      ...filters,
      [field]: e.target.value,
    })
  }

  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      typeApporteur: value === "all" ? undefined : value as TypeCommercial,
    })
  }

  const handleActifChange = (value: string) => {
    onFiltersChange({
      ...filters,
      actif: value === "all" ? undefined : value === "true",
    })
  }

  return (
    <Card className="bg-slate-300 border border-slate-200 shrink-0">
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Nom"
              className="bg-white pl-10"
              value={filters.nom || ""}
              onChange={handleInputChange("nom")}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Email"
              type="email"
              className="bg-white pl-10"
              value={filters.email || ""}
              onChange={handleInputChange("email")}
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Téléphone"
              className="bg-white pl-10"
              value={filters.telephone || ""}
              onChange={handleInputChange("telephone")}
            />
          </div>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
            <Select value={filters.typeApporteur || "all"} onValueChange={handleTypeChange}>
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
          <Select value={filters.actif === undefined ? "all" : String(filters.actif)} onValueChange={handleActifChange}>
            <SelectTrigger className="bg-white w-full">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="true">Actif</SelectItem>
              <SelectItem value="false">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

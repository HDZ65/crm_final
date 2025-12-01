"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Hash, Mail, Phone, Building2, Package } from "lucide-react"
import type { PartnerFilters } from "@/types/partner"

interface PartnersFiltersProps {
  filters: PartnerFilters
  onFiltersChange: (filters: PartnerFilters) => void
}

export function PartnersFilters({ filters, onFiltersChange }: PartnersFiltersProps) {
  const handleInputChange = (field: keyof PartnerFilters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onFiltersChange({
      ...filters,
      [field]: e.target.value,
    })
  }

  const handleSelectChange = (value: string) => {
    onFiltersChange({
      ...filters,
      product: value,
    })
  }

  return (
    <Card className="bg-slate-300 border border-slate-200 shrink-0">
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Nom"
              className="bg-white pl-10"
              value={filters.name || ""}
              onChange={handleInputChange("name")}
            />
          </div>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="SIREN"
              className="bg-white pl-10"
              value={filters.siren || ""}
              onChange={handleInputChange("siren")}
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
              value={filters.phone || ""}
              onChange={handleInputChange("phone")}
            />
          </div>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Société"
              className="bg-white pl-10"
              value={filters.company || ""}
              onChange={handleInputChange("company")}
            />
          </div>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Select value={filters.product} onValueChange={handleSelectChange}>
              <SelectTrigger className="bg-white w-full pl-10">
                <SelectValue placeholder="Produits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtv">MTV</SelectItem>
                <SelectItem value="sfpp">SFPP</SelectItem>
                <SelectItem value="ft">FT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

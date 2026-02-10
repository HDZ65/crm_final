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
import { Button } from "@/components/ui/button"
import { X, Filter } from "lucide-react"
import type { ProductFilters, ProductType, ProductStatus } from "@/lib/ui/labels/product"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface CatalogueFiltersProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
}

export function CatalogueFilters({ filters, onFiltersChange }: CatalogueFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(true)

  const handleFilterChange = (key: keyof ProductFilters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof ProductFilters]
    return value !== undefined && value !== ""
  })

  return (
    <Card className="border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/50">
              <Filter className="size-4" />
              <span className="font-medium">Filtres</span>
              {hasActiveFilters && (
                <span className="flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {Object.keys(filters).filter((k) => filters[k as keyof ProductFilters]).length}
                </span>
              )}
            </Button>
          </CollapsibleTrigger>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
              <span className="text-xs">Réinitialiser</span>
            </Button>
          )}
        </div>
        <CollapsibleContent>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-xs font-medium text-muted-foreground">
                  Rechercher
                </Label>
                <Input
                  id="search"
                  placeholder="Nom du produit..."
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs font-medium text-muted-foreground">
                  Type
                </Label>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("type", value === "all" ? undefined : (value as ProductType))
                  }
                >
                  <SelectTrigger id="type" className="h-9">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="Interne">Interne</SelectItem>
                    <SelectItem value="Partenaire">Partenaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-medium text-muted-foreground">
                  Catégorie
                </Label>
                <Select
                  value={filters.category || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("category", value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger id="category" className="h-9">
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="Expédition">Expédition</SelectItem>
                    <SelectItem value="Logistique">Logistique</SelectItem>
                    <SelectItem value="Stockage">Stockage</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Emballage">Emballage</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-medium text-muted-foreground">
                  Statut
                </Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "all" ? undefined : (value as ProductStatus))
                  }
                >
                  <SelectTrigger id="status" className="h-9">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="Rupture">Rupture de stock</SelectItem>
                    <SelectItem value="Sur commande">Sur commande</SelectItem>
                    <SelectItem value="Archivé">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minPrice" className="text-xs font-medium text-muted-foreground">
                  Prix min (€)
                </Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPrice" className="text-xs font-medium text-muted-foreground">
                  Prix max (€)
                </Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="10000"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="h-9"
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ShipmentStatus } from "@/types/shipment"
import { Filter, RefreshCw, Search } from "lucide-react"

export type ShipmentStatusOption = {
  value: ShipmentStatus | "all"
  label: string
}

interface ShipmentsFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  companyFilter: string
  onCompanyChange: (value: string) => void
  productFilter: string
  onProductChange: (value: string) => void
  statusFilter: ShipmentStatus | "all"
  onStatusChange: (value: ShipmentStatus | "all") => void
  companies: string[]
  products: string[]
  filteredCount: number
  onReset: () => void
  statusOptions: ShipmentStatusOption[]
}

export function ShipmentsFilters({
  searchTerm,
  onSearchChange,
  companyFilter,
  onCompanyChange,
  productFilter,
  onProductChange,
  statusFilter,
  onStatusChange,
  companies,
  products,
  filteredCount,
  onReset,
  statusOptions,
}: ShipmentsFiltersProps) {
  return (
    <Card className="h-full bg-blue-100 border-blue-200">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary-foreground">
            <Filter className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base font-semibold">Filtres expéditions</CardTitle>
            <CardDescription>Affinez la liste des commandes par société, produit ou statut.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="shipments-search">Recherche rapide</Label>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="shipments-search"
              placeholder="Numéro de commande, suivi ou client"
              className="pl-9"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 max-lg:flex-col">
          <div className="space-y-2">
            <Label htmlFor="shipments-company">Société</Label>
            <Select value={companyFilter} onValueChange={onCompanyChange}>
              <SelectTrigger id="shipments-company">
                <SelectValue placeholder="Toutes les sociétés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sociétés</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipments-product">Produit</Label>
            <Select value={productFilter} onValueChange={onProductChange}>
              <SelectTrigger id="shipments-product">
                <SelectValue placeholder="Tous les produits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product} value={product}>
                    {product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipments-status">Statut</Label>
            <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as ShipmentStatus | "all")}>
              <SelectTrigger id="shipments-status">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">{filteredCount} résultat(s) affiché(s).</div>
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1">
            <RefreshCw className="size-4" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

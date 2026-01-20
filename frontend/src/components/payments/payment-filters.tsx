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
import type { PaymentFilters, PaymentStatus, PaymentMethod, PSPProvider, DebitLot, RiskTier, SourceChannel } from "@/types/payment"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface PaymentFiltersComponentProps {
  filters: PaymentFilters
  onFiltersChange: (filters: PaymentFilters) => void
}

export function PaymentFiltersComponent({ filters, onFiltersChange }: PaymentFiltersComponentProps) {
  const [isOpen, setIsOpen] = React.useState(true)

  const handleFilterChange = (key: keyof PaymentFilters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof PaymentFilters]
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
                  {Object.keys(filters).filter((k) => filters[k as keyof PaymentFilters]).length}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {/* Recherche globale */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-xs font-medium text-muted-foreground">
                  Rechercher
                </Label>
                <Input
                  id="search"
                  placeholder="Client, contrat, référence..."
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Société */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-xs font-medium text-muted-foreground">
                  Société
                </Label>
                <Select
                  value={filters.company || "all"}
                  onValueChange={(value) => handleFilterChange("company", value === "all" ? undefined : value)}
                >
                  <SelectTrigger id="company" className="h-9">
                    <SelectValue placeholder="Toutes les sociétés" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sociétés</SelectItem>
                    <SelectItem value="France Téléphone">France Téléphone</SelectItem>
                    <SelectItem value="Mondial TV">Mondial TV</SelectItem>
                    <SelectItem value="Action Prévoyance">Action Prévoyance</SelectItem>
                    <SelectItem value="Dépanssur">Dépanssur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Statut */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-medium text-muted-foreground">
                  Statut
                </Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "all" ? undefined : (value as PaymentStatus))
                  }
                >
                  <SelectTrigger id="status" className="h-9">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="SUBMITTED">Soumis</SelectItem>
                    <SelectItem value="PAID">Payé</SelectItem>
                    <SelectItem value="REJECT_INSUFF_FUNDS">Rejet insuff. fonds</SelectItem>
                    <SelectItem value="REJECT_OTHER">Rejet autre</SelectItem>
                    <SelectItem value="REFUNDED">Remboursé</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* PSP */}
              <div className="space-y-2">
                <Label htmlFor="psp" className="text-xs font-medium text-muted-foreground">
                  PSP
                </Label>
                <Select
                  value={filters.psp_provider || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("psp_provider", value === "all" ? undefined : (value as PSPProvider))
                  }
                >
                  <SelectTrigger id="psp" className="h-9">
                    <SelectValue placeholder="Tous les PSP" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les PSP</SelectItem>
                    <SelectItem value="Slimpay">Slimpay</SelectItem>
                    <SelectItem value="MultiSafepay">MultiSafepay</SelectItem>
                    <SelectItem value="Emerchantpay">Emerchantpay</SelectItem>
                    <SelectItem value="GoCardless">GoCardless</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lot */}
              <div className="space-y-2">
                <Label htmlFor="lot" className="text-xs font-medium text-muted-foreground">
                  Lot
                </Label>
                <Select
                  value={filters.debit_lot || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("debit_lot", value === "all" ? undefined : (value as DebitLot))
                  }
                >
                  <SelectTrigger id="lot" className="h-9">
                    <SelectValue placeholder="Tous les lots" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les lots</SelectItem>
                    <SelectItem value="L1">Lot 1 (L1)</SelectItem>
                    <SelectItem value="L2">Lot 2 (L2)</SelectItem>
                    <SelectItem value="L3">Lot 3 (L3)</SelectItem>
                    <SelectItem value="L4">Lot 4 (L4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mode de paiement */}
              <div className="space-y-2">
                <Label htmlFor="payment_method" className="text-xs font-medium text-muted-foreground">
                  Mode de paiement
                </Label>
                <Select
                  value={filters.payment_method || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("payment_method", value === "all" ? undefined : (value as PaymentMethod))
                  }
                >
                  <SelectTrigger id="payment_method" className="h-9">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="SEPA">SEPA</SelectItem>
                    <SelectItem value="CB">Carte Bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Niveau de risque */}
              <div className="space-y-2">
                <Label htmlFor="risk_tier" className="text-xs font-medium text-muted-foreground">
                  Niveau de risque
                </Label>
                <Select
                  value={filters.risk_tier || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("risk_tier", value === "all" ? undefined : (value as RiskTier))
                  }
                >
                  <SelectTrigger id="risk_tier" className="h-9">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="LOW">Faible</SelectItem>
                    <SelectItem value="MEDIUM">Moyen</SelectItem>
                    <SelectItem value="HIGH">Élevé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Canal d'acquisition */}
              <div className="space-y-2">
                <Label htmlFor="source_channel" className="text-xs font-medium text-muted-foreground">
                  Canal
                </Label>
                <Select
                  value={filters.source_channel || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("source_channel", value === "all" ? undefined : (value as SourceChannel))
                  }
                >
                  <SelectTrigger id="source_channel" className="h-9">
                    <SelectValue placeholder="Tous les canaux" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les canaux</SelectItem>
                    <SelectItem value="TERRAIN">Terrain</SelectItem>
                    <SelectItem value="TELEFILTRAGE">Télévente</SelectItem>
                    <SelectItem value="INTERNET">Internet</SelectItem>
                    <SelectItem value="PARTENAIRE">Partenaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date début */}
              <div className="space-y-2">
                <Label htmlFor="date_from" className="text-xs font-medium text-muted-foreground">
                  Date début
                </Label>
                <Input
                  id="date_from"
                  type="date"
                  value={filters.date_from || ""}
                  onChange={(e) => handleFilterChange("date_from", e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Date fin */}
              <div className="space-y-2">
                <Label htmlFor="date_to" className="text-xs font-medium text-muted-foreground">
                  Date fin
                </Label>
                <Input
                  id="date_to"
                  type="date"
                  value={filters.date_to || ""}
                  onChange={(e) => handleFilterChange("date_to", e.target.value)}
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

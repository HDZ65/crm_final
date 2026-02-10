"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  MoreVertical,
  Settings as SettingsIcon,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Produit } from "@proto/products/products"
import { CATEGORIE_PRODUIT_LABELS } from "@/lib/ui/labels/product"
import type { ProductCategory } from "@/lib/ui/labels/product"

interface ProductTableProps {
  products: Produit[]
  onViewDetails: (product: Produit) => void
  onAddToCart: (product: Produit) => void
  selectedCategory: ProductCategory | "all"
  onCategoryChange: (category: ProductCategory | "all") => void
  categoryCounts: Record<ProductCategory | "all", number>
}

const categories: Array<{ value: ProductCategory | "all"; label: string }> = [
  { value: "all", label: "Tous les risques" },
  { value: "Assistance", label: "Assistance" },
  { value: "Bleulec", label: "Bleulec" },
  { value: "Bleulec Assur", label: "Bleulec Assur" },
  { value: "Décès toutes causes", label: "Décès toutes causes" },
  { value: "Dépendance", label: "Dépendance" },
  { value: "Garantie des accidents de la vie", label: "Garantie des accidents de la vie" },
  { value: "Multirisques habitation", label: "Multirisques habitation" },
  { value: "Obsèque", label: "Obsèque" },
  { value: "Protection juridique", label: "Protection juridique" },
  { value: "Santé", label: "Santé" },
]

export function ProductTable({
  products,
  onViewDetails,
  selectedCategory,
  onCategoryChange,
  categoryCounts,
}: ProductTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredProducts = products.filter(
    (product) =>
      searchQuery === "" ||
      product.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col bg-background border-r">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">Produits</h2>
          <p className="text-xs text-muted-foreground">
            {filteredProducts.length} sur {products.length}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Category Selector */}
      <div className="p-2 border-b md:hidden">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label} ({categoryCounts[cat.value]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
      </div>

      {/* Products List */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucun produit trouvé
            </div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onViewDetails(product)}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left hover:bg-accent"
              >
                {/* Status indicator and icon */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <SettingsIcon className="h-3.5 w-3.5" />
                  </div>
                  {/* Status dot */}
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      product.actif ? "bg-green-500" : "bg-gray-400"
                    )}
                    title={product.actif ? "Disponible" : "Archivé"}
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate">
                        {product.nom}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product.sku}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">
                      {product.prix.toFixed(2)} {product.devise || "EUR"}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

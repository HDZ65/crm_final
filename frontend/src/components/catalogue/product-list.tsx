"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Eye,
  ShoppingCart,
  Search,
  Package2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { Product, ProductStatus, ProductType, ProductCategory } from "@/types/product"

interface ProductListProps {
  products: Product[]
  onViewDetails: (product: Product) => void
  onAddToCart: (product: Product) => void
  selectedCategory: ProductCategory | "all"
  onCategoryChange: (category: ProductCategory | "all") => void
  categoryCounts: Record<ProductCategory | "all", number>
}

const statusColors: Record<ProductStatus, string> = {
  Disponible: "bg-green-500/10 text-green-700 border-green-200",
  Rupture: "bg-red-500/10 text-red-700 border-red-200",
  "Sur commande": "bg-orange-500/10 text-orange-700 border-orange-200",
  Archivé: "bg-gray-500/10 text-gray-700 border-gray-200",
}

const typeColors: Record<ProductType, string> = {
  Interne: "bg-blue-500/10 text-blue-700 border-blue-200",
  Partenaire: "bg-purple-500/10 text-purple-700 border-purple-200",
}

export function ProductList({
  products,
  onViewDetails,
  onAddToCart,
  selectedCategory,
  onCategoryChange,
  categoryCounts,
}: ProductListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [sortBy, setSortBy] = React.useState<string>("name")
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // Filter and sort products
  const filteredAndSortedProducts = React.useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter

      const matchesType = typeFilter === "all" || product.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "fr-FR")
        case "price-asc":
          return a.price - b.price
        case "price-desc":
          return b.price - a.price
        case "stock":
          return (b.stock || 0) - (a.stock || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [products, searchQuery, statusFilter, typeFilter, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage)
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, typeFilter, sortBy])

  return (
    <div className="flex flex-col h-full">
      {/* Header with filters and search */}
      <div className="p-4 border-b bg-background space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Produits</h2>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedProducts.length} produit
              {filteredAndSortedProducts.length > 1 ? "s" : ""} trouvé
              {filteredAndSortedProducts.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Mobile Category Selector - Only visible on mobile */}
        <div className="lg:hidden">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Tous les risques ({categoryCounts.all})
              </SelectItem>
              <SelectItem value="Assistance">
                Assistance ({categoryCounts.Assistance})
              </SelectItem>
              <SelectItem value="Bleulec">
                Bleulec ({categoryCounts.Bleulec})
              </SelectItem>
              <SelectItem value="Bleulec Assur">
                Bleulec Assur ({categoryCounts["Bleulec Assur"]})
              </SelectItem>
              <SelectItem value="Décès toutes causes">
                Décès toutes causes ({categoryCounts["Décès toutes causes"]})
              </SelectItem>
              <SelectItem value="Dépendance">
                Dépendance ({categoryCounts.Dépendance})
              </SelectItem>
              <SelectItem value="Garantie des accidents de la vie">
                Garantie des accidents de la vie ({categoryCounts["Garantie des accidents de la vie"]})
              </SelectItem>
              <SelectItem value="Multirisques habitation">
                Multirisques habitation ({categoryCounts["Multirisques habitation"]})
              </SelectItem>
              <SelectItem value="Obsèque">
                Obsèque ({categoryCounts.Obsèque})
              </SelectItem>
              <SelectItem value="Protection juridique">
                Protection juridique ({categoryCounts["Protection juridique"]})
              </SelectItem>
              <SelectItem value="Santé">
                Santé ({categoryCounts.Santé})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Disponible">Disponible</SelectItem>
              <SelectItem value="Rupture">Rupture</SelectItem>
              <SelectItem value="Sur commande">Sur commande</SelectItem>
              <SelectItem value="Archivé">Archivé</SelectItem>
            </SelectContent>
          </Select>

          {/* Type filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Interne">Interne</SelectItem>
              <SelectItem value="Partenaire">Partenaire</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort and view options */}
        <div className="flex items-center justify-between">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom (A-Z)</SelectItem>
              <SelectItem value="price-asc">Prix croissant</SelectItem>
              <SelectItem value="price-desc">Prix décroissant</SelectItem>
              <SelectItem value="stock">Stock disponible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {paginatedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-sm text-muted-foreground">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </div>
          ) : (
            paginatedProducts.map((product) => (
              <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Product image placeholder */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package2 className="h-8 w-8 text-muted-foreground" />
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1 truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          SKU: {product.sku}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold">
                          {product.price.toFixed(2)} {product.currency}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>

                    {/* Badges and metadata */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className={cn("border", typeColors[product.type as keyof typeof typeColors])}
                      >
                        {product.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn("border", statusColors[product.status as keyof typeof statusColors])}
                      >
                        {product.status}
                      </Badge>
                      {product.supplier && (
                        <Badge variant="outline" className="border-gray-200">
                          {product.supplier}
                        </Badge>
                      )}
                      {product.stock !== undefined && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "border",
                            product.stock < 50
                              ? "bg-orange-500/10 text-orange-700 border-orange-200"
                              : "border-gray-200"
                          )}
                        >
                          <Package2 className="h-3 w-3 mr-1" />
                          Stock: {product.stock}
                        </Badge>
                      )}
                      {product.minQuantity && (
                        <Badge variant="outline" className="border-gray-200">
                          Min: {product.minQuantity}
                        </Badge>
                      )}
                    </div>

                    {/* Low stock warning */}
                    {product.stock !== undefined && product.stock < 50 && (
                      <div className="flex items-center gap-2 text-sm text-orange-600 mb-3">
                        <AlertCircle className="h-4 w-4" />
                        <span>Stock faible</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(product)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Détails
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onAddToCart(product)}
                        disabled={product.status === "Rupture"}
                        className="gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {product.status === "Sur commande"
                          ? "Commander"
                          : "Ajouter"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t bg-background">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-9"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

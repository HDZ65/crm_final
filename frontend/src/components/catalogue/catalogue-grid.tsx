"use client"

import * as React from "react"
import { ProductCard } from "./product-card"
import type { Product } from "@/types/product"
import { Card, CardContent } from "@/components/ui/card"
import { Package, Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CatalogueGridProps {
  products: Product[]
  onViewDetails?: (product: Product) => void
  onAddToCart?: (product: Product) => void
}

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 36, 48]

export function CatalogueGrid({ products, onViewDetails, onAddToCart }: CatalogueGridProps) {
  const [itemsPerPage, setItemsPerPage] = React.useState(12)
  const [currentPage, setCurrentPage] = React.useState(1)

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(products.length / itemsPerPage)

  // Obtenir les produits de la page actuelle
  const currentProducts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return products.slice(startIndex, endIndex)
  }, [products, currentPage, itemsPerPage])

  // Réinitialiser à la page 1 quand les produits changent
  React.useEffect(() => {
    setCurrentPage(1)
  }, [products])

  // Réinitialiser à la page 1 quand on change le nombre d'items par page
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1)
  }

  if (products.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec compteur et options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="size-4" />
          <span>
            {products.length} produit{products.length > 1 ? "s" : ""}
            {totalPages > 1 && (
              <>
                {" "}
                • Page {currentPage} sur {totalPages}
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Afficher:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grille de produits */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onViewDetails={onViewDetails}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="gap-1"
          >
            <ChevronLeft className="size-4" />
            Précédent
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Afficher toutes les pages si <= 7, sinon afficher avec ellipsis
              const shouldShow =
                totalPages <= 7 ||
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1

              if (!shouldShow) {
                // Afficher ellipsis une seule fois
                if (page === 2 && currentPage > 3) {
                  return (
                    <span key={page} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  )
                }
                if (page === totalPages - 1 && currentPage < totalPages - 2) {
                  return (
                    <span key={page} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  )
                }
                return null
              }

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="min-w-[2.25rem]"
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="gap-1"
          >
            Suivant
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Package2,
  ShoppingCart,
  MoreVertical,
  Search,
  Settings,
  AlertCircle,
  Euro,
  Box,
  User,
  Calendar,
  Hash,
} from "lucide-react"
import type { Product, ProductStatus, ProductType } from "@/types/product"

interface ProductDetailsPanelProps {
  product: Product | null
  onAddToCart: (product: Product) => void
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

export function ProductDetailsPanel({
  product,
  onAddToCart,
}: ProductDetailsPanelProps) {
  if (!product) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Empty State Header */}
        <div className="p-3 border-b flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Détails du produit
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Package2 className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Aucun produit sélectionné
              </p>
              <p className="text-xs text-muted-foreground/60">
                Sélectionnez un produit pour voir ses détails
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground truncate">
          {product.name}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Product Image */}
          <div className="flex items-center justify-center h-32 bg-muted rounded-lg">
            <Package2 className="h-12 w-12 text-muted-foreground" />
          </div>

          {/* Product Name and Price */}
          <div className="space-y-3">
            <div>
              <h1 className="text-xl font-semibold leading-tight">
                {product.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Réf: {product.sku}
              </p>
            </div>
            <div className="flex items-baseline gap-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <span className="text-3xl font-bold text-primary">
                {product.price.toFixed(2)}
              </span>
              <span className="text-lg text-muted-foreground">
                {product.currency}
              </span>
              <span className="text-sm text-muted-foreground ml-auto">
                / mois
              </span>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
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
          </div>

          {/* Low Stock Warning */}
          {product.stock !== undefined && product.stock < 50 && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-900">
                  Stock faible
                </p>
                <p className="text-xs text-orange-700">
                  Seulement {product.stock} unité(s) disponible(s)
                </p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {(product.stock !== undefined || product.minQuantity) && (
            <div className="grid grid-cols-2 gap-3">
              {product.stock !== undefined && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Stock disponible
                  </p>
                  <p className="text-lg font-bold">{product.stock}</p>
                </div>
              )}
              {product.minQuantity && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Quantité min.
                  </p>
                  <p className="text-lg font-bold">{product.minQuantity}</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Informations</h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">SKU</p>
                  <p className="text-sm font-medium truncate">{product.sku}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Box className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Catégorie</p>
                  <p className="text-sm font-medium">{product.category}</p>
                </div>
              </div>

              {product.stock !== undefined && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Package2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Stock</p>
                    <p className="text-sm font-medium">
                      {product.stock} unité(s)
                    </p>
                  </div>
                </div>
              )}

              {product.minQuantity && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Box className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Quantité minimum
                    </p>
                    <p className="text-sm font-medium">{product.minQuantity}</p>
                  </div>
                </div>
              )}

              {product.supplier && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Fournisseur</p>
                    <p className="text-sm font-medium">{product.supplier}</p>
                  </div>
                </div>
              )}

              {product.createdAt && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Créé le</p>
                    <p className="text-sm font-medium">
                      {new Date(product.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => onAddToCart(product)}
          disabled={product.status === "Rupture"}
        >
          <ShoppingCart className="h-4 w-4" />
          {product.status === "Sur commande" ? "Commander" : "Ajouter au panier"}
        </Button>
        <Button variant="outline" className="w-full" size="lg">
          Voir les détails complets
        </Button>
      </div>
    </div>
  )
}

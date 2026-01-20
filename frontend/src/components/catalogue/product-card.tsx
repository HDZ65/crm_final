"use client"

import * as React from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package,
  Building2,
  ShoppingCart,
  Eye,
  Tag,
  TrendingUp,
  Archive,
  AlertCircle,
} from "lucide-react"
import type { Product } from "@/types/product"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProductCardProps {
  product: Product
  onViewDetails?: (product: Product) => void
  onAddToCart?: (product: Product) => void
}

const statusConfig = {
  Disponible: {
    variant: "default" as const,
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  Rupture: {
    variant: "destructive" as const,
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
  "Sur commande": {
    variant: "secondary" as const,
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  },
  Archivé: {
    variant: "outline" as const,
    className: "bg-muted/50 text-muted-foreground border-border",
  },
}

const typeConfig = {
  Interne: {
    icon: Building2,
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  Partenaire: {
    icon: Package,
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
}

export function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps) {
  const statusStyle = statusConfig[product.status as keyof typeof statusConfig]
  const typeStyle = typeConfig[product.type as keyof typeof typeConfig] || typeConfig.Interne
  const TypeIcon = typeStyle.icon

  const isAvailable = product.status === "Disponible"
  const isLowStock = product.stock !== undefined && product.stock < 50

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
      {/* Header avec type et statut */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{product.sku}</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={typeStyle.className}>
                  <TypeIcon className="size-3 mr-1" />
                  <span className="text-[10px] font-medium">{product.type}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {product.type === "Interne" ? "Produit interne" : `Fourni par ${product.supplier}`}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      {/* Contenu */}
      <CardContent className="pb-3 space-y-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{product.description}</p>

        {/* Catégorie et tags */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px] font-normal">
            {product.category}
          </Badge>
          {product.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] font-normal">
              <Tag className="size-2.5 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>

        {/* Informations supplémentaires */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          {product.supplier && (
            <div className="flex items-center gap-1.5">
              <Building2 className="size-3.5 shrink-0" />
              <span className="truncate">{product.supplier}</span>
            </div>
          )}
          {product.stock !== undefined && (
            <div className="flex items-center gap-1.5">
              {isLowStock ? (
                <AlertCircle className="size-3.5 shrink-0 text-orange-500" />
              ) : (
                <Archive className="size-3.5 shrink-0" />
              )}
              <span className={isLowStock ? "text-orange-600 dark:text-orange-500 font-medium" : ""}>
                Stock: {product.stock} unités
              </span>
            </div>
          )}
          {product.minQuantity && product.minQuantity > 1 && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 shrink-0" />
              <span>Qté min: {product.minQuantity}</span>
            </div>
          )}
        </div>

        {/* Prix et statut */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                {product.price.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">{product.currency}</span>
            </div>
            {product.minQuantity && product.minQuantity > 1 && (
              <p className="text-[10px] text-muted-foreground">
                par lot de {product.minQuantity}
              </p>
            )}
          </div>
          <Badge variant="outline" className={statusStyle.className}>
            {product.status}
          </Badge>
        </div>
      </CardContent>

      {/* Footer avec actions */}
      <CardFooter className="pt-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onViewDetails?.(product)}
        >
          <Eye className="size-3.5" />
          <span>Détails</span>
        </Button>
        <Button
          size="sm"
          className="flex-1 gap-1.5"
          disabled={!isAvailable}
          onClick={() => onAddToCart?.(product)}
        >
          <ShoppingCart className="size-3.5" />
          <span>{isAvailable ? "Commander" : "Indisponible"}</span>
        </Button>
      </CardFooter>

      {/* Badge de stock faible */}
      {isLowStock && isAvailable && (
        <div className="absolute top-2 left-2">
          <Badge variant="destructive" className="text-[10px] gap-1">
            <AlertCircle className="size-2.5" />
            Stock faible
          </Badge>
        </div>
      )}
    </Card>
  )
}

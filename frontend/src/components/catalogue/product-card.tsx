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
} from "lucide-react"
import type { Produit } from "@proto/products/products"
import { TypeProduit } from "@proto/products/products"
import { TYPE_PRODUIT_LABELS, CATEGORIE_PRODUIT_LABELS } from "@/lib/ui/labels/product"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProductCardProps {
  product: Produit
  onViewDetails?: (product: Produit) => void
  onAddToCart?: (product: Produit) => void
}

const statusConfig = {
  Disponible: {
    variant: "default" as const,
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  Archivé: {
    variant: "outline" as const,
    className: "bg-muted/50 text-muted-foreground border-border",
  },
}

const typeConfig: Record<number, { icon: typeof Building2; className: string }> = {
  [TypeProduit.INTERNE]: {
    icon: Building2,
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  [TypeProduit.PARTENAIRE]: {
    icon: Package,
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
}

export function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps) {
  const statusLabel = product.actif ? "Disponible" : "Archivé"
  const statusStyle = statusConfig[statusLabel]
  const typeStyle = typeConfig[product.type] || typeConfig[TypeProduit.INTERNE]
  const TypeIcon = typeStyle.icon
  const typeLabel = TYPE_PRODUIT_LABELS[product.type] || "Interne"

  const isAvailable = product.actif

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
      {/* Header avec type et statut */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {product.nom}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{product.sku}</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className={typeStyle.className}>
                  <TypeIcon className="size-3 mr-1" />
                  <span className="text-[10px] font-medium">{typeLabel}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {product.type === TypeProduit.INTERNE ? "Produit interne" : "Produit partenaire"}
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

        {/* Catégorie */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px] font-normal">
            {CATEGORIE_PRODUIT_LABELS[product.categorie]}
          </Badge>
        </div>

        {/* Prix et statut */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                {product.prix.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">{product.devise || "EUR"}</span>
            </div>
          </div>
          <Badge variant="outline" className={statusStyle.className}>
            {statusLabel}
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
    </Card>
  )
}

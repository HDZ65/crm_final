"use client"

import * as React from "react"
import { CategorySidebar } from "@/components/catalogue/category-sidebar"
import { ProductTable } from "@/components/catalogue/product-table"
import { ProductDetailsPanel } from "@/components/catalogue/product-details-panel"
import { mockProducts } from "@/data/mock-product-data"
import type { Product, ProductCategory } from "@/types/product"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"

const categoryCounts: Record<ProductCategory | "all", number> = {
  all: mockProducts.length,
  Assistance: mockProducts.filter(p => p.category === "Assistance").length,
  Bleulec: mockProducts.filter(p => p.category === "Bleulec").length,
  "Bleulec Assur": mockProducts.filter(p => p.category === "Bleulec Assur").length,
  "Décès toutes causes": mockProducts.filter(p => p.category === "Décès toutes causes").length,
  Dépendance: mockProducts.filter(p => p.category === "Dépendance").length,
  "Garantie des accidents de la vie": mockProducts.filter(p => p.category === "Garantie des accidents de la vie").length,
  "Multirisques habitation": mockProducts.filter(p => p.category === "Multirisques habitation").length,
  Obsèque: mockProducts.filter(p => p.category === "Obsèque").length,
  "Protection juridique": mockProducts.filter(p => p.category === "Protection juridique").length,
  Santé: mockProducts.filter(p => p.category === "Santé").length,
}

export default function CataloguePage() {
  const [selectedCategory, setSelectedCategory] = React.useState<ProductCategory | "all">("all")
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = React.useState(false)

  // Filter products by selected category
  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === "all") {
      return mockProducts
    }
    return mockProducts.filter((product) => product.category === selectedCategory)
  }, [selectedCategory])

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setIsMobileDetailsOpen(true)
    toast.info(`Affichage des détails de: ${product.name}`, {
      description: `SKU: ${product.sku}`,
    })
  }

  const handleAddToCart = (product: Product) => {
    toast.success(`Ajouté au panier`, {
      description: `${product.name} - ${product.price.toFixed(2)} ${product.currency}`,
    })
    // TODO: Implémenter l'ajout au panier
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Categories Sidebar - 224px fixed width */}
      <div className="hidden md:block w-56 shrink-0">
        <CategorySidebar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Products List - 320px fixed width on desktop */}
      <div className="flex-1 md:w-80 md:flex-none">
        <ProductTable
          products={filteredProducts}
          onViewDetails={handleViewDetails}
          onAddToCart={handleAddToCart}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Product Details - Takes remaining space */}
      <div className="hidden xl:block flex-1">
        <ProductDetailsPanel
          product={selectedProduct}
          onAddToCart={handleAddToCart}
        />
      </div>

      {/* Mobile/Tablet Details Sheet */}
      <Sheet open={isMobileDetailsOpen} onOpenChange={setIsMobileDetailsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <ProductDetailsPanel
            product={selectedProduct}
            onAddToCart={handleAddToCart}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

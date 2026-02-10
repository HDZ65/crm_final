"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  LifeBuoy,
  Zap,
  Shield,
  Heart,
  Users,
  AlertCircle,
  Home,
  Flower,
  Scale,
  Activity,
  Search,
  Plus,
  MoreVertical,
} from "lucide-react"
import type { ProductCategory } from "@/lib/ui/labels/product"

interface CategorySidebarProps {
  selectedCategory: ProductCategory | "all"
  onCategoryChange: (category: ProductCategory | "all") => void
  categoryCounts: Record<ProductCategory | "all", number>
}

const categoryIcons: Record<ProductCategory, React.ElementType> = {
  Assistance: LifeBuoy,
  Bleulec: Zap,
  "Bleulec Assur": Shield,
  "Décès toutes causes": Heart,
  Dépendance: Users,
  "Garantie des accidents de la vie": AlertCircle,
  "Multirisques habitation": Home,
  Obsèque: Flower,
  "Protection juridique": Scale,
  Santé: Activity,
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

export function CategorySidebar({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
}: CategorySidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredCategories = categories.filter((cat) =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-screen flex flex-col bg-background border-r">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">Risques</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Créer un risque"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1">
          {filteredCategories.map((category) => {
            const Icon =
              category.value === "all"
                ? Shield
                : categoryIcons[category.value as ProductCategory]
            const isSelected = selectedCategory === category.value

            return (
              <button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md",
                  isSelected
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm flex-1 text-left truncate">
                  {category.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {categoryCounts[category.value]}
                </span>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

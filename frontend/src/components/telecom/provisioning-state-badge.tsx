"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STATE_CONFIG: Record<string, { label: string; className: string }> = {
  EN_ATTENTE_RETRACTATION: { label: "En Attente Rétractation", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  DELAI_RETRACTATION_ECOULE: { label: "Délai Écoulé", className: "bg-orange-50 text-orange-700 border-orange-200" },
  EN_COURS: { label: "En Cours", className: "bg-blue-50 text-blue-700 border-blue-200" },
  ACTIVE: { label: "Actif", className: "bg-green-50 text-green-700 border-green-200" },
  ERREUR_TECHNIQUE: { label: "Erreur Technique", className: "bg-red-50 text-red-700 border-red-200" },
}

interface ProvisioningStateBadgeProps {
  state: string
  className?: string
}

export function ProvisioningStateBadge({ state, className }: ProvisioningStateBadgeProps) {
  const config = STATE_CONFIG[state] ?? { label: state, className: "bg-gray-50 text-gray-700 border-gray-200" }
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}

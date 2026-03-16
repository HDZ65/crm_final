"use client"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const STATE_CONFIG: Record<string, { label: string; description: string; className: string }> = {
  EN_ATTENTE_RETRACTATION: {
    label: "Rétractation",
    description: "Le client dispose de 14 jours pour se rétracter après la signature du contrat.",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  DELAI_RETRACTATION_ECOULE: {
    label: "Délai écoulé",
    description: "Le délai de rétractation de 14 jours est terminé. Le provisioning peut démarrer.",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  EN_COURS: {
    label: "En cours d'expédition",
    description: "Le délai de rétractation est passé. La SIM est en cours d'expédition et la ligne en attente d'activation.",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  ACTIVE: {
    label: "Ligne active",
    description: "La ligne est activée et fonctionnelle. L'abonnement est en cours.",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  ERREUR_TECHNIQUE: {
    label: "Erreur",
    description: "Une erreur technique bloque le provisioning. Action manuelle requise.",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  SUSPENDU: {
    label: "Suspendu",
    description: "La ligne est temporairement suspendue. Elle peut être réactivée.",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  RESILIE: {
    label: "Résilié",
    description: "Le contrat est résilié. La ligne a été définitivement désactivée.",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  ANNULE: {
    label: "Annulé",
    description: "Le provisioning a été annulé.",
    className: "bg-gray-50 text-gray-600 border-gray-200",
  },
}

interface ProvisioningStateBadgeProps {
  state: string
  className?: string
}

export function ProvisioningStateBadge({ state, className }: ProvisioningStateBadgeProps) {
  const config = STATE_CONFIG[state] ?? {
    label: state,
    description: state,
    className: "bg-gray-50 text-gray-700 border-gray-200",
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("cursor-help", config.className, className)}>
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-64 text-center">
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Network,
  Settings,
  ExternalLink,
  Phone,
  Route,
  Radio,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FEATURES = [
  { label: "Téléphonie", icon: Phone },
  { label: "Routage", icon: Route },
  { label: "SIP/VoIP", icon: Radio },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InterFastIntegrationCard() {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
      {/* Subtle gradient glow at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 ring-1 ring-amber-200/50 dark:from-amber-900 dark:to-amber-800 dark:text-amber-300 dark:ring-amber-700/50">
              <Network className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Inter-Fast</CardTitle>
              <CardDescription className="mt-0.5">
                Téléphonie, routage et connexion SIP
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
          >
            Disponible
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5">
          {FEATURES.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              <Icon className="size-3" />
              {label}
            </span>
          ))}
        </div>

        {/* Description */}
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Configurez la connexion InterFast pour la téléphonie
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Routes SIP, numéros et synchronisation des appels
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Link href="/parametres/integrations/interfast">
            <Button size="sm">
              <Settings className="size-4 mr-1.5" />
              Configurer
              <ExternalLink className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

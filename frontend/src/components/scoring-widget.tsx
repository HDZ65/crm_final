"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, TrendingUp, TrendingDown, Minus, Shield } from "lucide-react"
import { predictPaymentRisk, type PredictRequest, type PredictResponse } from "@/actions/scoring"
import { cn } from "@/lib/utils"

interface ScoringWidgetProps {
  /**
   * Payment data for risk scoring
   */
  paymentData: PredictRequest
  /**
   * Optional className for styling
   */
  className?: string
}

const riskTierConfig = {
  LOW: {
    label: "Faible",
    icon: TrendingDown,
    badgeClass: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    progressClass: "bg-green-500",
  },
  MEDIUM: {
    label: "Moyen",
    icon: Minus,
    badgeClass: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    progressClass: "bg-orange-500",
  },
  HIGH: {
    label: "Élevé",
    icon: TrendingUp,
    badgeClass: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    progressClass: "bg-red-500",
  },
} as const

/**
 * ScoringWidget - Inline risk scoring widget for payments
 *
 * Displays real-time risk assessment from Python ML service:
 * - Risk score (0-100)
 * - Risk tier (LOW/MEDIUM/HIGH)
 * - Top contributing factors
 *
 * Uses REST exception to call Python FastAPI service on port 8001.
 */
export function ScoringWidget({ paymentData, className }: ScoringWidgetProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<PredictResponse | null>(null)

  React.useEffect(() => {
    let mounted = true

    async function fetchScore() {
      setIsLoading(true)
      setError(null)

      const response = await predictPaymentRisk(paymentData)

      if (!mounted) return

      if (response.success && response.data) {
        setResult(response.data)
      } else {
        setError(response.error || "Erreur inconnue")
      }

      setIsLoading(false)
    }

    fetchScore()

    return () => {
      mounted = false
    }
  }, [paymentData])

  if (isLoading) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Analyse de risque</CardTitle>
          </div>
          <CardDescription>Évaluation en cours...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("border-destructive/50 bg-destructive/5", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-destructive" />
            <CardTitle className="text-base text-destructive">Erreur de scoring</CardTitle>
          </div>
          <CardDescription className="text-destructive/80">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Le service de scoring est peut-être indisponible. Vérifiez que le service Python
            tourne sur le port 8001.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!result) {
    return null
  }

  const tierConfig = riskTierConfig[result.risk_tier]
  const TierIcon = tierConfig.icon

  // Sort factors by impact (descending)
  const sortedFactors = Object.entries(result.factors)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)

  // Format factor names for display
  const formatFactorName = (name: string): string => {
    const nameMap: Record<string, string> = {
      prev_rejects: "Rejets précédents",
      channel: "Canal de paiement",
      contract_age_months: "Âge du contrat",
      payment_history_count: "Historique de paiements",
      lot_code: "Code lot",
      provider: "Fournisseur PSP",
      amount_cents: "Montant",
      preferred_debit_day: "Jour de prélèvement",
    }
    return nameMap[name] || name
  }

  return (
    <Card className={cn("border-muted", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Analyse de risque</CardTitle>
          </div>
          <Badge variant="outline" className={cn("gap-1.5", tierConfig.badgeClass)}>
            <TierIcon className="size-3.5" />
            Risque {tierConfig.label}
          </Badge>
        </div>
        <CardDescription>Évaluation ML en temps réel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Score de risque</span>
            <span className="font-semibold tabular-nums">{result.score} / 100</span>
          </div>
          <Progress
            value={result.score}
            className={cn("h-2", `[&>*]:${tierConfig.progressClass}`)}
          />
        </div>

        {/* Risk Tier */}
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Niveau de risque</div>
          <div className="flex items-center gap-2">
            <TierIcon className={cn("size-5", tierConfig.badgeClass.split(" ")[1])} />
            <span className="font-medium">{tierConfig.label}</span>
          </div>
        </div>

        {/* Contributing Factors */}
        {sortedFactors.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Facteurs contributifs</div>
            <div className="space-y-1.5">
              {sortedFactors.map(([factor, impact]) => (
                <div key={factor} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{formatFactorName(factor)}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {(impact as number).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Analyse basée sur le modèle ML Python (service-scoring)
        </div>
      </CardContent>
    </Card>
  )
}

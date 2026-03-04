"use client"

import * as React from "react"
import { toast } from "sonner"
import { AlertTriangle, Lightbulb, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { OptimizationEmptyState } from "@/components/payments/empty-states"
import type { OptimizationSuggestion } from "@/lib/ui/display-types/payment"

interface OptimizationPanelProps {
  societeId: string
}

const STALENESS_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24h

export function OptimizationPanel({ societeId }: OptimizationPanelProps) {
  const [suggestions, setSuggestions] = React.useState<OptimizationSuggestion[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [lastAnalyzedAt, setLastAnalyzedAt] = React.useState<Date | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = React.useState<OptimizationSuggestion | null>(null)
  const [isApplying, setIsApplying] = React.useState(false)

  const isStale = lastAnalyzedAt !== null && Date.now() - lastAnalyzedAt.getTime() > STALENESS_THRESHOLD_MS

  function handleAnalyze() {
    setIsLoading(true)
    // Stub — simulates gRPC call delay. Will be replaced with real GetOptimizationSuggestions call.
    setTimeout(() => {
      setSuggestions([])
      setLastAnalyzedAt(new Date())
      setIsLoading(false)
    }, 1500)
  }

  function handleApply() {
    if (!selectedSuggestion) return
    setIsApplying(true)
    // Stub — simulates gRPC ApplyOptimizationSuggestion call.
    setTimeout(() => {
      setSuggestions((prev) =>
        prev.filter((s) => s.clientId !== selectedSuggestion.clientId)
      )
      setIsApplying(false)
      setSelectedSuggestion(null)
      toast.success("Configuration mise à jour")
    }, 1000)
  }

  // Suppress unused societeId lint warning — will be used for gRPC call
  void societeId

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="size-5 text-amber-500" />
            Suggestions d&apos;optimisation
          </CardTitle>
          <CardDescription>
            Analyse IA des configurations de prélèvement pour réduire les rejets.
          </CardDescription>
        </div>
        <Button onClick={handleAnalyze} disabled={isLoading} size="sm">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Analyse en cours…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-4" />
              Analyser
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Staleness warning */}
        {isStale && (
          <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              Analyse datant de plus de 24h — relancez l&apos;analyse pour des suggestions à jour.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && suggestions.length === 0 && (
          <OptimizationEmptyState />
        )}

        {/* Suggestion table */}
        {!isLoading && suggestions.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Lot actuel</TableHead>
                  <TableHead>Lot suggéré</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead className="w-[120px]">Confiance</TableHead>
                  <TableHead className="w-[100px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((suggestion) => (
                  <TableRow key={suggestion.clientId}>
                    <TableCell className="font-medium">{suggestion.clientName}</TableCell>
                    <TableCell>{suggestion.currentLotName}</TableCell>
                    <TableCell>{suggestion.suggestedLotName}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {suggestion.reason}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={suggestion.confidence} className="h-2 w-16" />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {suggestion.confidence}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSuggestion(suggestion)}
                      >
                        Appliquer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Confirmation dialog */}
      <AlertDialog
        open={selectedSuggestion !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSuggestion(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement</AlertDialogTitle>
            <AlertDialogDescription>
              Modifier la configuration de {selectedSuggestion?.clientName} : passer du
              lot {selectedSuggestion?.currentLotName} au lot{" "}
              {selectedSuggestion?.suggestedLotName} ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApplying}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Application…
                </>
              ) : (
                "Confirmer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

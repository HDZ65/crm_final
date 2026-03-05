"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { ProvisioningLifecycle } from "@proto/telecom/telecom"
import { ProvisioningStateBadge } from "@/components/telecom/provisioning-state-badge"
import { MockIndicator } from "@/components/telecom/mock-indicator"
import { ErrorPanel } from "@/components/telecom/error-panel"
import {
  retryTransatelActivation,
  retrySepaMandate,
  forceActive,
  triggerRetractionDeadline,
  cancelProvisioning,
  getProvisioningLifecycle,
} from "@/actions/telecom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Zap,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "—"
  }
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

interface TimelineEvent {
  key: string
  label: string
  date: string
  icon: React.ReactNode
  color: string
}

function buildTimeline(lifecycle: ProvisioningLifecycle): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // Parse metadata for timestamps
  let meta: Record<string, string> = {}
  if (lifecycle.metadata) {
    try {
      meta = JSON.parse(lifecycle.metadata)
    } catch {
      // ignore
    }
  }

  if (lifecycle.createdAt) {
    events.push({
      key: "created",
      label: "Cycle créé",
      date: lifecycle.createdAt,
      icon: <Clock className="h-4 w-4" />,
      color: "text-gray-500",
    })
  }

  if (meta.contratSigneAt) {
    events.push({
      key: "contratSigne",
      label: "Contrat signé",
      date: meta.contratSigneAt,
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "text-blue-500",
    })
  }

  if (meta.compensationAt) {
    events.push({
      key: "compensation",
      label: "Compensation effectuée",
      date: meta.compensationAt,
      icon: <CreditCard className="h-4 w-4" />,
      color: "text-purple-500",
    })
  }

  if (meta.activatedAt) {
    events.push({
      key: "activated",
      label: "Ligne activée",
      date: meta.activatedAt,
      icon: <Zap className="h-4 w-4" />,
      color: "text-green-500",
    })
  }

  if (meta.lastPaymentAt) {
    events.push({
      key: "lastPayment",
      label: "Dernier paiement",
      date: meta.lastPaymentAt,
      icon: <CreditCard className="h-4 w-4" />,
      color: "text-green-500",
    })
  }

  if (meta.canceledAt) {
    events.push({
      key: "canceled",
      label: "Provisioning annulé",
      date: meta.canceledAt,
      icon: <XCircle className="h-4 w-4" />,
      color: "text-red-500",
    })
  }

  // Sort by date ascending
  events.sort((a, b) => {
    try {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    } catch {
      return 0
    }
  })

  return events
}

// ---------------------------------------------------------------------------
// Action button config
// ---------------------------------------------------------------------------

interface ActionConfig {
  id: string
  label: string
  description: string
  variant: "default" | "destructive" | "outline"
  enabledStates: string[]
  icon: React.ReactNode
}

const ACTIONS: ActionConfig[] = [
  {
    id: "retryTransatel",
    label: "Retry Transatel",
    description: "Relancer l'activation de la ligne Transatel. Disponible uniquement en état ERREUR_TECHNIQUE.",
    variant: "outline",
    enabledStates: ["ERREUR_TECHNIQUE"],
    icon: <RefreshCw className="h-4 w-4" />,
  },
  {
    id: "retrySepa",
    label: "Retry SEPA",
    description: "Relancer la création du mandat SEPA. Disponible uniquement si aucun mandat n'existe.",
    variant: "outline",
    enabledStates: ["EN_ATTENTE_RETRACTATION", "DELAI_RETRACTATION_ECOULE", "EN_COURS", "ERREUR_TECHNIQUE"],
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: "forceActive",
    label: "Forcer Activation",
    description: "Forcer le passage à l'état ACTIVE. Disponible en EN_COURS ou ERREUR_TECHNIQUE.",
    variant: "default",
    enabledStates: ["EN_COURS", "ERREUR_TECHNIQUE"],
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "triggerRetraction",
    label: "Déclencher Rétractation",
    description: "Déclencher manuellement le délai de rétractation. Disponible en EN_ATTENTE_RETRACTATION.",
    variant: "outline",
    enabledStates: ["EN_ATTENTE_RETRACTATION"],
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: "cancel",
    label: "Annuler",
    description: "Annuler le provisioning. Cette action est irréversible.",
    variant: "destructive",
    enabledStates: ["EN_ATTENTE_RETRACTATION", "DELAI_RETRACTATION_ECOULE", "EN_COURS", "ERREUR_TECHNIQUE", "ACTIVE"],
    icon: <XCircle className="h-4 w-4" />,
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TelecomDetailClientProps {
  lifecycleId: string
  initialLifecycle: ProvisioningLifecycle
}

export function TelecomDetailClient({
  lifecycleId,
  initialLifecycle,
}: TelecomDetailClientProps) {
  const router = useRouter()
  const [lifecycle, setLifecycle] = React.useState(initialLifecycle)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [pendingAction, setPendingAction] = React.useState<string | null>(null)
  const [isExecuting, setIsExecuting] = React.useState(false)
  const [metaExpanded, setMetaExpanded] = React.useState(false)

  const timeline = buildTimeline(lifecycle)

  // -------------------------------------------------------------------------
  // Refresh
  // -------------------------------------------------------------------------

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      const result = await getProvisioningLifecycle(lifecycleId)
      if (result.data?.lifecycle) {
        setLifecycle(result.data.lifecycle)
        toast.success("Données actualisées")
      }
    } catch {
      toast.error("Erreur lors de l'actualisation")
    } finally {
      setIsRefreshing(false)
    }
  }

  // -------------------------------------------------------------------------
  // Execute action
  // -------------------------------------------------------------------------

  async function executeAction(actionId: string) {
    setIsExecuting(true)
    try {
      let result
      switch (actionId) {
        case "retryTransatel":
          result = await retryTransatelActivation(lifecycleId)
          break
        case "retrySepa":
          result = await retrySepaMandate(lifecycleId)
          break
        case "forceActive":
          result = await forceActive(lifecycleId)
          break
        case "triggerRetraction":
          result = await triggerRetractionDeadline(lifecycleId)
          break
        case "cancel":
          result = await cancelProvisioning(lifecycleId)
          break
        default:
          return
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Action exécutée avec succès")
        if (result.data?.lifecycle) {
          setLifecycle(result.data.lifecycle)
        } else {
          // Refresh to get latest state
          const refreshed = await getProvisioningLifecycle(lifecycleId)
          if (refreshed.data?.lifecycle) setLifecycle(refreshed.data.lifecycle)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'exécution")
    } finally {
      setIsExecuting(false)
      setPendingAction(null)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/telecom">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-xl font-bold">{lifecycle.contratId || lifecycleId}</h1>
            <p className="text-muted-foreground text-sm">Client: {lifecycle.clientId || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MockIndicator />
          <ProvisioningStateBadge state={lifecycle.provisioningState} />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Info + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Contrat ID</dt>
                  <dd className="font-medium mt-0.5">{lifecycle.contratId || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Client ID</dt>
                  <dd className="font-medium mt-0.5">{lifecycle.clientId || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Commercial ID</dt>
                  <dd className="font-medium mt-0.5">{lifecycle.commercialId || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Statut Abonnement</dt>
                  <dd className="mt-0.5">
                    <Badge variant="outline">{lifecycle.abonnementStatus || "—"}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Montant</dt>
                  <dd className="font-medium mt-0.5">
                    {lifecycle.montantAbonnement != null
                      ? `${lifecycle.montantAbonnement.toFixed(2)} ${lifecycle.devise || "EUR"}`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Mandat SEPA</dt>
                  <dd className="font-medium mt-0.5 font-mono text-xs">
                    {lifecycle.sepaMandateId || <span className="text-muted-foreground italic">Non créé</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Abonnement GoCardless</dt>
                  <dd className="font-medium mt-0.5 font-mono text-xs">
                    {lifecycle.gocardlessSubscriptionId || <span className="text-muted-foreground italic">Non créé</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Compensation</dt>
                  <dd className="mt-0.5">
                    <Badge variant={lifecycle.compensationDone ? "default" : "outline"}>
                      {lifecycle.compensationDone ? "Effectuée" : "En attente"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date Signature</dt>
                  <dd className="font-medium mt-0.5">{formatDateShort(lifecycle.dateSignature)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date J+14 (fin rétractation)</dt>
                  <dd className="font-medium mt-0.5">{formatDateShort(lifecycle.dateFinRetractation)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Créé le</dt>
                  <dd className="font-medium mt-0.5">{formatDate(lifecycle.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Mis à jour le</dt>
                  <dd className="font-medium mt-0.5">{formatDate(lifecycle.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Error panel */}
          {lifecycle.lastError && (
            <ErrorPanel error={lifecycle.lastError} />
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun événement enregistré</p>
              ) : (
                <ol className="relative border-l border-border ml-3 space-y-6">
                  {timeline.map((event, idx) => (
                    <li key={event.key} className="ml-6">
                      <span
                        className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border ${event.color}`}
                      >
                        {event.icon}
                      </span>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">{event.label}</p>
                        <time className="text-xs text-muted-foreground">{formatDate(event.date)}</time>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Metadata panel (collapsible) */}
          {lifecycle.metadata && (
            <Card>
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setMetaExpanded((v) => !v)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Métadonnées brutes</CardTitle>
                  {metaExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {metaExpanded && (
                <CardContent>
                  <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(lifecycle.metadata), null, 2)
                      } catch {
                        return lifecycle.metadata
                      }
                    })()}
                  </pre>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Right column: Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions manuelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ACTIONS.map((action) => {
                const isEnabled = action.enabledStates.includes(lifecycle.provisioningState)
                return (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    size="sm"
                    className="w-full justify-start"
                    disabled={!isEnabled || isExecuting}
                    onClick={() => setPendingAction(action.id)}
                  >
                    <span className="mr-2">{action.icon}</span>
                    {action.label}
                  </Button>
                )
              })}
            </CardContent>
          </Card>

          {/* State info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">État actuel</CardTitle>
            </CardHeader>
            <CardContent>
              <ProvisioningStateBadge state={lifecycle.provisioningState} className="text-sm" />
              <p className="text-xs text-muted-foreground mt-2">
                Les actions disponibles dépendent de l&apos;état actuel du cycle.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {pendingAction && (() => {
        const action = ACTIONS.find((a) => a.id === pendingAction)
        if (!action) return null
        return (
          <Dialog open={true} onOpenChange={(open) => { if (!open && !isExecuting) setPendingAction(null) }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer : {action.label}</DialogTitle>
                <DialogDescription>{action.description}</DialogDescription>
              </DialogHeader>
              {action.variant === "destructive" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Cette action peut être irréversible. Confirmez-vous ?
                  </AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPendingAction(null)}
                  disabled={isExecuting}
                >
                  Annuler
                </Button>
                <Button
                  variant={action.variant}
                  onClick={() => executeAction(action.id)}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Confirmer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      })()}
    </div>
  )
}

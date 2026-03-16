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
  suspendLine,
  terminateLine,
} from "@/actions/telecom"
import { AskAiCardButton } from "@/components/ask-ai-card-button"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  Package,
  PackageCheck,
  ExternalLink,
  Copy,
  Shield,
  Wifi,
  Banknote,
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

/** Génère l'URL de suivi selon le transporteur */
function getTrackingUrl(trackingNumber: string, carrier?: string): string {
  const clean = trackingNumber.trim().toUpperCase()
  if (carrier?.toLowerCase().includes("chronopost")) {
    return `https://www.chronopost.fr/tracking-no-powerful/trackDetailByShipmentId/${clean}`
  }
  // Par défaut La Poste / Colissimo
  return `https://www.laposte.fr/outils/suivre-vos-envois?code=${clean}`
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

  if (meta.finRetractationAt) {
    events.push({
      key: "finRetractation",
      label: "Fin de rétractation (feu vert légal)",
      date: meta.finRetractationAt,
      icon: <Shield className="h-4 w-4" />,
      color: "text-amber-600",
    })
  }

  if (meta.simExpedieeAt) {
    events.push({
      key: "simExpediee",
      label: `SIM expédiée${meta.simCarrier ? ` (${meta.simCarrier})` : ""}`,
      date: meta.simExpedieeAt,
      icon: <Package className="h-4 w-4" />,
      color: "text-orange-500",
    })
  }

  if (meta.simLivreeAt) {
    events.push({
      key: "simLivree",
      label: "SIM livrée",
      date: meta.simLivreeAt,
      icon: <PackageCheck className="h-4 w-4" />,
      color: "text-teal-500",
    })
  }

  if (meta.premiereConnexionAt) {
    events.push({
      key: "premiereConnexion",
      label: "Première connexion réseau",
      date: meta.premiereConnexionAt,
      icon: <Wifi className="h-4 w-4" />,
      color: "text-emerald-600",
    })
  }

  if (meta.activatedAt) {
    events.push({
      key: "activated",
      label: "Ligne activée — facturation démarrée",
      date: meta.activatedAt,
      icon: <Zap className="h-4 w-4" />,
      color: "text-green-600",
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

  if (meta.premierPrelevementAt) {
    events.push({
      key: "premierPrelevement",
      label: "Premier prélèvement GoCardless",
      date: meta.premierPrelevementAt,
      icon: <Banknote className="h-4 w-4" />,
      color: "text-green-700",
    })
  }

  if (meta.canceledAt) {
    events.push({
      key: "canceled",
      label: "Cycle annulé",
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
    label: "Relancer Transatel",
    description: "Relancer l'activation de la ligne auprès de Transatel. Disponible uniquement lorsque le cycle est en erreur technique.",
    variant: "outline",
    enabledStates: ["ERREUR_TECHNIQUE"],
    icon: <RefreshCw className="h-4 w-4" />,
  },
  {
    id: "retrySepa",
    label: "Relancer SEPA",
    description: "Relancer la création du mandat SEPA. Disponible si aucun mandat n'a encore été créé.",
    variant: "outline",
    enabledStates: ["EN_ATTENTE_RETRACTATION", "DELAI_RETRACTATION_ECOULE", "EN_COURS", "ERREUR_TECHNIQUE"],
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: "forceActive",
    label: "Forcer l'activation",
    description: "Forcer le passage à l'état « Ligne active ». Réservé aux cas où l'activation est bloquée.",
    variant: "default",
    enabledStates: ["EN_COURS", "ERREUR_TECHNIQUE"],
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: "triggerRetraction",
    label: "Clôturer la rétractation",
    description: "Mettre fin manuellement au délai de rétractation de 14 jours.",
    variant: "outline",
    enabledStates: ["EN_ATTENTE_RETRACTATION"],
    icon: <Clock className="h-4 w-4" />,
  },
  {
    id: "cancel",
    label: "Annuler le cycle",
    description: "Annuler définitivement le cycle d'activation. Cette action est irréversible.",
    variant: "destructive",
    enabledStates: ["EN_ATTENTE_RETRACTATION", "DELAI_RETRACTATION_ECOULE", "EN_COURS", "ERREUR_TECHNIQUE", "ACTIVE"],
    icon: <XCircle className="h-4 w-4" />,
  },
  {
    id: "suspend",
    label: "Suspendre la ligne",
    description: "Suspendre la ligne télécom auprès du carrier. La ligne sera désactivée jusqu'à réactivation.",
    variant: "outline",
    enabledStates: ["ACTIVE"],
    icon: <Wifi className="h-4 w-4 text-amber-500" />,
  },
  {
    id: "terminate",
    label: "Résilier la ligne",
    description: "Résilier définitivement la ligne télécom. Cette action est irréversible.",
    variant: "destructive",
    enabledStates: ["ACTIVE", "SUSPENDU"],
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

  // Parse metadata once for display
  const meta = React.useMemo(() => {
    try {
      return lifecycle.metadata ? JSON.parse(lifecycle.metadata) : {}
    } catch {
      return {}
    }
  }, [lifecycle.metadata])

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
      let result: { data: unknown; error: string | null } | null = null
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
        case "suspend":
          result = await suspendLine(
            lifecycle.contratId,
            lifecycle.clientId,
            "Suspension manuelle via CRM"
          )
          break
        case "terminate":
          result = await terminateLine(
            lifecycle.contratId,
            lifecycle.clientId,
            "Résiliation manuelle via CRM"
          )
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
  // Copy tracking number
  // -------------------------------------------------------------------------

  function copyTrackingNumber() {
    if (!meta.simTrackingNumber) return
    navigator.clipboard.writeText(meta.simTrackingNumber)
    toast.success("Numéro de suivi copié")
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
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
            <p className="text-muted-foreground text-sm">Client : {lifecycle.clientId || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MockIndicator />
          <ProvisioningStateBadge state={lifecycle.provisioningState} />
          <AskAiCardButton
            prompt={`Analyse ce cycle de provisioning télécom. Contrat: ${lifecycle.contratId}, Client: ${lifecycle.clientId}, État: ${lifecycle.provisioningState}, Statut abo: ${lifecycle.abonnementStatus}, Montant: ${lifecycle.montantAbonnement} ${lifecycle.devise}, SEPA: ${lifecycle.sepaMandateId || "non créé"}, GoCardless: ${lifecycle.gocardlessSubscriptionId || "non créé"}, Compensation: ${lifecycle.compensationDone ? "oui" : "non"}, Suivi SIM: ${meta.simTrackingNumber || "non expédié"}, Dernière erreur: ${lifecycle.lastError || "aucune"}. Diagnostic et actions recommandées ?`}
            title="Analyser ce cycle avec l'IA"
          />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Infos + Expédition + Chronologie */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">N° Contrat</dt>
                  <dd className="font-medium mt-0.5">{lifecycle.contratId || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Client</dt>
                  <dd className="font-medium mt-0.5">{lifecycle.clientId || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Commercial</dt>
                  <dd className="font-medium mt-0.5">{lifecycle.commercialId || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Statut abonnement</dt>
                  <dd className="mt-0.5">
                    <Badge variant="outline">
                      {lifecycle.abonnementStatus === "PENDING" ? "En attente"
                        : lifecycle.abonnementStatus === "ACTIVE" ? "Actif"
                        : lifecycle.abonnementStatus === "ERROR" ? "Erreur"
                        : lifecycle.abonnementStatus === "CANCELLED" ? "Annulé"
                        : lifecycle.abonnementStatus || "—"}
                    </Badge>
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
                  <dt className="text-muted-foreground">Date de signature</dt>
                  <dd className="font-medium mt-0.5">{formatDateShort(lifecycle.dateSignature)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Fin de rétractation (J+14)</dt>
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

          {/* Expédition SIM */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-500" />
                Expédition SIM
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meta.simTrackingNumber ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                      {meta.simTrackingNumber}
                    </code>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={copyTrackingNumber}>
                            <Copy className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copier le numéro de suivi</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" asChild>
                            <a
                              href={getTrackingUrl(meta.simTrackingNumber, meta.simCarrier)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Suivre sur {meta.simCarrier || "La Poste"}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Transporteur</dt>
                      <dd className="font-medium mt-0.5">{meta.simCarrier || "La Poste / Colissimo"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Date d&apos;expédition</dt>
                      <dd className="font-medium mt-0.5">{meta.simExpedieeAt ? formatDateShort(meta.simExpedieeAt) : "—"}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Package className="h-5 w-5" />
                  <p>Aucune expédition de carte SIM enregistrée pour ce cycle.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Panneau d'erreur */}
          {lifecycle.lastError && (
            <ErrorPanel error={lifecycle.lastError} />
          )}

          {/* Chronologie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chronologie</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun événement enregistré</p>
              ) : (
                <ol className="relative border-l border-border ml-3 space-y-6">
                  {timeline.map((event) => (
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

          {/* Métadonnées brutes (volet dépliable) */}
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

        {/* Colonne droite : Actions */}
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

          {/* Carte état actuel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">État de la ligne</CardTitle>
            </CardHeader>
            <CardContent>
              <ProvisioningStateBadge state={lifecycle.provisioningState} className="text-sm" />
              <p className="text-xs text-muted-foreground mt-2">
                Les actions disponibles dépendent de l&apos;état actuel du cycle d&apos;activation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogue de confirmation */}
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
                    Cette action est irréversible. Confirmez-vous ?
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
    </main>
  )
}

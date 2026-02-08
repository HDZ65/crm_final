"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckCircle2,
  Clock,
  DollarSign,
  RotateCcw,
  AlertTriangle,
  User,
  Building2,
  Package,
  Calendar,
  FileText,
  Info,
} from "lucide-react"
import type { CommissionWithDetails, TypeApporteur } from "@/lib/ui/display-types/commission"
import { formatMontant, parseMontant } from "@/lib/ui/helpers/format"
import { getAuditLogsByCommission, creerContestation } from "@/actions/commissions"
import type { AuditLog } from "@proto/commission/commission"
import { AuditAction, AuditScope } from "@proto/commission/commission"
import { CreerContestationDialog } from "./creer-contestation-dialog"
import { toast } from "sonner"

interface CommissionDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  commission: CommissionWithDetails | null
}

// Mapping des types d'apporteur pour l'affichage
const typeApporteurLabels: Record<TypeApporteur, string> = {
  vrp: "VRP",
  manager: "Manager",
  directeur: "Directeur",
  partenaire: "Partenaire",
}

// Mapping des bases de calcul
const baseCalculLabels: Record<string, string> = {
  cotisation_ht: "Cotisation HT",
  ca_ht: "% CA",
  forfait: "Forfait fixe",
}

export function CommissionDetailDialog({
  open,
  onOpenChange,
  commission,
}: CommissionDetailDialogProps) {
  if (!commission) return null

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  }

  const getStatusIcon = (code?: string) => {
    const statusCode = code?.toLowerCase() || ""
    switch (statusCode) {
      case "en_attente":
        return <Clock className="size-4" />
      case "validee":
        return <CheckCircle2 className="size-4" />
      case "reprise":
        return <RotateCcw className="size-4" />
      case "payee":
        return <DollarSign className="size-4" />
      case "contestee":
        return <AlertTriangle className="size-4" />
      default:
        return <Clock className="size-4" />
    }
  }

  const isEnAttente = commission.statut?.code?.toLowerCase() === "en_attente"

  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = React.useState(false)
  const [auditError, setAuditError] = React.useState<string | null>(null)

  const scopeLabels: Record<number, string> = {
    [AuditScope.AUDIT_SCOPE_COMMISSION]: "Commission",
    [AuditScope.AUDIT_SCOPE_RECURRENCE]: "Récurrence",
    [AuditScope.AUDIT_SCOPE_REPRISE]: "Reprise",
    [AuditScope.AUDIT_SCOPE_REPORT]: "Report",
    [AuditScope.AUDIT_SCOPE_BORDEREAU]: "Bordereau",
    [AuditScope.AUDIT_SCOPE_LIGNE]: "Ligne",
    [AuditScope.AUDIT_SCOPE_BAREME]: "Barème",
    [AuditScope.AUDIT_SCOPE_PALIER]: "Palier",
    [AuditScope.AUDIT_SCOPE_ENGINE]: "Moteur",
  }

  const actionLabels: Record<number, string> = {
    [AuditAction.AUDIT_ACTION_COMMISSION_CALCULATED]: "Commission calculée",
    [AuditAction.AUDIT_ACTION_COMMISSION_CREATED]: "Commission créée",
    [AuditAction.AUDIT_ACTION_COMMISSION_UPDATED]: "Commission mise à jour",
    [AuditAction.AUDIT_ACTION_COMMISSION_DELETED]: "Commission supprimée",
    [AuditAction.AUDIT_ACTION_COMMISSION_STATUS_CHANGED]: "Statut modifié",
    [AuditAction.AUDIT_ACTION_RECURRENCE_GENERATED]: "Récurrence générée",
    [AuditAction.AUDIT_ACTION_RECURRENCE_STOPPED]: "Récurrence stoppée",
    [AuditAction.AUDIT_ACTION_REPRISE_CREATED]: "Reprise créée",
    [AuditAction.AUDIT_ACTION_REPRISE_APPLIED]: "Reprise appliquée",
    [AuditAction.AUDIT_ACTION_REPRISE_CANCELLED]: "Reprise annulée",
    [AuditAction.AUDIT_ACTION_REPRISE_REGULARIZED]: "Reprise régularisée",
    [AuditAction.AUDIT_ACTION_REPORT_NEGATIF_CREATED]: "Report négatif créé",
    [AuditAction.AUDIT_ACTION_REPORT_NEGATIF_APPLIED]: "Report négatif appliqué",
    [AuditAction.AUDIT_ACTION_REPORT_NEGATIF_CLEARED]: "Report négatif apuré",
    [AuditAction.AUDIT_ACTION_BORDEREAU_CREATED]: "Bordereau créé",
    [AuditAction.AUDIT_ACTION_BORDEREAU_VALIDATED]: "Bordereau validé",
    [AuditAction.AUDIT_ACTION_BORDEREAU_EXPORTED]: "Bordereau exporté",
    [AuditAction.AUDIT_ACTION_BORDEREAU_ARCHIVED]: "Bordereau archivé",
    [AuditAction.AUDIT_ACTION_LIGNE_SELECTED]: "Ligne sélectionnée",
    [AuditAction.AUDIT_ACTION_LIGNE_DESELECTED]: "Ligne désélectionnée",
    [AuditAction.AUDIT_ACTION_LIGNE_VALIDATED]: "Ligne validée",
    [AuditAction.AUDIT_ACTION_LIGNE_REJECTED]: "Ligne rejetée",
    [AuditAction.AUDIT_ACTION_BAREME_CREATED]: "Barème créé",
    [AuditAction.AUDIT_ACTION_BAREME_UPDATED]: "Barème mis à jour",
    [AuditAction.AUDIT_ACTION_BAREME_ACTIVATED]: "Barème activé",
    [AuditAction.AUDIT_ACTION_BAREME_DEACTIVATED]: "Barème désactivé",
    [AuditAction.AUDIT_ACTION_BAREME_VERSION_CREATED]: "Version barème créée",
    [AuditAction.AUDIT_ACTION_PALIER_CREATED]: "Palier créé",
    [AuditAction.AUDIT_ACTION_PALIER_UPDATED]: "Palier mis à jour",
    [AuditAction.AUDIT_ACTION_PALIER_DELETED]: "Palier supprimé",
  }

  React.useEffect(() => {
    if (!open || !commission?.id) return
    let cancelled = false
    setAuditLoading(true)
    setAuditError(null)
    getAuditLogsByCommission({ commissionId: commission.id })
      .then((result) => {
        if (cancelled) return
        if (result.error) {
          setAuditError(result.error)
        } else if (result.data) {
          setAuditLogs(result.data.logs.slice(0, 10))
        }
      })
      .catch((err) => {
        if (cancelled) return
        setAuditError(err instanceof Error ? err.message : "Erreur lors du chargement des audits")
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, commission?.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Détail de la commission
          </DialogTitle>
          <DialogDescription>
            Référence : <strong>{commission.reference}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[600px] pr-4">
          <div className="space-y-6">
            {/* Section Statut */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(commission.statut?.code)}
                <Badge
                  variant={
                    commission.statut?.code?.toLowerCase() === "validee" ||
                    commission.statut?.code?.toLowerCase() === "payee"
                      ? "default"
                      : "secondary"
                  }
                  className="text-sm"
                >
                  {commission.statut?.nom || "En attente"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">{commission.periode}</div>
            </div>

            <Separator />

            {/* Section Apporteur */}
            {commission.apporteur && (
              <>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <User className="size-4" />
                    Apporteur
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nom :</span>
                      <p className="font-medium">
                        {commission.apporteur.prenom} {commission.apporteur.nom}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type :</span>
                      <p className="font-medium">
                        <Badge variant="outline">
                          {typeApporteurLabels[commission.apporteur.typeApporteur] ||
                            commission.apporteur.typeApporteur}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Section Contrat */}
            {commission.contrat && (
              <>
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="size-4" />
                    Contrat associé
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Référence :</span>
                      <p className="font-mono text-xs">{commission.contrat.referenceExterne}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Client :</span>
                      <p className="font-medium">{commission.contrat.clientNom}</p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Section Produit */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Package className="size-4" />
                Produit et compagnie
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {commission.produit && (
                  <div>
                    <span className="text-muted-foreground">Produit :</span>
                    <p className="font-medium">{commission.produit.nom}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Compagnie :</span>
                  <p className="font-medium">
                    <Building2 className="size-3 inline mr-1" />
                    {commission.compagnie}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Base de calcul :</span>
                  <p className="font-medium">
                    {baseCalculLabels[commission.typeBase] || commission.typeBase}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section Montants */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="size-4" />
                Montants
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                  <span className="text-sm font-medium text-success">Montant brut</span>
                  <span className="text-lg font-bold text-success">
                    {formatMontant(commission.montantBrut)}
                  </span>
                </div>

                {parseMontant(commission.montantReprises) > 0 && (
                  <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <span className="text-sm font-medium text-destructive flex items-center gap-1">
                      <RotateCcw className="size-4" />
                      Reprises
                    </span>
                    <span className="text-lg font-bold text-destructive">
                      -{formatMontant(commission.montantReprises)}
                    </span>
                  </div>
                )}

                {parseMontant(commission.montantAcomptes) > 0 && (
                  <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <span className="text-sm font-medium text-warning">Acomptes</span>
                    <span className="text-lg font-bold text-warning">
                      -{formatMontant(commission.montantAcomptes)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center p-3 bg-info/10 rounded-lg border-2 border-info/30">
                  <span className="text-base font-semibold text-info">Net à payer</span>
                  <span className="text-xl font-bold text-info">
                    {formatMontant(commission.montantNetAPayer)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section Historique */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar className="size-4" />
                Historique
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de création :</span>
                  <span className="font-medium">{formatDate(commission.dateCreation)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernière mise à jour :</span>
                  <span className="font-medium">{formatDate(commission.updatedAt)}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Info className="size-4" />
                Journal d&apos;audit
              </h3>
              {auditLoading ? (
                <div className="text-sm text-muted-foreground">Chargement des audits...</div>
              ) : auditError ? (
                <Alert variant="destructive">
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{auditError}</AlertDescription>
                </Alert>
              ) : auditLogs.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucun audit disponible pour cette commission.</div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {actionLabels[log.action] || "Action"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {scopeLabels[log.scope] || "—"} · {log.userName || log.userId || "Système"}
                        </div>
                        {log.motif && (
                          <div className="text-xs text-muted-foreground">{log.motif}</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {isEnAttente && (
            <CreerContestationDialog
              commissionId={commission.id}
              bordereauId=""
              apporteurId={commission.apporteur?.id || ""}
              trigger={<Button variant="destructive">Contester</Button>}
              onSubmit={async (payload) => {
                const result = await creerContestation({
                  ...payload,
                  organisationId: commission.organisationId,
                })
                if (result.data) {
                  toast.success("Contestation créée avec succès")
                  onOpenChange(false)
                } else {
                  toast.error(result.error || "Erreur lors de la création de la contestation")
                }
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

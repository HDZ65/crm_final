"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  CreditCard,
} from "lucide-react"
import type { GocardlessMandate, MandateStatus } from "@/types/gocardless"

interface MandateStatusBadgeProps {
  status: MandateStatus
}

const STATUS_CONFIG: Record<
  MandateStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  pending_customer_approval: {
    label: "En attente d'approbation",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  pending_submission: {
    label: "En cours de traitement",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  submitted: {
    label: "En cours de validation",
    variant: "secondary",
    icon: <Send className="h-3 w-3" />,
  },
  active: {
    label: "Actif",
    variant: "default",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: "Annulé",
    variant: "outline",
    icon: <XCircle className="h-3 w-3" />,
  },
  failed: {
    label: "Échec",
    variant: "destructive",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  expired: {
    label: "Expiré",
    variant: "destructive",
    icon: <Clock className="h-3 w-3" />,
  },
}

export function MandateStatusBadge({ status }: MandateStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending_customer_approval

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  )
}

interface GocardlessMandateStatusProps {
  mandate: GocardlessMandate | null
  loading?: boolean
  onSetupMandate?: () => void
  onCancelMandate?: () => void
}

export function GocardlessMandateStatus({
  mandate,
  loading,
  onSetupMandate,
  onCancelMandate,
}: GocardlessMandateStatusProps) {
  const showSetupButton =
    !mandate ||
    mandate.mandateStatus === "cancelled" ||
    mandate.mandateStatus === "failed" ||
    mandate.mandateStatus === "expired"

  const canCancel =
    mandate &&
    (mandate.mandateStatus === "active" ||
      mandate.mandateStatus === "pending_customer_approval" ||
      mandate.mandateStatus === "pending_submission" ||
      mandate.mandateStatus === "submitted")

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Prélèvement bancaire
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <span className="text-muted-foreground">Chargement...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Prélèvement bancaire (SEPA)
        </CardTitle>
        <CardDescription>
          {mandate
            ? "Gérez votre autorisation de prélèvement automatique"
            : "Configurez le prélèvement automatique pour simplifier vos paiements"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mandate ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Statut</span>
              <MandateStatusBadge status={mandate.mandateStatus} />
            </div>

            {mandate.mandateReference && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Référence</span>
                <span className="font-mono text-sm">{mandate.mandateReference}</span>
              </div>
            )}

            {mandate.bankAccountEndingIn && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Compte</span>
                <span className="font-mono text-sm">
                  **** **** **** {mandate.bankAccountEndingIn}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Schéma</span>
              <span className="text-sm uppercase">{mandate.scheme}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Créé le</span>
              <span className="text-sm">
                {new Date(mandate.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>

            {mandate.mandateStatus === "active" && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                Votre mandat est actif. Vous pouvez recevoir des prélèvements sur ce compte.
              </p>
            )}

            {(mandate.mandateStatus === "pending_customer_approval" ||
              mandate.mandateStatus === "pending_submission" ||
              mandate.mandateStatus === "submitted") && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                Votre mandat est en cours de validation. Cela peut prendre 3 à 5 jours ouvrés.
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Aucun mandat de prélèvement configuré.
              <br />
              Configurez le prélèvement automatique pour faciliter vos paiements.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {showSetupButton && onSetupMandate && (
            <Button onClick={onSetupMandate} className="flex-1">
              Configurer le prélèvement
            </Button>
          )}

          {canCancel && onCancelMandate && (
            <Button variant="outline" onClick={onCancelMandate}>
              Annuler le mandat
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

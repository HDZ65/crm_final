"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
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
import type { CommissionWithDetailsResponseDto, TypeApporteur } from "@/types/commission"

interface CommissionDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  commission: CommissionWithDetailsResponseDto | null
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

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
                    {formatCurrency(commission.montantBrut)}
                  </span>
                </div>

                {commission.montantReprises > 0 && (
                  <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <span className="text-sm font-medium text-destructive flex items-center gap-1">
                      <RotateCcw className="size-4" />
                      Reprises
                    </span>
                    <span className="text-lg font-bold text-destructive">
                      -{formatCurrency(commission.montantReprises)}
                    </span>
                  </div>
                )}

                {commission.montantAcomptes > 0 && (
                  <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <span className="text-sm font-medium text-warning">Acomptes</span>
                    <span className="text-lg font-bold text-warning">
                      -{formatCurrency(commission.montantAcomptes)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center p-3 bg-info/10 rounded-lg border-2 border-info/30">
                  <span className="text-base font-semibold text-info">Net à payer</span>
                  <span className="text-xl font-bold text-info">
                    {formatCurrency(commission.montantNetAPayer)}
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
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {isEnAttente && <Button variant="destructive">Contester</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

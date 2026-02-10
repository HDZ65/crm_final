"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getContratsByOrganisation } from "@/actions/contrats"
import { FileText, Calendar, CreditCard, User, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Contrat } from "@proto/contrats/contrats"

interface CommercialContratsProps {
  commercialId: string
  organisationId: string
  initialContrats?: Contrat[]
}

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

const formatMontant = (montant: string | number | null | undefined) => {
  if (!montant) return "—"
  const amount = typeof montant === "string" ? parseFloat(montant) : montant
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}

export function CommercialContrats({
  commercialId,
  organisationId,
  initialContrats,
}: CommercialContratsProps) {
  const router = useRouter()
  const [contrats, setContrats] = React.useState<Contrat[]>(initialContrats || [])
  const [loading, setLoading] = React.useState(!initialContrats)

  // Fetch contrats only if not provided via SSR
  React.useEffect(() => {
    if (initialContrats) return
    
    const fetchContrats = async () => {
      setLoading(true)
      const result = await getContratsByOrganisation({
        organisationId,
        commercialId,
      })
      if (result.data) {
        setContrats(result.data.contrats)
      }
      setLoading(false)
    }
    fetchContrats()
  }, [organisationId, commercialId, initialContrats])

  const handleRowClick = (contratId: string) => {
    router.push(`/contrats/${contratId}`)
  }

  if (loading) {
    return (
      <Card className="flex-1 bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-sky-950">
            <FileText className="size-5" />
            Contrats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (contrats.length === 0) {
    return (
      <Card className="flex-1 bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-sky-950">
            <FileText className="size-5" />
            Contrats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <FileText className="h-10 w-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Aucun contrat</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <EmptyDescription>
                Aucun contrat associé à ce commercial.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex-1 bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
      <CardHeader>
        <div>
          <CardTitle className="text-lg flex items-center gap-2 text-sky-950">
            <FileText className="size-5" />
            Contrats
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            {contrats.length} contrat{contrats.length > 1 ? "s" : ""} associé{contrats.length > 1 ? "s" : ""}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex-1 min-h-0 overflow-hidden rounded-md border bg-white">
          <Table aria-label="Tableau des contrats du commercial">
            <TableHeader>
              <TableRow className="bg-sidebar text-sidebar-foreground hover:bg-sidebar">
                <TableHead>Référence</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contrats.map((contrat) => (
                <TableRow
                  key={contrat.id}
                  className="cursor-pointer hover:bg-sky-50/50 transition-colors"
                  onClick={() => handleRowClick(contrat.id)}
                  title="Voir les détails du contrat"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-sky-600" />
                      <span className="font-mono text-xs">{contrat.reference}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="size-4 text-slate-500" />
                      {(contrat as any).clientNom || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 border-emerald-200 text-emerald-700"
                    >
                      <CheckCircle2 className="size-3 mr-1" />
                      {contrat.statut || "Actif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="size-4 text-slate-500" />
                      {formatMontant((contrat as any).montantTotal)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-slate-500" />
                      {formatDate(contrat.dateDebut)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(contrat.dateFin)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

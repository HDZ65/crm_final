"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { BordereauxList } from "@/components/commissions/bordereaux-list"
import { ReprisesList } from "@/components/commissions/reprises-list"
import { DataTable } from "@/components/data-table-basic"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import {
  getCommissionsByOrganisation,
  getBordereauxByOrganisation,
  getReprisesByOrganisation,
} from "@/actions/commissions"
import type {
  CommissionWithDetails,
  BordereauWithDetails,
  RepriseWithDetails,
} from "@/lib/ui/display-types/commission"
import { formatMontant } from "@/lib/ui/helpers/format"
import {
  DollarSign,
  Receipt,
  FolderOpen,
  RotateCcw,
  FileText,
} from "lucide-react"

interface CommercialCommissionsProps {
  commercialId: string
  organisationId: string
  initialCommissions?: any[]
  initialBordereaux?: any[]
}

export function CommercialCommissions({
  commercialId,
  organisationId,
  initialCommissions,
  initialBordereaux,
}: CommercialCommissionsProps) {
  const [activeTab, setActiveTab] = React.useState("commissions")
  const [commissions, setCommissions] = React.useState<CommissionWithDetails[]>(
    (initialCommissions as any as CommissionWithDetails[]) || []
  )
  const [bordereaux, setBordereaux] = React.useState<BordereauWithDetails[]>(
    (initialBordereaux as any as BordereauWithDetails[]) || []
  )
  const [reprises, setReprises] = React.useState<RepriseWithDetails[]>([])
  const [loadingCommissions, setLoadingCommissions] = React.useState(!initialCommissions)
  const [loadingBordereaux, setLoadingBordereaux] = React.useState(!initialBordereaux)
  const [loadingReprises, setLoadingReprises] = React.useState(true)

  // Fetch commissions only if not provided via SSR
  React.useEffect(() => {
    if (initialCommissions) return
    
    const fetchCommissions = async () => {
      setLoadingCommissions(true)
      const result = await getCommissionsByOrganisation({
        organisationId,
        apporteurId: commercialId,
      })
      if (result.data) {
        setCommissions(result.data.commissions as any as CommissionWithDetails[])
      }
      setLoadingCommissions(false)
    }
    fetchCommissions()
  }, [organisationId, commercialId, initialCommissions])

  // Fetch bordereaux only if not provided via SSR
  React.useEffect(() => {
    if (initialBordereaux) return
    
    const fetchBordereaux = async () => {
      setLoadingBordereaux(true)
      const result = await getBordereauxByOrganisation({
        organisationId,
        apporteurId: commercialId,
      })
      if (result.data) {
        setBordereaux(result.data.bordereaux as any as BordereauWithDetails[])
      }
      setLoadingBordereaux(false)
    }
    fetchBordereaux()
  }, [organisationId, commercialId, initialBordereaux])

  // Fetch reprises (always client-side, not critical for initial render)
  React.useEffect(() => {
    const fetchReprises = async () => {
      setLoadingReprises(true)
      const result = await getReprisesByOrganisation({
        organisationId,
        apporteurId: commercialId,
      })
      if (result.data) {
        setReprises(result.data.reprises as any as RepriseWithDetails[])
      }
      setLoadingReprises(false)
    }
    fetchReprises()
  }, [organisationId, commercialId])

  // Commissions table columns
  const commissionsColumns: ColumnDef<CommissionWithDetails>[] = [
    {
      accessorKey: "reference",
      header: "Référence",
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.original.reference}</div>
      ),
    },
    {
      accessorKey: "periode",
      header: "Période",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.periode}
        </Badge>
      ),
    },
    {
      accessorKey: "compagnie",
      header: "Compagnie",
      cell: ({ row }) => <div className="text-sm">{row.original.compagnie}</div>,
    },
    {
      accessorKey: "montantBrut",
      header: "Montant brut",
      cell: ({ row }) => (
        <div className="font-medium text-success">
          {formatMontant(row.original.montantBrut)}
        </div>
      ),
    },
    {
      accessorKey: "montantReprises",
      header: "Reprises",
      cell: ({ row }) => (
        <div className="font-medium text-destructive">
          {formatMontant(row.original.montantReprises)}
        </div>
      ),
    },
    {
      accessorKey: "montantNetAPayer",
      header: "Net à payer",
      cell: ({ row }) => (
        <div className="font-bold text-info">
          {formatMontant(row.original.montantNetAPayer)}
        </div>
      ),
    },
    {
      accessorKey: "statut",
      header: "Statut",
      cell: ({ row }) => {
        const statut = row.original.statut
        return statut ? (
          <Badge variant="outline" className="capitalize">
            {statut.nom}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
  ]

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="size-5" />
          Commissions du commercial
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0">
            <TabsTrigger value="commissions" className="gap-2">
              <DollarSign className="size-4" />
              Commissions
              {commissions.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {commissions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bordereaux" className="gap-2">
              <FolderOpen className="size-4" />
              Bordereaux
              {bordereaux.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {bordereaux.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reprises" className="gap-2">
              <RotateCcw className="size-4" />
              Reprises
              {reprises.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {reprises.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="flex-1 min-h-0 mt-4">
            {loadingCommissions ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : commissions.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <DollarSign className="h-10 w-10 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>Aucune commission</EmptyTitle>
                </EmptyHeader>
                <EmptyContent>
                  <EmptyDescription>
                    Les commissions apparaîtront ici une fois les contrats validés et les calculs effectués.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <DataTable
                columns={commissionsColumns}
                data={commissions}
                headerClassName="bg-sidebar hover:bg-sidebar"
              />
            )}
          </TabsContent>

          {/* Bordereaux Tab */}
          <TabsContent value="bordereaux" className="flex-1 min-h-0 mt-4">
            {loadingBordereaux ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : bordereaux.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>Aucun bordereau</EmptyTitle>
                </EmptyHeader>
                <EmptyContent>
                  <EmptyDescription>
                    Les bordereaux sont générés à partir des commissions sélectionnées.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <BordereauxList bordereaux={bordereaux} loading={loadingBordereaux} />
            )}
          </TabsContent>

          {/* Reprises Tab */}
          <TabsContent value="reprises" className="flex-1 min-h-0 mt-4">
            {loadingReprises ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : reprises.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <RotateCcw className="h-10 w-10 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>Aucune reprise</EmptyTitle>
                </EmptyHeader>
                <EmptyContent>
                  <EmptyDescription>
                    Les reprises apparaîtront ici en cas de résiliation, impayé ou annulation de contrat.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <ReprisesList reprises={reprises} loading={loadingReprises} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

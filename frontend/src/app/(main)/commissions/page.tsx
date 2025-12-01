"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CommissionFilters,
  type CommissionFiltersState,
} from "@/components/commissions/commission-filters"
import { CommissionDetailDialog } from "@/components/commissions/commission-detail-dialog"
import { DeselectionReasonDialog } from "@/components/commissions/deselection-reason-dialog"
import { ReprisesList } from "@/components/commissions/reprises-list"
import { BordereauxList } from "@/components/commissions/bordereaux-list"
import { BaremesList } from "@/components/commissions/baremes-list"
import { ApporteursList, type CreateApporteurData } from "@/components/commissions/apporteurs-list"
import { CalculateCommissionDialog } from "@/components/commissions/calculate-commission-dialog"
import { TriggerRepriseDialog } from "@/components/commissions/trigger-reprise-dialog"
import { DataTable } from "@/components/data-table-basic"
import { createColumns } from "./columns"
import {
  useCommissionsWithDetails,
  useCommissionsSummary,
  useApporteurs,
  useStatutsCommission,
  useGenererBordereau,
  useReprisesCommission,
  useBordereauxWithDetails,
  useBaremesCommission,
  useAnnulerReprise,
  useValiderBordereau,
  useExportBordereauPDF,
  useExportBordereauExcel,
  useCreateApporteur,
  useToggleApporteurActif,
  useDeselectionnerCommission,
  useCommissionConfig,
} from "@/hooks"
import { useOrganisation } from "@/contexts/organisation-context"
import type { CommissionWithDetailsResponseDto, RepriseCommissionResponseDto, ApporteurResponseDto } from "@/types/commission-dto"
import {
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  RotateCcw,
  Loader2,
  AlertCircle,
  Calculator,
  Receipt,
  FolderOpen,
  Users,
  Settings,
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function CommissionsPage() {
  const { activeOrganisation } = useOrganisation()
  const [activeTab, setActiveTab] = React.useState("commissions")
  const [filters, setFilters] = React.useState<CommissionFiltersState>({})
  const [selectedRows, setSelectedRows] = React.useState<Record<string, boolean>>({})
  const [detailCommission, setDetailCommission] =
    React.useState<CommissionWithDetailsResponseDto | null>(null)
  const [showDetailDialog, setShowDetailDialog] = React.useState(false)

  // Dialog de désélection
  const [deselectionDialogOpen, setDeselectionDialogOpen] = React.useState(false)
  const [deselectionTarget, setDeselectionTarget] = React.useState<{
    rowId: string
    ref: string
  } | null>(null)

  // Hooks API - Commissions
  const {
    commissions: apiCommissions,
    loading: loadingCommissions,
    error: errorCommissions,
    refetch: refetchCommissions,
  } = useCommissionsWithDetails(activeOrganisation?.id)

  const { apporteurs, loading: loadingApporteurs, refetch: refetchApporteurs } = useApporteurs(
    activeOrganisation ? { organisationId: activeOrganisation.id } : undefined
  )
  const { statuts, loading: loadingStatuts } = useStatutsCommission()
  const { generer: genererBordereau, loading: loadingGeneration } = useGenererBordereau()

  // Hooks API - Reprises
  const {
    reprises,
    loading: loadingReprises,
    error: errorReprises,
    refetch: refetchReprises,
  } = useReprisesCommission(
    activeOrganisation ? { organisationId: activeOrganisation.id } : undefined
  )

  // Hooks API - Bordereaux
  const {
    bordereaux,
    loading: loadingBordereaux,
    error: errorBordereaux,
    refetch: refetchBordereaux,
  } = useBordereauxWithDetails(activeOrganisation?.id)

  // Hooks API - Barèmes
  const {
    baremes,
    loading: loadingBaremes,
    error: errorBaremes,
    refetch: refetchBaremes,
  } = useBaremesCommission(
    activeOrganisation ? { organisationId: activeOrganisation.id } : undefined
  )

  // Hooks de mutation
  const { annuler: annulerReprise } = useAnnulerReprise()
  const { valider: validerBordereau } = useValiderBordereau()
  const { exportPDF: exportBordereauPDF } = useExportBordereauPDF()
  const { exportExcel: exportBordereauExcel } = useExportBordereauExcel()
  const { create: createApporteur } = useCreateApporteur()
  const { toggle: toggleApporteurActif } = useToggleApporteurActif()
  const { deselectionner: deselectionnerCommission } = useDeselectionnerCommission()

  // Hook de configuration (types dynamiques depuis l'API)
  const { config, loading: loadingConfig } = useCommissionConfig()

  const handleViewDetails = React.useCallback(
    (commission: CommissionWithDetailsResponseDto) => {
      setDetailCommission(commission)
      setShowDetailDialog(true)
    },
    []
  )

  // Gestion de la désélection avec motif
  const handleRowSelectionChange = React.useCallback(
    (newSelection: Record<string, boolean>) => {
      // Détecter si une ligne a été décochée
      const previouslySelected = Object.entries(selectedRows)
        .filter(([, selected]) => selected)
        .map(([id]) => id)

      const nowSelected = Object.entries(newSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => id)

      const deselected = previouslySelected.filter((id) => !nowSelected.includes(id))

      if (deselected.length > 0) {
        // Une ligne a été décochée - trouver la commission correspondante
        const deselectedId = deselected[0]
        const commission = apiCommissions.find((c) => c.id === deselectedId)

        if (commission) {
          // Vérifier si la commission est "présélectionnée" (en_attente)
          const isPreselected = commission.statut?.code?.toLowerCase() === "en_attente"

          if (isPreselected) {
            // Ouvrir le dialog pour demander le motif
            setDeselectionTarget({ rowId: deselectedId, ref: commission.reference })
            setDeselectionDialogOpen(true)
            return // Ne pas mettre à jour la sélection tout de suite
          }
        }
      }

      setSelectedRows(newSelection)
    },
    [selectedRows, apiCommissions]
  )

  const handleDeselectionConfirm = async (reason: string) => {
    if (deselectionTarget) {
      const success = await deselectionnerCommission(deselectionTarget.rowId, reason)

      if (success) {
        toast.success(`Commission ${deselectionTarget.ref} désélectionnée`, {
          description: `Motif: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`,
        })

        // Mettre à jour la sélection
        setSelectedRows((prev) => {
          const newSelection = { ...prev }
          delete newSelection[deselectionTarget.rowId]
          return newSelection
        })
        refetchCommissions()
      } else {
        toast.error("Erreur lors de la désélection", {
          description: "Une erreur est survenue. Veuillez réessayer.",
        })
      }
    }
    setDeselectionTarget(null)
  }

  const columns = React.useMemo(() => createColumns(handleViewDetails), [handleViewDetails])

  // Filtrer les commissions côté client
  const filteredCommissions = React.useMemo(() => {
    return apiCommissions.filter((commission) => {
      if (
        filters.periode &&
        !commission.periode.toLowerCase().includes(filters.periode.toLowerCase())
      ) {
        return false
      }
      if (filters.produit && commission.produit?.nom !== filters.produit) {
        return false
      }
      if (
        filters.compagnie &&
        !commission.compagnie.toLowerCase().includes(filters.compagnie.toLowerCase())
      ) {
        return false
      }
      if (filters.apporteurId && commission.apporteur?.id !== filters.apporteurId) {
        return false
      }
      if (filters.statutId && commission.statut?.id !== filters.statutId) {
        return false
      }
      if (filters.profileType && commission.apporteur?.typeApporteur !== filters.profileType) {
        return false
      }
      if (filters.dateDebut) {
        const dateDebut = new Date(filters.dateDebut)
        const dateCreation = new Date(commission.dateCreation)
        if (dateCreation < dateDebut) return false
      }
      if (filters.dateFin) {
        const dateFin = new Date(filters.dateFin)
        const dateCreation = new Date(commission.dateCreation)
        if (dateCreation > dateFin) return false
      }
      return true
    })
  }, [apiCommissions, filters])

  // Utiliser le hook de summary
  const { globalSummary, selectedSummary, selectedCount } = useCommissionsSummary(
    filteredCommissions,
    selectedRows
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const handleValidateSelection = async () => {
    if (selectedCount === 0) {
      toast.error("Aucune ligne sélectionnée", {
        description: "Veuillez sélectionner au moins une commission à valider.",
      })
      return
    }

    // Récupérer les commissions sélectionnées
    const selectedCommissionIds = Object.entries(selectedRows)
      .filter(([, selected]) => selected)
      .map(([id]) => id)

    // Trouver l'apporteur commun (pour le bordereau)
    const selectedCommissions = filteredCommissions.filter((c) =>
      selectedCommissionIds.includes(c.id)
    )
    const apporteurIds = [...new Set(selectedCommissions.map((c) => c.apporteur?.id).filter(Boolean))]

    if (apporteurIds.length > 1) {
      toast.error("Plusieurs apporteurs sélectionnés", {
        description: "Veuillez sélectionner des commissions d'un seul apporteur pour générer un bordereau.",
      })
      return
    }

    const apporteurId = apporteurIds[0]
    if (!apporteurId) {
      toast.error("Apporteur manquant", {
        description: "Les commissions sélectionnées n'ont pas d'apporteur associé.",
      })
      return
    }

    // Récupérer la période (utiliser la première commission)
    const periode = selectedCommissions[0]?.periode
    if (!periode) {
      toast.error("Période manquante", {
        description: "Impossible de déterminer la période pour le bordereau.",
      })
      return
    }

    try {
      const result = await genererBordereau({
        organisationId: selectedCommissions[0]?.organisationId || "",
        apporteurId,
        periode,
        commissionIds: selectedCommissionIds,
      })

      if (result) {
        toast.success(`Bordereau généré avec succès`, {
          description: `${result.nombreCommissions} commission(s) incluse(s). Total net: ${formatCurrency(result.totalNet)}`,
        })
        setSelectedRows({})
        refetchCommissions()
        refetchBordereaux()
      }
    } catch {
      toast.error("Erreur lors de la génération", {
        description: "Une erreur est survenue lors de la génération du bordereau.",
      })
    }
  }

  const handleExportExcel = () => {
    toast.info("Export Excel en cours...", {
      description: "Le fichier sera téléchargé dans quelques instants.",
    })
    // TODO: Implémenter l'export Excel via l'API
  }

  const handleExportPDF = () => {
    toast.info("Export PDF en cours...", {
      description: "Le bordereau sera généré dans quelques instants.",
    })
    // TODO: Implémenter l'export PDF via l'API
  }

  // Handlers pour les reprises
  const handleCancelReprise = async (repriseId: string, motif: string) => {
    const result = await annulerReprise(repriseId, { motif })

    if (result) {
      toast.success("Reprise annulée", {
        description: `La reprise ${result.reference} a été annulée avec succès.`,
      })
      refetchReprises()
      refetchCommissions()
    } else {
      toast.error("Erreur lors de l'annulation", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      })
    }
  }

  const handleViewRepriseDetails = (reprise: RepriseCommissionResponseDto) => {
    // Afficher les détails dans un toast pour l'instant
    toast.info(`Reprise ${reprise.reference}`, {
      description: `Type: ${reprise.typeReprise} - Montant: ${formatCurrency(reprise.montantReprise)}`,
    })
  }

  const handleRepriseSuccess = () => {
    toast.success("Reprise créée", {
      description: "La reprise a été créée avec succès.",
    })
    refetchReprises()
    refetchCommissions()
  }

  // Handlers pour les bordereaux
  const handleValidateBordereau = async (bordereauId: string) => {
    const result = await validerBordereau(bordereauId)

    if (result) {
      toast.success("Bordereau validé", {
        description: `Le bordereau ${result.reference} a été validé avec succès.`,
      })
      refetchBordereaux()
    } else {
      toast.error("Erreur lors de la validation", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      })
    }
  }

  const handleExportBordereauPDFClick = async (bordereauId: string) => {
    toast.info("Export PDF en cours...", {
      description: "Le fichier sera téléchargé dans quelques instants.",
    })

    const success = await exportBordereauPDF(bordereauId)

    if (success) {
      toast.success("Export PDF terminé", {
        description: "Le fichier a été téléchargé.",
      })
    } else {
      toast.error("Erreur lors de l'export PDF", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      })
    }
  }

  const handleExportBordereauExcelClick = async (bordereauId: string) => {
    toast.info("Export Excel en cours...", {
      description: "Le fichier sera téléchargé dans quelques instants.",
    })

    const success = await exportBordereauExcel(bordereauId)

    if (success) {
      toast.success("Export Excel terminé", {
        description: "Le fichier a été téléchargé.",
      })
    } else {
      toast.error("Erreur lors de l'export Excel", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      })
    }
  }

  // Handlers pour les apporteurs
  const handleCreateApporteur = async (data: CreateApporteurData) => {
    if (!activeOrganisation) return

    const result = await createApporteur({
      organisationId: activeOrganisation.id,
      nom: data.nom,
      prenom: data.prenom,
      typeApporteur: data.typeApporteur,
      email: data.email || undefined,
      telephone: data.telephone || undefined,
    })

    if (result) {
      toast.success("Apporteur créé", {
        description: `${result.prenom} ${result.nom} a été créé avec succès.`,
      })
      refetchApporteurs()
    } else {
      toast.error("Erreur lors de la création", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      })
    }
  }

  const handleToggleApporteurActive = async (apporteurId: string, active: boolean) => {
    const result = await toggleApporteurActif(apporteurId, active)

    if (result) {
      toast.success(active ? "Apporteur activé" : "Apporteur désactivé", {
        description: `${result.prenom} ${result.nom} a été ${active ? "activé" : "désactivé"}.`,
      })
      refetchApporteurs()
    } else {
      toast.error("Erreur lors de la modification", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      })
    }
  }

  const handleEditApporteur = (apporteur: ApporteurResponseDto) => {
    // Pour l'instant, afficher un toast avec les infos
    toast.info(`Modifier ${apporteur.prenom} ${apporteur.nom}`, {
      description: "Fonctionnalité d'édition à implémenter via un dialog.",
    })
  }


  // Compteurs pour les badges des onglets
  const reprisesEnAttente = reprises.filter((r) => r.statutReprise === "en_attente").length
  const bordereauxBrouillon = bordereaux.filter((b) => b.statutBordereau === "brouillon").length

  // Afficher une erreur si le chargement échoue
  if (errorCommissions) {
    return (
      <main className="flex flex-1 flex-col p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            Impossible de charger les commissions. {errorCommissions.message}
            <Button variant="outline" size="sm" className="ml-4" onClick={() => refetchCommissions()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col">
      <div
        className="min-h-0 flex-1 gap-4 flex flex-col overflow-hidden"
        style={{ height: "calc(100dvh - var(--header-height))" }}
      >
        {/* Panneau de récapitulatif */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 shrink-0">
          <SummaryCard
            title="Total Brut"
            icon={<TrendingUp className="size-4 text-muted-foreground" />}
            value={formatCurrency(globalSummary.totalBrut)}
            valueClassName="text-success"
            selectedValue={selectedCount > 0 ? formatCurrency(selectedSummary.totalBrut) : undefined}
            loading={loadingCommissions}
          />

          <SummaryCard
            title="Reprises"
            icon={<RotateCcw className="size-4 text-muted-foreground" />}
            value={formatCurrency(-globalSummary.totalReprises)}
            valueClassName="text-destructive"
            selectedValue={
              selectedCount > 0 ? formatCurrency(-selectedSummary.totalReprises) : undefined
            }
            loading={loadingCommissions}
          />

          <SummaryCard
            title="Acomptes"
            icon={<TrendingDown className="size-4 text-muted-foreground" />}
            value={formatCurrency(-globalSummary.totalAcomptes)}
            valueClassName="text-warning"
            selectedValue={
              selectedCount > 0 ? formatCurrency(-selectedSummary.totalAcomptes) : undefined
            }
            loading={loadingCommissions}
          />

          <SummaryCard
            title="Net à payer"
            icon={<DollarSign className="size-4 text-muted-foreground" />}
            value={formatCurrency(globalSummary.totalNet)}
            valueClassName="text-info"
            selectedValue={selectedCount > 0 ? formatCurrency(selectedSummary.totalNet) : undefined}
            loading={loadingCommissions}
          />

          <SummaryCard
            title="Lignes"
            icon={<Wallet className="size-4 text-muted-foreground" />}
            value={String(globalSummary.nombreLignes)}
            valueClassName="text-foreground"
            selectedValue={selectedCount > 0 ? `Sélectionnées: ${selectedCount}` : undefined}
            loading={loadingCommissions}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0 flex-wrap">
          <Button
            onClick={handleValidateSelection}
            disabled={selectedCount === 0 || loadingGeneration}
            className="gap-2"
          >
            {loadingGeneration ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Valider la sélection ({selectedCount})
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <FileSpreadsheet className="size-4" />
            Exporter Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <FileText className="size-4" />
            Exporter PDF
          </Button>
          <CalculateCommissionDialog
            trigger={
              <Button variant="outline" className="gap-2">
                <Calculator className="size-4" />
                Tester un calcul
              </Button>
            }
            typesProduit={config.typesProduit}
            loadingConfig={loadingConfig}
          />
          <TriggerRepriseDialog
            onSuccess={handleRepriseSuccess}
            typesReprise={config.typesReprise}
            loadingConfig={loadingConfig}
          />
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="shrink-0 w-fit">
            <TabsTrigger value="commissions" className="gap-2">
              <Receipt className="size-4" />
              Commissions
              <Badge variant="secondary" className="ml-1">
                {filteredCommissions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="bordereaux" className="gap-2">
              <FolderOpen className="size-4" />
              Bordereaux
              {bordereauxBrouillon > 0 && (
                <Badge variant="default" className="ml-1 bg-warning text-warning-foreground">
                  {bordereauxBrouillon}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reprises" className="gap-2">
              <RotateCcw className="size-4" />
              Reprises
              {reprisesEnAttente > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {reprisesEnAttente}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="apporteurs" className="gap-2">
              <Users className="size-4" />
              Apporteurs
              <Badge variant="secondary" className="ml-1">
                {apporteurs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="baremes" className="gap-2">
              <Settings className="size-4" />
              Barèmes
              <Badge variant="secondary" className="ml-1">
                {baremes.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Commissions */}
          <TabsContent value="commissions" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 bg-card border-border flex flex-col h-full">
              <CardContent className="flex-1 min-h-0 flex flex-col gap-4 pt-4">
                {/* Filtres */}
                <CommissionFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  apporteurs={apporteurs}
                  statuts={statuts}
                  loadingApporteurs={loadingApporteurs}
                  loadingStatuts={loadingStatuts}
                />

                {/* Table */}
                <div className="flex-1 min-h-0 flex flex-col">
                  {loadingCommissions ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <DataTable
                      columns={columns}
                      data={filteredCommissions}
                      headerClassName="bg-sidebar hover:bg-sidebar"
                      onRowSelectionChange={handleRowSelectionChange}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Bordereaux */}
          <TabsContent value="bordereaux" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 bg-card border-border flex flex-col h-full">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="size-4" />
                  Bordereaux de commission
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 flex flex-col">
                {errorBordereaux ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>
                      {errorBordereaux.message}
                      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetchBordereaux()}>
                        Réessayer
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <BordereauxList
                    bordereaux={bordereaux}
                    loading={loadingBordereaux}
                    onValidate={handleValidateBordereau}
                    onExportPDF={handleExportBordereauPDFClick}
                    onExportExcel={handleExportBordereauExcelClick}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Reprises */}
          <TabsContent value="reprises" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 bg-card border-border flex flex-col h-full">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <RotateCcw className="size-4" />
                  Reprises de commission
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 flex flex-col">
                {errorReprises ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>
                      {errorReprises.message}
                      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetchReprises()}>
                        Réessayer
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ReprisesList
                    reprises={reprises}
                    loading={loadingReprises}
                    onCancel={handleCancelReprise}
                    onViewDetails={handleViewRepriseDetails}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Apporteurs */}
          <TabsContent value="apporteurs" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 bg-card border-border flex flex-col h-full">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="size-4" />
                  Gestion des apporteurs
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 flex flex-col">
                <ApporteursList
                  apporteurs={apporteurs}
                  typesApporteur={config.typesApporteur}
                  loading={loadingApporteurs}
                  loadingConfig={loadingConfig}
                  onCreate={handleCreateApporteur}
                  onEdit={handleEditApporteur}
                  onToggleActive={handleToggleApporteurActive}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Barèmes */}
          <TabsContent value="baremes" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 bg-card border-border flex flex-col h-full">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="size-4" />
                  Configuration des barèmes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 flex flex-col">
                {errorBaremes ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>
                      {errorBaremes.message}
                      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetchBaremes()}>
                        Réessayer
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <BaremesList
                    baremes={baremes}
                    typesCalcul={config.typesCalcul}
                    typesBase={config.typesBase}
                    typesProduit={config.typesProduit}
                    typesApporteur={config.typesApporteur}
                    loading={loadingBaremes}
                    loadingConfig={loadingConfig}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de détail commission */}
        <CommissionDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          commission={detailCommission}
        />

        {/* Modal de désélection avec motif */}
        <DeselectionReasonDialog
          open={deselectionDialogOpen}
          onOpenChange={setDeselectionDialogOpen}
          onConfirm={handleDeselectionConfirm}
          commissionRef={deselectionTarget?.ref || ""}
        />
      </div>
    </main>
  )
}

// Composant de carte de résumé
interface SummaryCardProps {
  title: string
  icon: React.ReactNode
  value: string
  valueClassName: string
  selectedValue?: string
  loading?: boolean
}

function SummaryCard({
  title,
  icon,
  value,
  valueClassName,
  selectedValue,
  loading,
}: SummaryCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
            {selectedValue && (
              <p className="text-xs text-muted-foreground mt-1">Sélection: {selectedValue}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

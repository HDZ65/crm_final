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
import { CalculateCommissionDialog } from "@/components/commissions/calculate-commission-dialog"
import { TriggerRepriseDialog } from "@/components/commissions/trigger-reprise-dialog"
import { CommissionConfigDialog } from "@/components/commissions/commission-config-dialog"
import { DataTable } from "@/components/data-table-basic"
import { createColumns } from "./columns"
import {
  getCommissionsByOrganisation,
  getBordereauxByOrganisation,
  getReprisesByOrganisation,
  genererBordereau as genererBordereauAction,
  validerBordereau as validerBordereauAction,
  exportBordereau as exportBordereauAction,
  annulerReprise as annulerRepriseAction,
  deselectionnerCommission as deselectionnerCommissionAction,
} from "@/actions/commissions"
import { getApporteursByOrganisation } from "@/actions/commerciaux"
import { useOrganisation } from "@/contexts/organisation-context"
import type { CommissionWithDetailsResponseDto, RepriseCommissionResponseDto, BordereauWithDetailsResponseDto, ApporteurResponseDto, StatutCommissionResponseDto } from "@/types/commission"
import {
  CheckCircle2,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  AlertCircle,
  Calculator,
  Receipt,
  FolderOpen,
  Settings,
  Users,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// Import types for SSR data
import type { Commission, Reprise, Bordereau } from "@proto-frontend/commission/commission"
import type { Apporteur } from "@proto-frontend/commerciaux/commerciaux"

// Simple type for statuts from server action
interface SimpleStatut {
  id: string
  code: string
  nom: string
}

interface CommissionsPageClientProps {
  initialStatuts: SimpleStatut[]
  initialCommissions?: Commission[] | null
  initialApporteurs?: Apporteur[] | null
  initialReprises?: Reprise[] | null
  initialBordereaux?: Bordereau[] | null
}

export function CommissionsPageClient({
  initialStatuts,
  initialCommissions,
  initialApporteurs,
  initialReprises,
  initialBordereaux,
}: CommissionsPageClientProps) {
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

  // Refs to track initial fetch
  const hasFetchedCommissions = React.useRef(!!initialCommissions)
  const hasFetchedApporteurs = React.useRef(!!initialApporteurs)
  const hasFetchedReprises = React.useRef(!!initialReprises)
  const hasFetchedBordereaux = React.useRef(!!initialBordereaux)

  // Helper to map commissions from gRPC format
  const mapCommission = React.useCallback((c: Commission): CommissionWithDetailsResponseDto => ({
    id: c.id,
    reference: c.reference,
    organisationId: c.organisationId,
    apporteurId: c.apporteurId,
    contratId: c.contratId,
    periode: c.periode,
    compagnie: c.compagnie,
    typeBase: c.typeBase,
    produit: null,
    apporteur: null,
    contrat: null,
    montantBrut: Number(c.montantBrut) || 0,
    montantReprises: Number(c.montantReprises) || 0,
    montantAcomptes: Number(c.montantAcomptes) || 0,
    montantNetAPayer: Number(c.montantNetAPayer) || 0,
    statut: null,
    dateCreation: c.dateCreation,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }) as unknown as CommissionWithDetailsResponseDto, [])

  // Helper to map apporteurs from gRPC format
  const mapApporteur = React.useCallback((a: Apporteur): ApporteurResponseDto => ({
    id: a.id,
    nom: a.nom,
    prenom: a.prenom,
    email: a.email,
    telephone: a.telephone,
    typeApporteur: a.typeApporteur as "interne" | "externe" | "partenaire",
    organisationId: a.organisationId,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }) as ApporteurResponseDto, [])

  // State pour les données - initialize with SSR data if available
  const [apiCommissions, setApiCommissions] = React.useState<CommissionWithDetailsResponseDto[]>(
    initialCommissions ? initialCommissions.map(mapCommission) : []
  )
  const [loadingCommissions, setLoadingCommissions] = React.useState(!initialCommissions)
  const [errorCommissions, setErrorCommissions] = React.useState<Error | null>(null)

  const [apporteurs, setApporteurs] = React.useState<ApporteurResponseDto[]>(
    initialApporteurs ? initialApporteurs.map(mapApporteur) : []
  )
  const [loadingApporteurs, setLoadingApporteurs] = React.useState(!initialApporteurs)

  // Mapper les statuts depuis les props
  const statuts = React.useMemo((): StatutCommissionResponseDto[] =>
    initialStatuts.map((s) => ({
      id: s.id,
      code: s.code,
      nom: s.nom,
      ordreAffichage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    [initialStatuts]
  )
  const loadingStatuts = false

  const [loadingGeneration, setLoadingGeneration] = React.useState(false)

  // Helper to map reprises from gRPC format
  const mapReprise = React.useCallback((r: Reprise): RepriseCommissionResponseDto => ({
    id: r.id,
    reference: r.reference,
    organisationId: r.organisationId,
    commissionOriginaleId: r.commissionOriginaleId,
    contratId: r.contratId,
    apporteurId: r.apporteurId,
    typeReprise: String(r.typeReprise).replace("TYPE_REPRISE_", "").toLowerCase() as "resiliation" | "impaye" | "annulation" | "regularisation",
    montantReprise: Number(r.montantReprise) || 0,
    tauxReprise: Number(r.tauxReprise) || 0,
    montantOriginal: Number(r.montantOriginal) || 0,
    periodeOrigine: r.periodeOrigine,
    periodeApplication: r.periodeApplication,
    dateEvenement: r.dateEvenement,
    dateLimite: r.dateLimite,
    statutReprise: String(r.statutReprise).replace("STATUT_REPRISE_", "").toLowerCase() as "en_attente" | "appliquee" | "annulee",
    motif: r.motif,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }) as unknown as RepriseCommissionResponseDto, [])

  // Helper to map bordereaux from gRPC format
  const mapBordereau = React.useCallback((b: Bordereau): BordereauWithDetailsResponseDto => ({
    id: b.id,
    reference: b.reference,
    organisationId: b.organisationId,
    apporteurId: b.apporteurId,
    apporteur: null,
    periode: b.periode,
    statutBordereau: String(b.statutBordereau).replace("STATUT_BORDEREAU_", "").toLowerCase() as "brouillon" | "valide" | "exporte" | "archive",
    nombreCommissions: b.nombreLignes,
    totalBrut: Number(b.totalBrut) || 0,
    totalReprises: Number(b.totalReprises) || 0,
    totalAcomptes: Number(b.totalAcomptes) || 0,
    totalNetAPayer: Number(b.totalNetAPayer) || 0,
    dateValidation: b.dateValidation,
    dateExport: b.dateExport,
    fichierPdfUrl: b.fichierPdfUrl,
    fichierExcelUrl: b.fichierExcelUrl,
    commentaire: b.commentaire,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    lignes: [],
  }) as unknown as BordereauWithDetailsResponseDto, [])

  const [reprisesData, setReprisesData] = React.useState<RepriseCommissionResponseDto[]>(
    initialReprises ? initialReprises.map(mapReprise) : []
  )
  const [loadingReprises, setLoadingReprises] = React.useState(!initialReprises)
  const [errorReprises, setErrorReprises] = React.useState<Error | null>(null)

  const [bordereauxData, setBordereauxData] = React.useState<BordereauWithDetailsResponseDto[]>(
    initialBordereaux ? initialBordereaux.map(mapBordereau) : []
  )
  const [loadingBordereaux, setLoadingBordereaux] = React.useState(!initialBordereaux)
  const [errorBordereaux, setErrorBordereaux] = React.useState<Error | null>(null)

  // Config statique pour le moment
  const config = React.useMemo(() => ({
    typesProduit: [
      { value: "assurance_vie", label: "Assurance Vie" },
      { value: "prevoyance", label: "Prévoyance" },
      { value: "epargne", label: "Épargne" },
      { value: "retraite", label: "Retraite" },
    ],
    typesReprise: [
      { value: "resiliation", label: "Résiliation" },
      { value: "impaye", label: "Impayé" },
      { value: "annulation", label: "Annulation" },
      { value: "regularisation", label: "Régularisation" },
    ],
  }), [])
  const loadingConfig = false

  // Fetch des commissions
  const refetchCommissions = React.useCallback(async () => {
    if (!activeOrganisation) return
    setLoadingCommissions(true)
    setErrorCommissions(null)
    const result = await getCommissionsByOrganisation({
      organisationId: activeOrganisation.organisationId,
    })
    if (result.error) {
      setErrorCommissions(new Error(result.error))
    } else if (result.data) {
      setApiCommissions(result.data.commissions.map((c) => ({
        id: c.id,
        reference: c.reference,
        organisationId: c.organisationId,
        apporteurId: c.apporteurId,
        contratId: c.contratId,
        periode: c.periode,
        compagnie: c.compagnie,
        typeBase: c.typeBase,
        produit: null,
        apporteur: null,
        contrat: null,
        montantBrut: Number(c.montantBrut) || 0,
        montantReprises: Number(c.montantReprises) || 0,
        montantAcomptes: Number(c.montantAcomptes) || 0,
        montantNetAPayer: Number(c.montantNetAPayer) || 0,
        statut: null,
        dateCreation: c.dateCreation,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })) as unknown as CommissionWithDetailsResponseDto[])
    }
    setLoadingCommissions(false)
  }, [activeOrganisation])

  // Fetch des apporteurs
  const fetchApporteurs = React.useCallback(async () => {
    if (!activeOrganisation) return
    setLoadingApporteurs(true)
    const result = await getApporteursByOrganisation(activeOrganisation.organisationId)
    if (result.data) {
      setApporteurs(result.data.apporteurs.map((a) => ({
        id: a.id,
        nom: a.nom,
        prenom: a.prenom,
        email: a.email,
        telephone: a.telephone,
        typeApporteur: a.typeApporteur as "interne" | "externe" | "partenaire",
        organisationId: a.organisationId,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })) as ApporteurResponseDto[])
    }
    setLoadingApporteurs(false)
  }, [activeOrganisation])

  // Fetch des reprises
  const refetchReprises = React.useCallback(async () => {
    if (!activeOrganisation) return
    setLoadingReprises(true)
    setErrorReprises(null)
    const result = await getReprisesByOrganisation({
      organisationId: activeOrganisation.organisationId,
    })
    if (result.error) {
      setErrorReprises(new Error(result.error))
    } else if (result.data) {
      setReprisesData(result.data.reprises.map((r) => ({
        id: r.id,
        reference: r.reference,
        organisationId: r.organisationId,
        commissionOriginaleId: r.commissionOriginaleId,
        contratId: r.contratId,
        apporteurId: r.apporteurId,
        typeReprise: String(r.typeReprise).replace("TYPE_REPRISE_", "").toLowerCase() as "resiliation" | "impaye" | "annulation" | "regularisation",
        montantReprise: Number(r.montantReprise) || 0,
        tauxReprise: Number(r.tauxReprise) || 0,
        montantOriginal: Number(r.montantOriginal) || 0,
        periodeOrigine: r.periodeOrigine,
        periodeApplication: r.periodeApplication,
        dateEvenement: r.dateEvenement,
        dateLimite: r.dateLimite,
        statutReprise: String(r.statutReprise).replace("STATUT_REPRISE_", "").toLowerCase() as "en_attente" | "appliquee" | "annulee",
        motif: r.motif,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })) as unknown as RepriseCommissionResponseDto[])
    }
    setLoadingReprises(false)
  }, [activeOrganisation])

  // Fetch des bordereaux
  const refetchBordereaux = React.useCallback(async () => {
    if (!activeOrganisation) return
    setLoadingBordereaux(true)
    setErrorBordereaux(null)
    const result = await getBordereauxByOrganisation({
      organisationId: activeOrganisation.organisationId,
    })
    if (result.error) {
      setErrorBordereaux(new Error(result.error))
    } else if (result.data) {
      setBordereauxData(result.data.bordereaux.map((b) => ({
        id: b.id,
        reference: b.reference,
        organisationId: b.organisationId,
        apporteurId: b.apporteurId,
        apporteur: null,
        periode: b.periode,
        statutBordereau: String(b.statutBordereau).replace("STATUT_BORDEREAU_", "").toLowerCase() as "brouillon" | "valide" | "exporte" | "archive",
        nombreCommissions: b.nombreLignes,
        totalBrut: Number(b.totalBrut) || 0,
        totalReprises: Number(b.totalReprises) || 0,
        totalAcomptes: Number(b.totalAcomptes) || 0,
        totalNetAPayer: Number(b.totalNetAPayer) || 0,
        dateValidation: b.dateValidation,
        dateExport: b.dateExport,
        fichierPdfUrl: b.fichierPdfUrl,
        fichierExcelUrl: b.fichierExcelUrl,
        commentaire: b.commentaire,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        lignes: [],
      })) as unknown as BordereauWithDetailsResponseDto[])
    }
    setLoadingBordereaux(false)
  }, [activeOrganisation])

  // Initial fetch when organisation becomes available - skip if SSR data provided
  React.useEffect(() => {
    if (!activeOrganisation) return

    if (!hasFetchedCommissions.current) {
      hasFetchedCommissions.current = true
      refetchCommissions()
    }
    if (!hasFetchedApporteurs.current) {
      hasFetchedApporteurs.current = true
      fetchApporteurs()
    }
    if (!hasFetchedReprises.current) {
      hasFetchedReprises.current = true
      refetchReprises()
    }
    if (!hasFetchedBordereaux.current) {
      hasFetchedBordereaux.current = true
      refetchBordereaux()
    }
  }, [activeOrganisation, refetchCommissions, fetchApporteurs, refetchReprises, refetchBordereaux])

  // Les données sont déjà formatées dans les callbacks de fetch
  const reprises = reprisesData
  const bordereaux = bordereauxData

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
      const previouslySelected = Object.entries(selectedRows)
        .filter(([, selected]) => selected)
        .map(([id]) => id)

      const nowSelected = Object.entries(newSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => id)

      const deselected = previouslySelected.filter((id) => !nowSelected.includes(id))

      if (deselected.length > 0) {
        const deselectedId = deselected[0]
        const commission = apiCommissions.find((c) => c.id === deselectedId)

        if (commission) {
          const isPreselected = commission.statut?.code?.toLowerCase() === "en_attente"

          if (isPreselected) {
            setDeselectionTarget({ rowId: deselectedId, ref: commission.reference })
            setDeselectionDialogOpen(true)
            return
          }
        }
      }

      setSelectedRows(newSelection)
    },
    [selectedRows, apiCommissions]
  )

  const handleDeselectionConfirm = async (reason: string) => {
    if (deselectionTarget) {
      const statutDeselectionnee = statuts.find(s => s.code === "deselectionnee")?.id || ""
      const result = await deselectionnerCommissionAction(deselectionTarget.rowId, statutDeselectionnee)

      if (result.data) {
        toast.success(`Commission ${deselectionTarget.ref} désélectionnée`)
        setSelectedRows((prev) => {
          const newSelection = { ...prev }
          delete newSelection[deselectionTarget.rowId]
          return newSelection
        })
        refetchCommissions()
      } else {
        toast.error(result.error || "Erreur lors de la désélection")
      }
    }
    setDeselectionTarget(null)
  }

  const columns = React.useMemo(() => createColumns(handleViewDetails), [handleViewDetails])

  // Filtrer les commissions côté client
  const filteredCommissions = React.useMemo(() => {
    return apiCommissions.filter((commission) => {
      if (filters.produit && commission.produit?.nom !== filters.produit) return false
      if (filters.compagnie && !commission.compagnie.toLowerCase().includes(filters.compagnie.toLowerCase())) return false
      if (filters.apporteurId && commission.apporteur?.id !== filters.apporteurId) return false
      if (filters.statutId && commission.statut?.id !== filters.statutId) return false
      if (filters.profileType && commission.apporteur?.typeApporteur !== filters.profileType) return false
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

  // Calcul des résumés localement
  const { globalSummary, selectedSummary, selectedCount } = React.useMemo(() => {
    const globalSummary = filteredCommissions.reduce(
      (acc, c) => ({
        totalBrut: acc.totalBrut + (c.montantBrut || 0),
        totalReprises: acc.totalReprises + (c.montantReprises || 0),
        totalNet: acc.totalNet + (c.montantNetAPayer || 0),
      }),
      { totalBrut: 0, totalReprises: 0, totalNet: 0 }
    )

    const selectedIds = Object.entries(selectedRows)
      .filter(([, selected]) => selected)
      .map(([id]) => id)

    const selectedCommissions = filteredCommissions.filter((c) => selectedIds.includes(c.id))

    const selectedSummary = selectedCommissions.reduce(
      (acc, c) => ({
        totalBrut: acc.totalBrut + (c.montantBrut || 0),
        totalReprises: acc.totalReprises + (c.montantReprises || 0),
        totalNet: acc.totalNet + (c.montantNetAPayer || 0),
      }),
      { totalBrut: 0, totalReprises: 0, totalNet: 0 }
    )

    return { globalSummary, selectedSummary, selectedCount: selectedIds.length }
  }, [filteredCommissions, selectedRows])

  // Compter les apporteurs uniques
  const uniqueApporteursCount = React.useMemo(() => {
    const uniqueIds = new Set(filteredCommissions.map(c => c.apporteur?.id).filter(Boolean))
    return uniqueIds.size
  }, [filteredCommissions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)
  }

  const handleValidateSelection = async () => {
    if (selectedCount === 0) {
      toast.error("Aucune ligne sélectionnée")
      return
    }

    const selectedCommissionIds = Object.entries(selectedRows)
      .filter(([, selected]) => selected)
      .map(([id]) => id)

    const selectedCommissions = filteredCommissions.filter((c) => selectedCommissionIds.includes(c.id))
    const apporteurIds = [...new Set(selectedCommissions.map((c) => c.apporteur?.id).filter(Boolean))]

    if (apporteurIds.length > 1) {
      toast.error("Veuillez sélectionner des commissions d'un seul apporteur")
      return
    }

    const apporteurId = apporteurIds[0]
    if (!apporteurId) {
      toast.error("Les commissions sélectionnées n'ont pas d'apporteur associé")
      return
    }

    const periode = selectedCommissions[0]?.periode
    if (!periode) {
      toast.error("Impossible de déterminer la période")
      return
    }

    setLoadingGeneration(true)
    try {
      const result = await genererBordereauAction({
        organisationId: selectedCommissions[0]?.organisationId || "",
        apporteurId,
        periode,
      })

      if (result.data?.summary) {
        toast.success(`Bordereau généré: ${result.data.summary.nombreCommissions} commission(s), ${formatCurrency(Number(result.data.summary.totalNet) || 0)}`)
        setSelectedRows({})
        refetchCommissions()
        refetchBordereaux()
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch {
      toast.error("Erreur lors de la génération du bordereau")
    } finally {
      setLoadingGeneration(false)
    }
  }

  // Export Excel des commissions filtrées
  const handleExportExcel = () => {
    if (filteredCommissions.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }

    const headers = ["Référence", "Période", "Compagnie", "Produit", "Apporteur", "Montant Brut", "Reprises", "Net"]
    const rows = filteredCommissions.map((c) => [
      c.reference,
      c.periode,
      c.compagnie,
      c.produit?.nom || "",
      c.apporteur ? `${c.apporteur.prenom} ${c.apporteur.nom}` : "",
      c.montantBrut.toFixed(2),
      c.montantReprises.toFixed(2),
      c.montantNetAPayer.toFixed(2),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(";")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `commissions_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success("Export terminé", {
      description: `${filteredCommissions.length} commissions exportées`,
    })
  }

  // Handlers reprises
  const handleCancelReprise = async (repriseId: string, _motif: string) => {
    const result = await annulerRepriseAction(repriseId)
    if (result.data?.reprise) {
      toast.success(`Reprise ${result.data.reprise.reference} annulée`)
      refetchReprises()
      refetchCommissions()
    } else {
      toast.error(result.error || "Erreur lors de l'annulation")
    }
  }

  const handleViewRepriseDetails = (reprise: RepriseCommissionResponseDto) => {
    toast.info(`Reprise ${reprise.reference}`, {
      description: `Type: ${reprise.typeReprise} - Montant: ${formatCurrency(reprise.montantReprise)}`,
    })
  }

  const handleRepriseSuccess = () => {
    toast.success("Reprise créée")
    refetchReprises()
    refetchCommissions()
  }

  // Handlers bordereaux
  const handleValidateBordereau = async (bordereauId: string) => {
    const validateurId = "current-user-id"
    const result = await validerBordereauAction(bordereauId, validateurId)
    if (result.data?.bordereau) {
      toast.success(`Bordereau ${result.data.bordereau.reference} validé`)
      refetchBordereaux()
    } else {
      toast.error(result.error || "Erreur lors de la validation")
    }
  }

  const handleExportBordereauPDFClick = async (bordereauId: string) => {
    const result = await exportBordereauAction(bordereauId)
    if (result.data?.success && result.data.pdfUrl) {
      window.open(result.data.pdfUrl, "_blank")
      toast.success("Export PDF terminé")
    } else {
      toast.error(result.error || "Erreur lors de l'export PDF")
    }
  }

  const handleExportBordereauExcelClick = async (bordereauId: string) => {
    const result = await exportBordereauAction(bordereauId)
    if (result.data?.success && result.data.excelUrl) {
      window.open(result.data.excelUrl, "_blank")
      toast.success("Export Excel terminé")
    } else {
      toast.error(result.error || "Erreur lors de l'export Excel")
    }
  }

  const reprisesEnAttente = reprises.filter((r) => r.statutReprise === "en_attente").length
  const bordereauxBrouillon = bordereaux.filter((b) => b.statutBordereau === "brouillon").length

  if (errorCommissions) {
    return (
      <main className="flex flex-1 flex-col p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            {errorCommissions.message}
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
        {/* Cartes de résumé - 4 cartes seulement */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
          <SummaryCard
            title="Total Brut"
            icon={<TrendingUp className="size-4 text-emerald-600" />}
            value={formatCurrency(globalSummary.totalBrut)}
            valueClassName="text-emerald-600"
            selectedValue={selectedCount > 0 ? formatCurrency(selectedSummary.totalBrut) : undefined}
            loading={loadingCommissions}
          />
          <SummaryCard
            title="Reprises"
            icon={<TrendingDown className="size-4 text-red-600" />}
            value={formatCurrency(-globalSummary.totalReprises)}
            valueClassName="text-red-600"
            selectedValue={selectedCount > 0 ? formatCurrency(-selectedSummary.totalReprises) : undefined}
            loading={loadingCommissions}
          />
          <SummaryCard
            title="Net à payer"
            icon={<DollarSign className="size-4 text-blue-600" />}
            value={formatCurrency(globalSummary.totalNet)}
            valueClassName="text-blue-600"
            selectedValue={selectedCount > 0 ? formatCurrency(selectedSummary.totalNet) : undefined}
            loading={loadingCommissions}
          />
          <SummaryCard
            title="Apporteurs"
            icon={<Users className="size-4 text-purple-600" />}
            value={String(uniqueApporteursCount)}
            valueClassName="text-purple-600"
            selectedValue={selectedCount > 0 ? `${selectedCount} ligne(s)` : undefined}
            loading={loadingCommissions}
          />
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center gap-4 shrink-0">
            <TabsList className="w-fit">
              <TabsTrigger value="commissions" className="gap-2">
                <Receipt className="size-4" />
                Commissions
                <Badge variant="secondary" className="ml-1">{filteredCommissions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="bordereaux" className="gap-2">
                <FolderOpen className="size-4" />
                Bordereaux
                {bordereauxBrouillon > 0 && (
                  <Badge variant="default" className="ml-1 bg-amber-500 text-white">{bordereauxBrouillon}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reprises" className="gap-2">
                <RotateCcw className="size-4" />
                Reprises
                {reprisesEnAttente > 0 && <Badge variant="destructive" className="ml-1">{reprisesEnAttente}</Badge>}
              </TabsTrigger>
            </TabsList>
            <CommissionConfigDialog
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="size-4" />
                  Configuration
                </Button>
              }
            />
          </div>

          {/* Onglet Commissions */}
          <TabsContent value="commissions" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 flex flex-col h-full">
              <CardContent className="flex-1 min-h-0 flex flex-col gap-4 pt-4">
                {/* Actions spécifiques à cet onglet */}
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <CommissionFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    apporteurs={apporteurs}
                    statuts={statuts}
                    loadingApporteurs={loadingApporteurs}
                    loadingStatuts={loadingStatuts}
                  />
                </div>

                {/* Barre d'actions */}
                <div className="flex items-center justify-between shrink-0">
                  <div className="text-sm text-muted-foreground">
                    {filteredCommissions.length} commission{filteredCommissions.length > 1 ? "s" : ""}
                    {selectedCount > 0 && ` • ${selectedCount} sélectionnée${selectedCount > 1 ? "s" : ""}`}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleValidateSelection}
                      disabled={selectedCount === 0 || loadingGeneration}
                      className="gap-2"
                    >
                      <CheckCircle2 className="size-4" />
                      Générer bordereau ({selectedCount})
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
                      <FileSpreadsheet className="size-4" />
                      Excel
                    </Button>
                    <CalculateCommissionDialog
                      trigger={
                        <Button variant="outline" className="gap-2">
                          <Calculator className="size-4" />
                          Simuler calcul
                        </Button>
                      }
                      typesProduit={config.typesProduit}
                      loadingConfig={loadingConfig}
                    />
                    <TriggerRepriseDialog
                      onSuccess={handleRepriseSuccess}
                      typesReprise={config.typesReprise}
                      loadingConfig={loadingConfig}
                      trigger={
                        <Button variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
                          <AlertTriangle className="size-4" />
                          Déclencher reprise
                        </Button>
                      }
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <DataTable
                    columns={columns}
                    data={filteredCommissions}
                    headerClassName="bg-sidebar hover:bg-sidebar"
                    onRowSelectionChange={handleRowSelectionChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Bordereaux */}
          <TabsContent value="bordereaux" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 flex flex-col h-full">
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
            <Card className="flex-1 min-h-0 flex flex-col h-full">
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
        </Tabs>

        <CommissionDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          commission={detailCommission}
        />

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

interface SummaryCardProps {
  title: string
  icon: React.ReactNode
  value: string
  valueClassName: string
  selectedValue?: string
  loading?: boolean
}

function SummaryCard({ title, icon, value, valueClassName, selectedValue, loading }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
        {selectedValue && <p className="text-xs text-muted-foreground mt-1">Sélection: {selectedValue}</p>}
      </CardContent>
    </Card>
  )
}

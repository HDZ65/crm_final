"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import {
  CommissionFilters,
  type CommissionFiltersState,
} from "@/components/commissions/commission-filters"
import { CommissionDetailDialog } from "@/components/commissions/commission-detail-dialog"
import { DeselectionReasonDialog } from "@/components/commissions/deselection-reason-dialog"
import { ReprisesList } from "@/components/commissions/reprises-list"
import { ContestationsList } from "@/components/commissions/contestations-list"
import { BordereauxList } from "@/components/commissions/bordereaux-list"
import { AuditLogViewer } from "@/components/commissions/audit-log-viewer"
import { RecurrencesList } from "@/components/commissions/recurrences-list"
import { ReportsNegatifsList } from "@/components/commissions/reports-negatifs-list"
import { CalculateCommissionDialog } from "@/components/commissions/calculate-commission-dialog"
import { TriggerRepriseDialog } from "@/components/commissions/trigger-reprise-dialog"
import { CreerContestationDialog } from "@/components/commissions/creer-contestation-dialog"
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
  creerContestation as creerContestationAction,
  resoudreContestation as resoudreContestationAction,
  getContestationsByOrganisation,
  deselectionnerCommission as deselectionnerCommissionAction,
  getAuditLogs,
  getRecurrencesByOrganisation,
  getReportsNegatifsByOrganisation,
} from "@/actions/commissions"
import { getApporteursByOrganisation } from "@/actions/commerciaux"
import { useOrganisation } from "@/contexts/organisation-context"
import type {
  CommissionWithDetails,
  RepriseWithDetails,
  BordereauWithDetails,
  StatutCommissionDisplay,
  ContestationWithDetails,
} from "@/lib/ui/display-types/commission"
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
  ShieldAlert,
  Settings,
  Users,
  AlertTriangle,
  History,
  Repeat,
  AlertOctagon,
  FileText,
  Clock,
  RefreshCw,
  TrendingDown as TrendingDownIcon,
  ShieldCheck,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"

// Import types for SSR data
import type { Apporteur } from "@proto/commerciaux/commerciaux"
import type {
  Commission,
  Reprise,
  Bordereau,
  AuditLog,
  RecurrenceCommission,
  ReportNegatif,
  Contestation,
} from "@proto/commission/commission"
import type { DateRange } from "react-day-picker"
import { AuditAction, AuditScope, StatutRecurrence, StatutReport } from "@proto/commission/commission"
import { formatMontant, parseMontant } from "@/lib/ui/helpers/format"

// Simple type for statuts from server action
interface SimpleStatut {
  id: string
  code: string
  nom: string
}

interface CommissionsPageClientProps {
  userId: string
  initialStatuts: SimpleStatut[]
  initialCommissions?: Commission[] | null
  initialApporteurs?: Apporteur[] | null
  initialReprises?: Reprise[] | null
  initialBordereaux?: Bordereau[] | null
  initialContestations?: Contestation[] | null
}

export function CommissionsPageClient({
  userId,
  initialStatuts,
  initialCommissions,
  initialApporteurs,
  initialReprises,
  initialBordereaux,
  initialContestations,
}: CommissionsPageClientProps) {
  const { activeOrganisation } = useOrganisation()
  const [activeTab, setActiveTab] = React.useState("commissions")
  const [filters, setFilters] = React.useState<CommissionFiltersState>({})
  const [selectedRows, setSelectedRows] = React.useState<Record<string, boolean>>({})
  const [detailCommission, setDetailCommission] =
    React.useState<CommissionWithDetails | null>(null)
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
  const hasFetchedContestations = React.useRef(!!initialContestations)
  const hasFetchedAuditLogs = React.useRef(false)
  const hasFetchedRecurrences = React.useRef(false)
  const hasFetchedReportsNegatifs = React.useRef(false)

  // Helper to map commissions from gRPC format
  const mapCommission = React.useCallback((c: Commission): CommissionWithDetails => ({
    id: c.id,
    reference: c.reference,
    organisationId: c.organisationId,
    periode: c.periode,
    compagnie: c.compagnie,
    typeBase: c.typeBase,
    produit: null,
    apporteur: null,
    contrat: null,
    montantBrut: c.montantBrut,
    montantReprises: c.montantReprises,
    montantAcomptes: c.montantAcomptes,
    montantNetAPayer: c.montantNetAPayer,
    statut: (() => {
      const statut = initialStatuts.find((s) => s.id === c.statutId)
      return statut
        ? {
            id: statut.id,
            code: statut.code,
            nom: statut.nom,
          }
        : null
    })(),
    dateCreation: c.dateCreation,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }) as CommissionWithDetails, [initialStatuts])

  // Helper to map apporteurs from gRPC format
  const mapApporteur = React.useCallback((a: Apporteur): Apporteur => ({
    id: a.id,
    nom: a.nom,
    prenom: a.prenom,
    email: a.email,
    telephone: a.telephone,
    typeApporteur: a.typeApporteur as "interne" | "externe" | "partenaire",
    organisationId: a.organisationId,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }) as Apporteur, [])

  // State pour les données - initialize with SSR data if available
  const [apiCommissions, setApiCommissions] = React.useState<CommissionWithDetails[]>(
    initialCommissions ? initialCommissions.map(mapCommission) : []
  )
  const [loadingCommissions, setLoadingCommissions] = React.useState(!initialCommissions)
  const [errorCommissions, setErrorCommissions] = React.useState<Error | null>(null)

  const [apporteurs, setApporteurs] = React.useState<Apporteur[]>(
    initialApporteurs ? initialApporteurs.map(mapApporteur) : []
  )
  const [loadingApporteurs, setLoadingApporteurs] = React.useState(!initialApporteurs)

  // Mapper les statuts depuis les props
  const statuts = React.useMemo((): StatutCommissionDisplay[] =>
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
  const mapReprise = React.useCallback((r: Reprise): RepriseWithDetails => ({
    id: r.id,
    reference: r.reference,
    organisationId: r.organisationId,
    commissionOriginaleId: r.commissionOriginaleId,
    contratId: r.contratId,
    apporteurId: r.apporteurId,
    typeReprise: String(r.typeReprise).replace("TYPE_REPRISE_", "").toLowerCase() as "resiliation" | "impaye" | "annulation" | "regularisation",
    montantReprise: r.montantReprise,
    tauxReprise: r.tauxReprise,
    montantOriginal: r.montantOriginal,
    periodeOrigine: r.periodeOrigine,
    periodeApplication: r.periodeApplication,
    dateEvenement: r.dateEvenement,
    dateLimite: r.dateLimite,
    dateApplication: r.dateApplication ?? null,
    statutReprise: String(r.statutReprise).replace("STATUT_REPRISE_", "").toLowerCase() as "en_attente" | "appliquee" | "annulee",
    bordereauId: r.bordereauId ?? null,
    motif: r.motif ?? null,
    commentaire: r.commentaire ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    apporteur: null,
    contrat: null,
  }) as RepriseWithDetails, [])

  // Helper to map bordereaux from gRPC format
  const mapBordereau = React.useCallback((b: Bordereau): BordereauWithDetails => ({
    id: b.id,
    reference: b.reference,
    organisationId: b.organisationId,
    apporteurId: b.apporteurId,
    apporteur: null,
    periode: b.periode,
    statutBordereau: String(b.statutBordereau).replace("STATUT_BORDEREAU_", "").toLowerCase() as "brouillon" | "valide" | "exporte" | "archive",
    nombreLignes: b.nombreLignes,
    totalBrut: b.totalBrut,
    totalReprises: b.totalReprises,
    totalAcomptes: b.totalAcomptes,
    totalNetAPayer: b.totalNetAPayer,
    dateValidation: b.dateValidation ?? null,
    validateurId: b.validateurId ?? null,
    dateExport: b.dateExport ?? null,
    fichierPdfUrl: b.fichierPdfUrl ?? null,
    fichierExcelUrl: b.fichierExcelUrl ?? null,
    commentaire: b.commentaire ?? null,
    creePar: null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }) as BordereauWithDetails, [])

  const [reprisesData, setReprisesData] = React.useState<RepriseWithDetails[]>(
    initialReprises ? initialReprises.map(mapReprise) : []
  )
  const [loadingReprises, setLoadingReprises] = React.useState(!initialReprises)
  const [errorReprises, setErrorReprises] = React.useState<Error | null>(null)

  const [bordereauxData, setBordereauxData] = React.useState<BordereauWithDetails[]>(
    initialBordereaux ? initialBordereaux.map(mapBordereau) : []
  )
  const [loadingBordereaux, setLoadingBordereaux] = React.useState(!initialBordereaux)
  const [errorBordereaux, setErrorBordereaux] = React.useState<Error | null>(null)

  const mapContestation = React.useCallback((c: Contestation): ContestationWithDetails => ({
    id: c.id,
    organisationId: c.organisationId,
    commissionId: c.commissionId,
    bordereauId: c.bordereauId,
    apporteurId: c.apporteurId,
    motif: c.motif,
    dateContestation: c.dateContestation,
    dateLimite: c.dateLimite,
    statut: String(c.statut).replace("STATUT_CONTESTATION_", "").toLowerCase() as "en_cours" | "acceptee" | "rejetee",
    commentaireResolution: c.commentaireResolution ?? null,
    resoluPar: c.resoluPar ?? null,
    dateResolution: c.dateResolution ?? null,
    ligneRegularisationId: c.ligneRegularisationId ?? null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    apporteur: null,
  }) as ContestationWithDetails, [])

  const [contestationsData, setContestationsData] = React.useState<ContestationWithDetails[]>(
    initialContestations ? initialContestations.map(mapContestation) : []
  )
  const [loadingContestations, setLoadingContestations] = React.useState(!initialContestations)
  const [errorContestations, setErrorContestations] = React.useState<Error | null>(null)

  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([])
  const [loadingAuditLogs, setLoadingAuditLogs] = React.useState(false)
  const [errorAuditLogs, setErrorAuditLogs] = React.useState<Error | null>(null)
  const [auditPage, setAuditPage] = React.useState(1)
  const [auditTotal, setAuditTotal] = React.useState(0)

  const [recurrencesData, setRecurrencesData] = React.useState<RecurrenceCommission[]>([])
  const [loadingRecurrences, setLoadingRecurrences] = React.useState(false)
  const [errorRecurrences, setErrorRecurrences] = React.useState<Error | null>(null)
  const [recurrencesPage, setRecurrencesPage] = React.useState(1)
  const [recurrencesTotal, setRecurrencesTotal] = React.useState(0)

  const [reportsNegatifsData, setReportsNegatifsData] = React.useState<ReportNegatif[]>([])
  const [loadingReportsNegatifs, setLoadingReportsNegatifs] = React.useState(false)
  const [errorReportsNegatifs, setErrorReportsNegatifs] = React.useState<Error | null>(null)
  const [reportsPage, setReportsPage] = React.useState(1)
  const [reportsTotal, setReportsTotal] = React.useState(0)

  const pageSize = 20

  type AuditFiltersState = {
    scope: string
    action: string
    refId: string
    apporteurId: string
    dateRange?: DateRange
  }

  type RecurrenceFiltersState = {
    apporteurId: string
    periode: string
    statut: string
  }

  type ReportFiltersState = {
    apporteurId: string
    statut: string
  }

  const [auditFilters, setAuditFilters] = React.useState<AuditFiltersState>({
    scope: "all",
    action: "all",
    refId: "",
    apporteurId: "all",
    dateRange: undefined,
  })
  const [recurrenceFilters, setRecurrenceFilters] = React.useState<RecurrenceFiltersState>({
    apporteurId: "all",
    periode: "",
    statut: "all",
  })
  const [reportFilters, setReportFilters] = React.useState<ReportFiltersState>({
    apporteurId: "all",
    statut: "all",
  })

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

  const auditScopeOptions = React.useMemo(() => ([
    { value: String(AuditScope.AUDIT_SCOPE_COMMISSION), label: "Commission" },
    { value: String(AuditScope.AUDIT_SCOPE_RECURRENCE), label: "Récurrence" },
    { value: String(AuditScope.AUDIT_SCOPE_REPRISE), label: "Reprise" },
    { value: String(AuditScope.AUDIT_SCOPE_REPORT), label: "Report" },
    { value: String(AuditScope.AUDIT_SCOPE_BORDEREAU), label: "Bordereau" },
    { value: String(AuditScope.AUDIT_SCOPE_LIGNE), label: "Ligne" },
    { value: String(AuditScope.AUDIT_SCOPE_BAREME), label: "Barème" },
    { value: String(AuditScope.AUDIT_SCOPE_PALIER), label: "Palier" },
    { value: String(AuditScope.AUDIT_SCOPE_ENGINE), label: "Moteur" },
  ]), [])

  const auditActionOptions = React.useMemo(() => ([
    { value: String(AuditAction.AUDIT_ACTION_COMMISSION_CALCULATED), label: "Commission calculée" },
    { value: String(AuditAction.AUDIT_ACTION_COMMISSION_CREATED), label: "Commission créée" },
    { value: String(AuditAction.AUDIT_ACTION_COMMISSION_UPDATED), label: "Commission mise à jour" },
    { value: String(AuditAction.AUDIT_ACTION_COMMISSION_DELETED), label: "Commission supprimée" },
    { value: String(AuditAction.AUDIT_ACTION_COMMISSION_STATUS_CHANGED), label: "Statut commission modifié" },
    { value: String(AuditAction.AUDIT_ACTION_RECURRENCE_GENERATED), label: "Récurrence générée" },
    { value: String(AuditAction.AUDIT_ACTION_RECURRENCE_STOPPED), label: "Récurrence stoppée" },
    { value: String(AuditAction.AUDIT_ACTION_REPRISE_CREATED), label: "Reprise créée" },
    { value: String(AuditAction.AUDIT_ACTION_REPRISE_APPLIED), label: "Reprise appliquée" },
    { value: String(AuditAction.AUDIT_ACTION_REPRISE_CANCELLED), label: "Reprise annulée" },
    { value: String(AuditAction.AUDIT_ACTION_REPRISE_REGULARIZED), label: "Reprise régularisée" },
    { value: String(AuditAction.AUDIT_ACTION_REPORT_NEGATIF_CREATED), label: "Report négatif créé" },
    { value: String(AuditAction.AUDIT_ACTION_REPORT_NEGATIF_APPLIED), label: "Report négatif appliqué" },
    { value: String(AuditAction.AUDIT_ACTION_REPORT_NEGATIF_CLEARED), label: "Report négatif apuré" },
    { value: String(AuditAction.AUDIT_ACTION_BORDEREAU_CREATED), label: "Bordereau créé" },
    { value: String(AuditAction.AUDIT_ACTION_BORDEREAU_VALIDATED), label: "Bordereau validé" },
    { value: String(AuditAction.AUDIT_ACTION_BORDEREAU_EXPORTED), label: "Bordereau exporté" },
    { value: String(AuditAction.AUDIT_ACTION_BORDEREAU_ARCHIVED), label: "Bordereau archivé" },
    { value: String(AuditAction.AUDIT_ACTION_LIGNE_SELECTED), label: "Ligne sélectionnée" },
    { value: String(AuditAction.AUDIT_ACTION_LIGNE_DESELECTED), label: "Ligne désélectionnée" },
    { value: String(AuditAction.AUDIT_ACTION_LIGNE_VALIDATED), label: "Ligne validée" },
    { value: String(AuditAction.AUDIT_ACTION_LIGNE_REJECTED), label: "Ligne rejetée" },
    { value: String(AuditAction.AUDIT_ACTION_BAREME_CREATED), label: "Barème créé" },
    { value: String(AuditAction.AUDIT_ACTION_BAREME_UPDATED), label: "Barème mis à jour" },
    { value: String(AuditAction.AUDIT_ACTION_BAREME_ACTIVATED), label: "Barème activé" },
    { value: String(AuditAction.AUDIT_ACTION_BAREME_DEACTIVATED), label: "Barème désactivé" },
    { value: String(AuditAction.AUDIT_ACTION_BAREME_VERSION_CREATED), label: "Version barème créée" },
    { value: String(AuditAction.AUDIT_ACTION_PALIER_CREATED), label: "Palier créé" },
    { value: String(AuditAction.AUDIT_ACTION_PALIER_UPDATED), label: "Palier mis à jour" },
    { value: String(AuditAction.AUDIT_ACTION_PALIER_DELETED), label: "Palier supprimé" },
  ]), [])

  const recurrenceStatusOptions = React.useMemo(() => ([
    { value: String(StatutRecurrence.STATUT_RECURRENCE_ACTIVE), label: "Active" },
    { value: String(StatutRecurrence.STATUT_RECURRENCE_SUSPENDUE), label: "Suspendue" },
    { value: String(StatutRecurrence.STATUT_RECURRENCE_TERMINEE), label: "Terminée" },
    { value: String(StatutRecurrence.STATUT_RECURRENCE_ANNULEE), label: "Annulée" },
  ]), [])

  const reportStatusOptions = React.useMemo(() => ([
    { value: String(StatutReport.STATUT_REPORT_EN_COURS), label: "En cours" },
    { value: String(StatutReport.STATUT_REPORT_APURE), label: "Apuré" },
    { value: String(StatutReport.STATUT_REPORT_ANNULE), label: "Annulé" },
  ]), [])

  const formatLocalDate = React.useCallback((date: Date | undefined) => {
    if (!date) return undefined
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }, [])

  const hasAuditFilters = React.useMemo(() => (
    auditFilters.scope !== "all" ||
    auditFilters.action !== "all" ||
    auditFilters.refId.trim() !== "" ||
    auditFilters.apporteurId !== "all" ||
    Boolean(auditFilters.dateRange?.from || auditFilters.dateRange?.to)
  ), [auditFilters])

  const hasRecurrenceFilters = React.useMemo(() => (
    recurrenceFilters.apporteurId !== "all" ||
    recurrenceFilters.periode.trim() !== "" ||
    recurrenceFilters.statut !== "all"
  ), [recurrenceFilters])

  const hasReportFilters = React.useMemo(() => (
    reportFilters.apporteurId !== "all" ||
    reportFilters.statut !== "all"
  ), [reportFilters])

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
      setApiCommissions(result.data.commissions.map(mapCommission))
    }
    setLoadingCommissions(false)
  }, [activeOrganisation, mapCommission])

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
      })) as Apporteur[])
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
      setReprisesData(result.data.reprises.map(mapReprise))
    }
    setLoadingReprises(false)
  }, [activeOrganisation, mapReprise])

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
      setBordereauxData(result.data.bordereaux.map(mapBordereau))
    }
    setLoadingBordereaux(false)
  }, [activeOrganisation, mapBordereau])

  const refetchContestations = React.useCallback(async () => {
    if (!activeOrganisation) return
    setLoadingContestations(true)
    setErrorContestations(null)
    const result = await getContestationsByOrganisation({
      organisationId: activeOrganisation.organisationId,
    })
    if (result.error) {
      setErrorContestations(new Error(result.error))
    } else if (result.data) {
      setContestationsData(result.data.contestations.map(mapContestation))
    }
    setLoadingContestations(false)
  }, [activeOrganisation, mapContestation])

  const refetchAuditLogs = React.useCallback(async (filters?: AuditFiltersState, page = auditPage) => {
    if (!activeOrganisation) return
    const activeFilters = filters ?? auditFilters
    setLoadingAuditLogs(true)
    setErrorAuditLogs(null)
    const result = await getAuditLogs({
      organisationId: activeOrganisation.organisationId,
      apporteurId: activeFilters.apporteurId !== "all" ? activeFilters.apporteurId : undefined,
      scope: activeFilters.scope !== "all" ? Number(activeFilters.scope) : undefined,
      action: activeFilters.action !== "all" ? Number(activeFilters.action) : undefined,
      refId: activeFilters.refId.trim() || undefined,
      dateFrom: formatLocalDate(activeFilters.dateRange?.from),
      dateTo: formatLocalDate(activeFilters.dateRange?.to),
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })
    if (result.error) {
      setErrorAuditLogs(new Error(result.error))
    } else if (result.data) {
      setAuditLogs(result.data.logs)
      setAuditTotal(result.data.total)
    }
    setLoadingAuditLogs(false)
  }, [activeOrganisation, auditFilters, formatLocalDate, auditPage])

  const refetchRecurrences = React.useCallback(async (filters?: RecurrenceFiltersState, page = recurrencesPage) => {
    if (!activeOrganisation) return
    const activeFilters = filters ?? recurrenceFilters
    setLoadingRecurrences(true)
    setErrorRecurrences(null)
    const result = await getRecurrencesByOrganisation({
      organisationId: activeOrganisation.organisationId,
      apporteurId: activeFilters.apporteurId !== "all" ? activeFilters.apporteurId : undefined,
      periode: activeFilters.periode.trim() || undefined,
      statut: activeFilters.statut !== "all" ? Number(activeFilters.statut) : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })
    if (result.error) {
      setErrorRecurrences(new Error(result.error))
    } else if (result.data) {
      setRecurrencesData(result.data.recurrences)
      setRecurrencesTotal(result.data.total)
    }
    setLoadingRecurrences(false)
  }, [activeOrganisation, recurrenceFilters, recurrencesPage])

  const refetchReportsNegatifs = React.useCallback(async (filters?: ReportFiltersState, page = reportsPage) => {
    if (!activeOrganisation) return
    const activeFilters = filters ?? reportFilters
    setLoadingReportsNegatifs(true)
    setErrorReportsNegatifs(null)
    const result = await getReportsNegatifsByOrganisation({
      organisationId: activeOrganisation.organisationId,
      apporteurId: activeFilters.apporteurId !== "all" ? activeFilters.apporteurId : undefined,
      statut: activeFilters.statut !== "all" ? Number(activeFilters.statut) : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })
    if (result.error) {
      setErrorReportsNegatifs(new Error(result.error))
    } else if (result.data) {
      setReportsNegatifsData(result.data.reports)
      setReportsTotal(result.data.total)
    }
    setLoadingReportsNegatifs(false)
  }, [activeOrganisation, reportFilters, reportsPage])

  const applyAuditFilters = React.useCallback(() => {
    setAuditPage(1)
    refetchAuditLogs(auditFilters, 1)
  }, [refetchAuditLogs, auditFilters])

  const resetAuditFilters = React.useCallback(() => {
    const next = { scope: "all", action: "all", refId: "", apporteurId: "all", dateRange: undefined }
    setAuditFilters(next)
    setAuditPage(1)
    refetchAuditLogs(next, 1)
  }, [refetchAuditLogs])

  const applyRecurrenceFilters = React.useCallback(() => {
    setRecurrencesPage(1)
    refetchRecurrences(recurrenceFilters, 1)
  }, [refetchRecurrences, recurrenceFilters])

  const resetRecurrenceFilters = React.useCallback(() => {
    const next = { apporteurId: "all", periode: "", statut: "all" }
    setRecurrenceFilters(next)
    setRecurrencesPage(1)
    refetchRecurrences(next, 1)
  }, [refetchRecurrences])

  const applyReportFilters = React.useCallback(() => {
    setReportsPage(1)
    refetchReportsNegatifs(reportFilters, 1)
  }, [refetchReportsNegatifs, reportFilters])

  const resetReportFilters = React.useCallback(() => {
    const next = { apporteurId: "all", statut: "all" }
    setReportFilters(next)
    setReportsPage(1)
    refetchReportsNegatifs(next, 1)
  }, [refetchReportsNegatifs])

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
    if (!hasFetchedContestations.current) {
      hasFetchedContestations.current = true
      refetchContestations()
    }
    if (!hasFetchedAuditLogs.current) {
      hasFetchedAuditLogs.current = true
      refetchAuditLogs()
    }
    if (!hasFetchedRecurrences.current) {
      hasFetchedRecurrences.current = true
      refetchRecurrences()
    }
    if (!hasFetchedReportsNegatifs.current) {
      hasFetchedReportsNegatifs.current = true
      refetchReportsNegatifs()
    }
  }, [activeOrganisation, refetchCommissions, fetchApporteurs, refetchReprises, refetchBordereaux, refetchContestations, refetchAuditLogs, refetchRecurrences, refetchReportsNegatifs])

  // Les données sont déjà formatées dans les callbacks de fetch
  const reprises = reprisesData
  const bordereaux = bordereauxData

  const handleViewDetails = React.useCallback(
    (commission: CommissionWithDetails) => {
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
        totalBrut: acc.totalBrut + parseMontant(c.montantBrut),
        totalReprises: acc.totalReprises + parseMontant(c.montantReprises),
        totalNet: acc.totalNet + parseMontant(c.montantNetAPayer),
      }),
      { totalBrut: 0, totalReprises: 0, totalNet: 0 }
    )

    const selectedIds = Object.entries(selectedRows)
      .filter(([, selected]) => selected)
      .map(([id]) => id)

    const selectedCommissions = filteredCommissions.filter((c) => selectedIds.includes(c.id))

    const selectedSummary = selectedCommissions.reduce(
      (acc, c) => ({
        totalBrut: acc.totalBrut + parseMontant(c.montantBrut),
        totalReprises: acc.totalReprises + parseMontant(c.montantReprises),
        totalNet: acc.totalNet + parseMontant(c.montantNetAPayer),
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
        toast.success(`Bordereau généré: ${result.data.summary.nombreCommissions} commission(s), ${formatMontant(String(result.data.summary.totalNet ?? "0"))}`)
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
      parseMontant(c.montantBrut).toFixed(2),
      parseMontant(c.montantReprises).toFixed(2),
      parseMontant(c.montantNetAPayer).toFixed(2),
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

  const handleViewRepriseDetails = (reprise: RepriseWithDetails) => {
    toast.info(`Reprise ${reprise.reference}`, {
      description: `Type: ${reprise.typeReprise} - Montant: ${formatMontant(reprise.montantReprise)}`,
    })
  }

  const handleRepriseSuccess = () => {
    toast.success("Reprise créée")
    refetchReprises()
    refetchCommissions()
  }

  const handleCreerContestation = async (payload: {
    commissionId: string
    bordereauId: string
    apporteurId: string
    motif: string
  }) => {
    if (!activeOrganisation) {
      throw new Error("Organisation inactive")
    }

    const result = await creerContestationAction({
      organisationId: activeOrganisation.organisationId,
      commissionId: payload.commissionId,
      bordereauId: payload.bordereauId,
      apporteurId: payload.apporteurId,
      motif: payload.motif,
    })

    if (!result.data?.contestation) {
      throw new Error(result.error || "Erreur lors de la creation")
    }

    toast.success("Contestation creee")
    refetchContestations()
    refetchCommissions()
  }

   const handleResoudreContestation = async (payload: {
    id: string
    acceptee: boolean
    commentaire: string
  }) => {
    const result = await resoudreContestationAction({
      id: payload.id,
      acceptee: payload.acceptee,
      commentaire: payload.commentaire,
      resoluPar: userId,
    })

    if (!result.data?.contestation) {
      throw new Error(result.error || "Erreur lors de la resolution")
    }

    toast.success(payload.acceptee ? "Contestation acceptee" : "Contestation rejetee")
    refetchContestations()
    refetchCommissions()
    refetchBordereaux()
  }

  // Handlers bordereaux
  const handleValidateBordereau = async (bordereauId: string) => {
    const result = await validerBordereauAction(bordereauId, userId)
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
  const contestationsEnCours = contestationsData.filter((c) => c.statut === "en_cours").length
  const bordereauxBrouillon = bordereaux.filter((b) => b.statutBordereau === "brouillon").length
  const auditCount = auditLogs.length
  const recurrencesCount = recurrencesData.length
  const reportsNegatifsCount = reportsNegatifsData.length

  const auditTotalPages = Math.max(1, Math.ceil(auditTotal / pageSize))
  const recurrencesTotalPages = Math.max(1, Math.ceil(recurrencesTotal / pageSize))
  const reportsTotalPages = Math.max(1, Math.ceil(reportsTotal / pageSize))

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

        {/* Actions rapides */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <Button variant="secondary" size="sm" className="gap-2" asChild>
            <a href="/commissions/validation">
              <ShieldCheck className="size-4" />
              Validation ADV
            </a>
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" asChild>
            <a href="/commissions/reporting">
              <BarChart3 className="size-4" />
              Reporting
            </a>
          </Button>
          <CommissionConfigDialog
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="size-4" />
                Configuration
              </Button>
            }
          />
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <div className="shrink-0">
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
              <TabsTrigger value="contestations" className="gap-2">
                <ShieldAlert className="size-4" />
                Contestations
                {contestationsEnCours > 0 && <Badge variant="default" className="ml-1 bg-warning text-warning-foreground">{contestationsEnCours}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2">
                <History className="size-4" />
                Audit
                <Badge variant="secondary" className="ml-1">{auditCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="recurrences" className="gap-2">
                <Repeat className="size-4" />
                Récurrences
                <Badge variant="secondary" className="ml-1">{recurrencesCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="reports-negatifs" className="gap-2">
                <AlertOctagon className="size-4" />
                Reports négatifs
                <Badge variant="secondary" className="ml-1">{reportsNegatifsCount}</Badge>
              </TabsTrigger>
            </TabsList>
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
                        <Button variant="outline" className="gap-2">
                          <AlertTriangle className="size-4" />
                          Déclencher reprise
                        </Button>
                      }
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                   {filteredCommissions.length === 0 ? (
                     <Empty>
                       <EmptyHeader>
                         <EmptyMedia>
                           <DollarSign className="h-10 w-10 text-muted-foreground" />
                         </EmptyMedia>
                         <EmptyTitle>Aucune commission</EmptyTitle>
                       </EmptyHeader>
                       <EmptyContent>
                         <EmptyDescription>Les commissions apparaîtront ici une fois les contrats validés et les calculs effectués.</EmptyDescription>
                       </EmptyContent>
                     </Empty>
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
                 ) : bordereaux.length === 0 ? (
                   <Empty>
                     <EmptyHeader>
                       <EmptyMedia>
                         <FileText className="h-10 w-10 text-muted-foreground" />
                       </EmptyMedia>
                       <EmptyTitle>Aucun bordereau</EmptyTitle>
                     </EmptyHeader>
                     <EmptyContent>
                       <EmptyDescription>Les bordereaux sont générés à partir des commissions sélectionnées.</EmptyDescription>
                     </EmptyContent>
                   </Empty>
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
                 ) : reprises.length === 0 ? (
                   <Empty>
                     <EmptyHeader>
                       <EmptyMedia>
                         <RotateCcw className="h-10 w-10 text-muted-foreground" />
                       </EmptyMedia>
                       <EmptyTitle>Aucune reprise</EmptyTitle>
                     </EmptyHeader>
                     <EmptyContent>
                       <EmptyDescription>Les reprises sont déclenchées en cas de résiliation, impayé ou annulation.</EmptyDescription>
                     </EmptyContent>
                   </Empty>
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

           <TabsContent value="contestations" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 flex flex-col h-full">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="text-base flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="size-4" />
                    Contestations commissions
                  </span>
                  <CreerContestationDialog
                    commissionId={filteredCommissions[0]?.id || ""}
                    bordereauId={bordereaux[0]?.id || ""}
                    apporteurId={filteredCommissions[0]?.apporteur?.id || bordereaux[0]?.apporteurId || ""}
                    onSubmit={handleCreerContestation}
                    trigger={
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!filteredCommissions[0]?.id || !bordereaux[0]?.id}
                      >
                        Créer contestation
                      </Button>
                    }
                  />
                </CardTitle>
              </CardHeader>
               <CardContent className="flex-1 min-h-0 flex flex-col">
                 {errorContestations ? (
                   <Alert variant="destructive">
                     <AlertCircle className="h-4 w-4" />
                     <AlertTitle>Erreur</AlertTitle>
                     <AlertDescription>
                       {errorContestations.message}
                       <Button variant="outline" size="sm" className="ml-4" onClick={() => refetchContestations()}>
                         Réessayer
                       </Button>
                     </AlertDescription>
                   </Alert>
                 ) : loadingContestations ? (
                   <div className="text-sm text-muted-foreground">Chargement...</div>
                 ) : contestationsData.length === 0 ? (
                   <Empty>
                     <EmptyHeader>
                       <EmptyMedia>
                         <AlertTriangle className="h-10 w-10 text-muted-foreground" />
                       </EmptyMedia>
                       <EmptyTitle>Aucune contestation</EmptyTitle>
                     </EmptyHeader>
                     <EmptyContent>
                       <EmptyDescription>Les contestations seront listées ici quand un apporteur conteste une commission.</EmptyDescription>
                     </EmptyContent>
                   </Empty>
                 ) : (
                   <ContestationsList
                     contestations={contestationsData}
                     onResoudre={handleResoudreContestation}
                   />
                 )}
               </CardContent>
             </Card>
           </TabsContent>

           <TabsContent value="audit" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 flex flex-col h-full">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="size-4" />
                  Journal d'audit
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 flex flex-col">
                <div className="flex flex-wrap items-end gap-2 mb-4">
                  <Input
                    placeholder="Référence (commission, bordereau...)"
                    value={auditFilters.refId}
                    onChange={(e) => setAuditFilters((prev) => ({ ...prev, refId: e.target.value }))}
                    className="h-9 max-w-xs"
                  />
                  <Select
                    value={auditFilters.apporteurId}
                    onValueChange={(value) => setAuditFilters((prev) => ({ ...prev, apporteurId: value }))}
                  >
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue placeholder="Apporteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous apporteurs</SelectItem>
                      {apporteurs.map((apporteur) => (
                        <SelectItem key={apporteur.id} value={apporteur.id}>
                          {apporteur.prenom} {apporteur.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={auditFilters.scope}
                    onValueChange={(value) => setAuditFilters((prev) => ({ ...prev, scope: value }))}
                  >
                    <SelectTrigger className="h-9 w-[160px]">
                      <SelectValue placeholder="Scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous scopes</SelectItem>
                      {auditScopeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={auditFilters.action}
                    onValueChange={(value) => setAuditFilters((prev) => ({ ...prev, action: value }))}
                  >
                    <SelectTrigger className="h-9 w-[220px]">
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes actions</SelectItem>
                      {auditActionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DateRangePicker
                    dateRange={auditFilters.dateRange}
                    onDateRangeChange={(range) => setAuditFilters((prev) => ({ ...prev, dateRange: range }))}
                    className="h-9"
                  />
                  <Button variant="secondary" className="h-9" onClick={applyAuditFilters}>
                    Appliquer
                  </Button>
                  {hasAuditFilters && (
                    <Button variant="ghost" className="h-9" onClick={resetAuditFilters}>
                      Réinitialiser
                    </Button>
                  )}
                </div>
                {errorAuditLogs ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>
                      {errorAuditLogs.message}
                      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetchAuditLogs()}>
                        Réessayer
                      </Button>
                    </AlertDescription>
                  </Alert>
                 ) : auditLogs.length === 0 ? (
                   <Empty>
                     <EmptyHeader>
                       <EmptyMedia>
                         <Clock className="h-10 w-10 text-muted-foreground" />
                       </EmptyMedia>
                       <EmptyTitle>Aucun log d'audit</EmptyTitle>
                     </EmptyHeader>
                     <EmptyContent>
                       <EmptyDescription>L'historique des actions sur les commissions apparaîtra ici.</EmptyDescription>
                     </EmptyContent>
                   </Empty>
                 ) : (
                   <>
                     <AuditLogViewer logs={auditLogs} loading={loadingAuditLogs} />
                     {auditTotalPages > 1 && (
                       <div className="mt-4 flex items-center justify-center gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const next = Math.max(1, auditPage - 1)
                             setAuditPage(next)
                             refetchAuditLogs(auditFilters, next)
                           }}
                           disabled={auditPage === 1}
                         >
                           Précédent
                         </Button>
                         <span className="text-sm text-muted-foreground">
                           Page {auditPage} sur {auditTotalPages}
                         </span>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const next = Math.min(auditTotalPages, auditPage + 1)
                             setAuditPage(next)
                             refetchAuditLogs(auditFilters, next)
                           }}
                           disabled={auditPage === auditTotalPages}
                         >
                           Suivant
                         </Button>
                       </div>
                     )}
                   </>
                 )}
               </CardContent>
             </Card>
           </TabsContent>

           <TabsContent value="recurrences" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 flex flex-col h-full">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Repeat className="size-4" />
                  Récurrences de commission
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 flex flex-col">
                <div className="flex flex-wrap items-end gap-2 mb-4">
                  <Select
                    value={recurrenceFilters.apporteurId}
                    onValueChange={(value) => setRecurrenceFilters((prev) => ({ ...prev, apporteurId: value }))}
                  >
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue placeholder="Apporteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous apporteurs</SelectItem>
                      {apporteurs.map((apporteur) => (
                        <SelectItem key={apporteur.id} value={apporteur.id}>
                          {apporteur.prenom} {apporteur.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Période (YYYY-MM)"
                    value={recurrenceFilters.periode}
                    onChange={(e) => setRecurrenceFilters((prev) => ({ ...prev, periode: e.target.value }))}
                    className="h-9 w-[160px]"
                  />
                  <Select
                    value={recurrenceFilters.statut}
                    onValueChange={(value) => setRecurrenceFilters((prev) => ({ ...prev, statut: value }))}
                  >
                    <SelectTrigger className="h-9 w-[160px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      {recurrenceStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="secondary" className="h-9" onClick={applyRecurrenceFilters}>
                    Appliquer
                  </Button>
                  {hasRecurrenceFilters && (
                    <Button variant="ghost" className="h-9" onClick={resetRecurrenceFilters}>
                      Réinitialiser
                    </Button>
                  )}
                </div>
                {errorRecurrences ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>
                      {errorRecurrences.message}
                      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetchRecurrences()}>
                        Réessayer
                      </Button>
                    </AlertDescription>
                  </Alert>
                 ) : recurrencesData.length === 0 ? (
                   <Empty>
                     <EmptyHeader>
                       <EmptyMedia>
                         <RefreshCw className="h-10 w-10 text-muted-foreground" />
                       </EmptyMedia>
                       <EmptyTitle>Aucune récurrence</EmptyTitle>
                     </EmptyHeader>
                     <EmptyContent>
                       <EmptyDescription>Les commissions récurrentes apparaîtront ici une fois configurées.</EmptyDescription>
                     </EmptyContent>
                   </Empty>
                 ) : (
                   <>
                     <RecurrencesList recurrences={recurrencesData} loading={loadingRecurrences} />
                     {recurrencesTotalPages > 1 && (
                       <div className="mt-4 flex items-center justify-center gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const next = Math.max(1, recurrencesPage - 1)
                             setRecurrencesPage(next)
                             refetchRecurrences(recurrenceFilters, next)
                           }}
                           disabled={recurrencesPage === 1}
                         >
                           Précédent
                         </Button>
                         <span className="text-sm text-muted-foreground">
                           Page {recurrencesPage} sur {recurrencesTotalPages}
                         </span>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const next = Math.min(recurrencesTotalPages, recurrencesPage + 1)
                             setRecurrencesPage(next)
                             refetchRecurrences(recurrenceFilters, next)
                           }}
                           disabled={recurrencesPage === recurrencesTotalPages}
                         >
                           Suivant
                         </Button>
                       </div>
                     )}
                   </>
                 )}
               </CardContent>
             </Card>
           </TabsContent>

           <TabsContent value="reports-negatifs" className="flex-1 min-h-0 mt-4">
            <Card className="flex-1 min-h-0 flex flex-col h-full">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertOctagon className="size-4" />
                  Reports négatifs
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 flex flex-col">
                <div className="flex flex-wrap items-end gap-2 mb-4">
                  <Select
                    value={reportFilters.apporteurId}
                    onValueChange={(value) => setReportFilters((prev) => ({ ...prev, apporteurId: value }))}
                  >
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue placeholder="Apporteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous apporteurs</SelectItem>
                      {apporteurs.map((apporteur) => (
                        <SelectItem key={apporteur.id} value={apporteur.id}>
                          {apporteur.prenom} {apporteur.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={reportFilters.statut}
                    onValueChange={(value) => setReportFilters((prev) => ({ ...prev, statut: value }))}
                  >
                    <SelectTrigger className="h-9 w-[160px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      {reportStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="secondary" className="h-9" onClick={applyReportFilters}>
                    Appliquer
                  </Button>
                  {hasReportFilters && (
                    <Button variant="ghost" className="h-9" onClick={resetReportFilters}>
                      Réinitialiser
                    </Button>
                  )}
                </div>
                {errorReportsNegatifs ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>
                      {errorReportsNegatifs.message}
                      <Button variant="outline" size="sm" className="ml-4" onClick={() => refetchReportsNegatifs()}>
                        Réessayer
                      </Button>
                    </AlertDescription>
                  </Alert>
                 ) : reportsNegatifsData.length === 0 ? (
                   <Empty>
                     <EmptyHeader>
                       <EmptyMedia>
                         <TrendingDownIcon className="h-10 w-10 text-muted-foreground" />
                       </EmptyMedia>
                       <EmptyTitle>Aucun report négatif</EmptyTitle>
                     </EmptyHeader>
                     <EmptyContent>
                       <EmptyDescription>Les soldes négatifs reportés entre périodes seront affichés ici.</EmptyDescription>
                     </EmptyContent>
                   </Empty>
                 ) : (
                   <>
                     <ReportsNegatifsList reports={reportsNegatifsData} loading={loadingReportsNegatifs} />
                     {reportsTotalPages > 1 && (
                       <div className="mt-4 flex items-center justify-center gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const next = Math.max(1, reportsPage - 1)
                             setReportsPage(next)
                             refetchReportsNegatifs(reportFilters, next)
                           }}
                           disabled={reportsPage === 1}
                         >
                           Précédent
                         </Button>
                         <span className="text-sm text-muted-foreground">
                           Page {reportsPage} sur {reportsTotalPages}
                         </span>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const next = Math.min(reportsTotalPages, reportsPage + 1)
                             setReportsPage(next)
                             refetchReportsNegatifs(reportFilters, next)
                           }}
                           disabled={reportsPage === reportsTotalPages}
                         >
                           Suivant
                         </Button>
                       </div>
                     )}
                   </>
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

"use client"

import * as React from "react"
import { useOrganisation } from "@/contexts/organisation-context"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createFulfillmentBatch,
  getFulfillmentBatch,
  listFulfillmentBatches,
  updateFulfillmentBatch,
  deleteFulfillmentBatch,
  lockFulfillmentBatch,
  dispatchFulfillmentBatch,
  completeFulfillmentBatch,
  createFulfillmentCutoffConfig as createFulfillmentCutoff,
  getFulfillmentCutoffConfigByOrganisation as getFulfillmentCutoffByOrganisation,
  updateFulfillmentCutoffConfig as updateFulfillmentCutoff,
  deleteFulfillmentCutoffConfig as deleteFulfillmentCutoff,
  createCarrierAccount,
  getCarrierAccountsByOrganisation as listCarrierAccounts,
  updateCarrierAccount,
  deleteCarrierAccount,
} from "@/actions/logistics"

type AnyEntity = any

const BATCH_STATUS_BY_NUMBER: Record<number, string> = {
  0: "OPEN",
  1: "LOCKED",
  2: "DISPATCHED",
  3: "COMPLETED",
}

const BATCH_STATUS_CLASSNAME: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  LOCKED: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  DISPATCHED: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
}

function getFirstValue(entity: AnyEntity, keys: string[], fallback: unknown = ""): unknown {
  for (const key of keys) {
    const value = entity?.[key]
    if (value !== undefined && value !== null) {
      return value
    }
  }
  return fallback
}

function getEntityId(entity: AnyEntity): string {
  const raw = getFirstValue(entity, ["id", "batchId", "cutoffId", "carrierId"], "")
  return String(raw || "")
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "number") {
    return value === 1
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (["1", "true", "actif", "active", "yes", "oui"].includes(normalized)) {
      return true
    }
    if (["0", "false", "inactif", "inactive", "no", "non"].includes(normalized)) {
      return false
    }
  }
  return fallback
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return fallback
}

function toIsoDate(value: string): string | undefined {
  if (!value) {
    return undefined
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }
  return date.toISOString()
}

function toLocalDateTimeInput(value: string): string {
  if (!value) {
    return ""
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  const tzOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

function formatDateTime(value: unknown): string {
  if (!value) {
    return "-"
  }
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function normalizeBatchStatus(batch: AnyEntity): string {
  const raw = getFirstValue(batch, ["status", "etat"], "OPEN")
  if (typeof raw === "number") {
    return BATCH_STATUS_BY_NUMBER[raw] || String(raw)
  }
  const value = String(raw).toUpperCase()
  if (value.includes("OPEN")) return "OPEN"
  if (value.includes("LOCK")) return "LOCKED"
  if (value.includes("DISPATCH")) return "DISPATCHED"
  if (value.includes("COMPLETE")) return "COMPLETED"
  return value
}

function getBatchLineCount(batch: AnyEntity): number {
  const explicit = parseNumber(
    getFirstValue(batch, ["lineCount", "line_count", "linesCount", "lines_count"], -1),
    -1
  )
  if (explicit >= 0) {
    return explicit
  }
  const lines = getFirstValue(batch, ["lines", "batchLines", "items"], [])
  return Array.isArray(lines) ? lines.length : 0
}

function getCarrierName(carrier: AnyEntity): string {
  return String(
    getFirstValue(
      carrier,
      ["nom", "name", "label", "displayName", "labelFormat", "label_format", "contractNumber"],
      "-"
    )
  )
}

function getCarrierType(carrier: AnyEntity): string {
  return String(getFirstValue(carrier, ["type", "carrierType", "transporteurType"], "-"))
}

function getCarrierContractNumber(carrier: AnyEntity): string {
  return String(getFirstValue(carrier, ["contractNumber", "contract_number", "numeroContrat"], "-"))
}

function getCarrierIsActive(carrier: AnyEntity): boolean {
  return parseBoolean(getFirstValue(carrier, ["isActive", "is_active", "actif"], false), false)
}

function isLikelyNotFoundError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes("not found") ||
    lower.includes("introuvable") ||
    lower.includes("no cutoff") ||
    lower.includes("404")
  )
}

const defaultCutoffFormData = {
  cutoffDayOfMonth: 1,
  cutoffTime: "12:00",
  processingDays: 2,
  autoLock: true,
  autoDispatch: false,
}

const defaultCarrierFormData = {
  nom: "",
  type: "",
  contractNumber: "",
  password: "",
  labelFormat: "PDF",
  isActive: true,
}

export function LotsPageClient() {
  const { activeOrganisation } = useOrganisation()
  const organisationId = activeOrganisation?.organisationId || ""

  const [activeTab, setActiveTab] = React.useState("lots")

  const [batches, setBatches] = React.useState<AnyEntity[]>([])
  const [batchLoading, setBatchLoading] = React.useState(false)
  const [batchSubmitting, setBatchSubmitting] = React.useState(false)
  const [batchActionKey, setBatchActionKey] = React.useState<string | null>(null)
  const [batchDialogOpen, setBatchDialogOpen] = React.useState(false)
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = React.useState(false)
  const [selectedBatch, setSelectedBatch] = React.useState<AnyEntity | null>(null)
  const [batchFormData, setBatchFormData] = React.useState({
    label: "",
    cutoffDate: "",
  })

  const [cutoffs, setCutoffs] = React.useState<AnyEntity[]>([])
  const [cutoffLoading, setCutoffLoading] = React.useState(false)
  const [cutoffSubmitting, setCutoffSubmitting] = React.useState(false)
  const [cutoffDialogOpen, setCutoffDialogOpen] = React.useState(false)
  const [cutoffDeleteDialogOpen, setCutoffDeleteDialogOpen] = React.useState(false)
  const [selectedCutoff, setSelectedCutoff] = React.useState<AnyEntity | null>(null)
  const [cutoffFormData, setCutoffFormData] = React.useState(defaultCutoffFormData)

  const [carriers, setCarriers] = React.useState<AnyEntity[]>([])
  const [carrierLoading, setCarrierLoading] = React.useState(false)
  const [carrierSubmitting, setCarrierSubmitting] = React.useState(false)
  const [carrierDialogOpen, setCarrierDialogOpen] = React.useState(false)
  const [carrierDeleteDialogOpen, setCarrierDeleteDialogOpen] = React.useState(false)
  const [selectedCarrier, setSelectedCarrier] = React.useState<AnyEntity | null>(null)
  const [carrierFormData, setCarrierFormData] = React.useState(defaultCarrierFormData)

  const fetchBatches = React.useCallback(async () => {
    if (!organisationId) {
      setBatches([])
      return
    }

    setBatchLoading(true)
    const result = await listFulfillmentBatches({
      organisationId,
      page: 1,
      limit: 100,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      const payload = result.data as AnyEntity
      const nextBatches =
        (Array.isArray(payload?.batches) && payload.batches) ||
        (Array.isArray(payload?.items) && payload.items) ||
        []
      setBatches(nextBatches)
    }

    setBatchLoading(false)
  }, [organisationId])

  const fetchCutoffs = React.useCallback(async () => {
    if (!organisationId) {
      setCutoffs([])
      return
    }

    setCutoffLoading(true)
    const result = await getFulfillmentCutoffByOrganisation(organisationId)

    if (result.error) {
      if (!isLikelyNotFoundError(result.error)) {
        toast.error(result.error)
      }
      setCutoffs([])
    } else if (result.data) {
      setCutoffs([result.data])
    } else {
      setCutoffs([])
    }

    setCutoffLoading(false)
  }, [organisationId])

  const fetchCarriers = React.useCallback(async () => {
    if (!organisationId) {
      setCarriers([])
      return
    }

    setCarrierLoading(true)
    const result = await listCarrierAccounts(organisationId)

    if (result.error) {
      toast.error(result.error)
    } else {
      const payload = result.data as AnyEntity
      const nextCarriers =
        (Array.isArray(payload?.carrierAccounts) && payload.carrierAccounts) ||
        (Array.isArray(payload?.accounts) && payload.accounts) ||
        (Array.isArray(payload?.carriers) && payload.carriers) ||
        (Array.isArray(payload?.items) && payload.items) ||
        []
      setCarriers(nextCarriers)
    }

    setCarrierLoading(false)
  }, [organisationId])

  React.useEffect(() => {
    if (!organisationId) {
      setBatches([])
      setCutoffs([])
      setCarriers([])
      return
    }

    void fetchBatches()
    void fetchCutoffs()
    void fetchCarriers()
  }, [organisationId, fetchBatches, fetchCutoffs, fetchCarriers])

  const handleRefreshAll = async () => {
    await Promise.all([fetchBatches(), fetchCutoffs(), fetchCarriers()])
    toast.success("Données logistiques actualisées")
  }

  const handleCreateBatch = () => {
    setSelectedBatch(null)
    setBatchFormData({ label: "", cutoffDate: "" })
    setBatchDialogOpen(true)
  }

  const handleEditBatch = (batch: AnyEntity) => {
    const cutoffRaw = String(getFirstValue(batch, ["cutoffDate", "cutoff_date"], ""))

    setSelectedBatch(batch)
    setBatchFormData({
      label: String(getFirstValue(batch, ["label"], "")),
      cutoffDate: toLocalDateTimeInput(cutoffRaw),
    })
    setBatchDialogOpen(true)
  }

  const handleSubmitBatch = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!organisationId) {
      toast.error("Aucune organisation active")
      return
    }

    setBatchSubmitting(true)

    const batchId = selectedBatch ? getEntityId(selectedBatch) : ""
    const payload = {
      label: batchFormData.label || undefined,
      cutoffDate: toIsoDate(batchFormData.cutoffDate),
    }

    const result = batchId
      ? await updateFulfillmentBatch({ id: batchId, ...payload })
      : await createFulfillmentBatch({ organisationId, ...payload })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(batchId ? "Lot mis a jour" : "Lot cree")
      setBatchDialogOpen(false)
      await fetchBatches()
    }

    setBatchSubmitting(false)
  }

  const handleDeleteBatch = async () => {
    if (!selectedBatch) {
      return
    }

    const batchId = getEntityId(selectedBatch)
    if (!batchId) {
      toast.error("ID du lot introuvable")
      return
    }

    setBatchSubmitting(true)
    const result = await deleteFulfillmentBatch(batchId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Lot supprime")
      setBatchDeleteDialogOpen(false)
      await fetchBatches()
    }

    setBatchSubmitting(false)
  }

  const refreshSingleBatch = React.useCallback(async (batchId: string) => {
    const result = await getFulfillmentBatch(batchId)
    if (!result.data) {
      return false
    }

    setBatches((current) => {
      if (!current.some((item) => getEntityId(item) === batchId)) {
        return current
      }

      return current.map((item) => (getEntityId(item) === batchId ? result.data : item))
    })

    return true
  }, [])

  const handleBatchTransition = async (batch: AnyEntity, action: "lock" | "dispatch" | "complete") => {
    const batchId = getEntityId(batch)
    if (!batchId) {
      toast.error("ID du lot introuvable")
      return
    }

    setBatchActionKey(`${batchId}-${action}`)

    const result =
      action === "lock"
        ? await lockFulfillmentBatch(batchId)
        : action === "dispatch"
          ? await dispatchFulfillmentBatch({
              id: batchId,
              dispatchDate: new Date().toISOString(),
            })
          : await completeFulfillmentBatch(batchId)

    if (result.error) {
      toast.error(result.error)
    } else {
      const refreshed = await refreshSingleBatch(batchId)
      if (!refreshed) {
        await fetchBatches()
      }

      if (action === "lock") toast.success("Lot verrouille")
      if (action === "dispatch") toast.success("Lot expedie")
      if (action === "complete") toast.success("Lot finalise")
    }

    setBatchActionKey(null)
  }

  const handleCreateCutoff = () => {
    setSelectedCutoff(null)
    setCutoffFormData({ ...defaultCutoffFormData })
    setCutoffDialogOpen(true)
  }

  const handleEditCutoff = (cutoff: AnyEntity) => {
    setSelectedCutoff(cutoff)
    setCutoffFormData({
      cutoffDayOfMonth: parseNumber(
        getFirstValue(cutoff, ["cutoffDayOfMonth", "cutoff_day_of_month"], 1),
        1
      ),
      cutoffTime: String(getFirstValue(cutoff, ["cutoffTime", "cutoff_time"], "12:00")),
      processingDays: parseNumber(
        getFirstValue(cutoff, ["processingDays", "processing_days"], 2),
        2
      ),
      autoLock: parseBoolean(getFirstValue(cutoff, ["autoLock", "auto_lock"], true), true),
      autoDispatch: parseBoolean(getFirstValue(cutoff, ["autoDispatch", "auto_dispatch"], false), false),
    })
    setCutoffDialogOpen(true)
  }

  const handleSubmitCutoff = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!organisationId) {
      toast.error("Aucune organisation active")
      return
    }

    setCutoffSubmitting(true)

    const cutoffId = selectedCutoff ? getEntityId(selectedCutoff) : ""
    const payload = {
      cutoffDayOfMonth: cutoffFormData.cutoffDayOfMonth,
      cutoffTime: cutoffFormData.cutoffTime,
      processingDays: cutoffFormData.processingDays,
      autoLock: cutoffFormData.autoLock,
      autoDispatch: cutoffFormData.autoDispatch,
    }

    const result = cutoffId
      ? await updateFulfillmentCutoff({
          id: cutoffId,
          ...payload,
        })
      : await createFulfillmentCutoff({
          organisationId,
          ...payload,
        })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(cutoffId ? "Configuration cutoff mise a jour" : "Configuration cutoff creee")
      setCutoffDialogOpen(false)
      await fetchCutoffs()
    }

    setCutoffSubmitting(false)
  }

  const handleDeleteCutoff = async () => {
    if (!selectedCutoff) {
      return
    }

    const cutoffId = getEntityId(selectedCutoff)
    if (!cutoffId) {
      toast.error("ID de la configuration introuvable")
      return
    }

    setCutoffSubmitting(true)
    const result = await deleteFulfillmentCutoff(cutoffId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Configuration cutoff supprimee")
      setCutoffDeleteDialogOpen(false)
      await fetchCutoffs()
    }

    setCutoffSubmitting(false)
  }

  const handleCreateCarrier = () => {
    setSelectedCarrier(null)
    setCarrierFormData({ ...defaultCarrierFormData })
    setCarrierDialogOpen(true)
  }

  const handleEditCarrier = (carrier: AnyEntity) => {
    setSelectedCarrier(carrier)
    setCarrierFormData({
      nom: getCarrierName(carrier),
      type: getCarrierType(carrier),
      contractNumber: getCarrierContractNumber(carrier),
      password: "",
      labelFormat: String(getFirstValue(carrier, ["labelFormat", "label_format"], "PDF")),
      isActive: getCarrierIsActive(carrier),
    })
    setCarrierDialogOpen(true)
  }

  const handleSubmitCarrier = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!organisationId) {
      toast.error("Aucune organisation active")
      return
    }

    if (!carrierFormData.type || !carrierFormData.contractNumber) {
      toast.error("Type et numero de contrat sont obligatoires")
      return
    }

    const carrierId = selectedCarrier ? getEntityId(selectedCarrier) : ""

    if (!carrierId && !carrierFormData.password) {
      toast.error("Le mot de passe est obligatoire a la creation")
      return
    }

    setCarrierSubmitting(true)

    const result = carrierId
      ? await updateCarrierAccount({
          id: carrierId,
          contractNumber: carrierFormData.contractNumber,
          password: carrierFormData.password || undefined,
          labelFormat: carrierFormData.labelFormat || carrierFormData.nom || undefined,
          actif: carrierFormData.isActive,
        })
      : await createCarrierAccount({
          organisationId,
          type: carrierFormData.type,
          contractNumber: carrierFormData.contractNumber,
          password: carrierFormData.password,
          labelFormat: carrierFormData.labelFormat || carrierFormData.nom || "PDF",
          actif: carrierFormData.isActive,
        })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(carrierId ? "Transporteur mis a jour" : "Transporteur cree")
      setCarrierDialogOpen(false)
      await fetchCarriers()
    }

    setCarrierSubmitting(false)
  }

  const handleDeleteCarrier = async () => {
    if (!selectedCarrier) {
      return
    }

    const carrierId = getEntityId(selectedCarrier)
    if (!carrierId) {
      toast.error("ID transporteur introuvable")
      return
    }

    setCarrierSubmitting(true)
    const result = await deleteCarrierAccount(carrierId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Transporteur supprime")
      setCarrierDeleteDialogOpen(false)
      await fetchCarriers()
    }

    setCarrierSubmitting(false)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fulfillment Lots</h1>
          <p className="text-muted-foreground">
            Gere les lots fulfillment, la configuration de cutoff et les comptes transporteurs.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefreshAll} disabled={!organisationId}>
          Actualiser
        </Button>
      </div>

      {!organisationId && (
        <Card>
          <CardContent className="pt-6 text-muted-foreground">
            Selectionnez une organisation pour charger les donnees logistiques.
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lots">Lots Fulfillment</TabsTrigger>
          <TabsTrigger value="cutoff">Configuration Cutoff</TabsTrigger>
          <TabsTrigger value="carriers">Transporteurs</TabsTrigger>
        </TabsList>

        <TabsContent value="lots" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Lots Fulfillment</CardTitle>
                  <CardDescription>
                    {batches.length} lot{batches.length > 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button onClick={handleCreateBatch} disabled={!organisationId}>
                  Creer un lot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Cree le</TableHead>
                    <TableHead>Lignes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Chargement des lots...
                      </TableCell>
                    </TableRow>
                  ) : batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucun lot fulfillment
                      </TableCell>
                    </TableRow>
                  ) : (
                    batches.map((batch, index) => {
                      const id = getEntityId(batch)
                      const status = normalizeBatchStatus(batch)
                      const createdAt = getFirstValue(batch, ["createdAt", "created_at", "dateCreation"], "")

                      return (
                        <TableRow key={id || `batch-${index}`}>
                          <TableCell className="font-mono text-xs">{id || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                BATCH_STATUS_CLASSNAME[status] ||
                                "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100"
                              }
                            >
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(createdAt)}</TableCell>
                          <TableCell>{getBatchLineCount(batch)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditBatch(batch)}
                              >
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBatchTransition(batch, "lock")}
                                disabled={status !== "OPEN" || batchActionKey === `${id}-lock`}
                              >
                                Verrouiller
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBatchTransition(batch, "dispatch")}
                                disabled={status !== "LOCKED" || batchActionKey === `${id}-dispatch`}
                              >
                                Dispatcher
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBatchTransition(batch, "complete")}
                                disabled={status !== "DISPATCHED" || batchActionKey === `${id}-complete`}
                              >
                                Completer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedBatch(batch)
                                  setBatchDeleteDialogOpen(true)
                                }}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cutoff" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Configuration Cutoff</CardTitle>
                  <CardDescription>
                    {cutoffs.length} configuration{cutoffs.length > 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button onClick={handleCreateCutoff} disabled={!organisationId}>
                  Nouvelle configuration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Auto lock</TableHead>
                    <TableHead>Auto dispatch</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cutoffLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Chargement de la configuration...
                      </TableCell>
                    </TableRow>
                  ) : cutoffs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Aucune configuration cutoff
                      </TableCell>
                    </TableRow>
                  ) : (
                    cutoffs.map((cutoff) => {
                      const id = getEntityId(cutoff)
                      const rowOrganisationId = String(
                        getFirstValue(cutoff, ["organisationId", "organisation_id"], organisationId)
                      )
                      const autoLock = parseBoolean(
                        getFirstValue(cutoff, ["autoLock", "auto_lock"], false),
                        false
                      )
                      const autoDispatch = parseBoolean(
                        getFirstValue(cutoff, ["autoDispatch", "auto_dispatch"], false),
                        false
                      )

                      return (
                        <TableRow key={id || rowOrganisationId}>
                          <TableCell className="font-mono text-xs">{rowOrganisationId || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={autoLock ? "default" : "secondary"}>
                              {autoLock ? "Oui" : "Non"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={autoDispatch ? "default" : "secondary"}>
                              {autoDispatch ? "Oui" : "Non"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditCutoff(cutoff)}>
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedCutoff(cutoff)
                                  setCutoffDeleteDialogOpen(true)
                                }}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Transporteurs</CardTitle>
                  <CardDescription>
                    {carriers.length} compte{carriers.length > 1 ? "s" : ""} transporteur
                  </CardDescription>
                </div>
                <Button onClick={handleCreateCarrier} disabled={!organisationId}>
                  Nouveau transporteur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contrat</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carrierLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Chargement des transporteurs...
                      </TableCell>
                    </TableRow>
                  ) : carriers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucun transporteur
                      </TableCell>
                    </TableRow>
                  ) : (
                    carriers.map((carrier, index) => {
                      const id = getEntityId(carrier)
                      return (
                        <TableRow key={id || `carrier-${index}`}>
                          <TableCell className="font-medium">{getCarrierName(carrier)}</TableCell>
                          <TableCell>{getCarrierType(carrier)}</TableCell>
                          <TableCell>{getCarrierContractNumber(carrier)}</TableCell>
                          <TableCell>
                            <Badge variant={getCarrierIsActive(carrier) ? "default" : "secondary"}>
                              {getCarrierIsActive(carrier) ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditCarrier(carrier)}>
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedCarrier(carrier)
                                  setCarrierDeleteDialogOpen(true)
                                }}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{selectedBatch ? "Modifier le lot" : "Creer un lot"}</DialogTitle>
            <DialogDescription>
              Configurez le lot fulfillment avant verrouillage et expedition.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-label">Libelle</Label>
              <Input
                id="batch-label"
                value={batchFormData.label}
                onChange={(event) =>
                  setBatchFormData((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                placeholder="Lot mensuel Janvier"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-cutoff-date">Date cutoff</Label>
              <Input
                id="batch-cutoff-date"
                type="datetime-local"
                value={batchFormData.cutoffDate}
                onChange={(event) =>
                  setBatchFormData((current) => ({
                    ...current,
                    cutoffDate: event.target.value,
                  }))
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBatchDialogOpen(false)}
                disabled={batchSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={batchSubmitting || !organisationId}>
                {selectedBatch ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce lot ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible et supprimera le lot selectionne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBatch} disabled={batchSubmitting}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={cutoffDialogOpen} onOpenChange={setCutoffDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCutoff ? "Modifier la configuration cutoff" : "Creer la configuration cutoff"}
            </DialogTitle>
            <DialogDescription>
              Parametrez l'automatisation du verrouillage et de l'expedition des lots.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCutoff} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cutoff-day">Jour cutoff</Label>
                <Input
                  id="cutoff-day"
                  type="number"
                  min={1}
                  max={31}
                  value={cutoffFormData.cutoffDayOfMonth}
                  onChange={(event) =>
                    setCutoffFormData((current) => ({
                      ...current,
                      cutoffDayOfMonth: parseNumber(event.target.value, 1),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cutoff-time">Heure cutoff</Label>
                <Input
                  id="cutoff-time"
                  type="time"
                  value={cutoffFormData.cutoffTime}
                  onChange={(event) =>
                    setCutoffFormData((current) => ({
                      ...current,
                      cutoffTime: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="processing-days">Jours traitement</Label>
                <Input
                  id="processing-days"
                  type="number"
                  min={0}
                  value={cutoffFormData.processingDays}
                  onChange={(event) =>
                    setCutoffFormData((current) => ({
                      ...current,
                      processingDays: parseNumber(event.target.value, 0),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="auto-lock"
                  checked={cutoffFormData.autoLock}
                  onCheckedChange={(value) =>
                    setCutoffFormData((current) => ({
                      ...current,
                      autoLock: value === true,
                    }))
                  }
                />
                <Label htmlFor="auto-lock">Activer le verrouillage automatique</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="auto-dispatch"
                  checked={cutoffFormData.autoDispatch}
                  onCheckedChange={(value) =>
                    setCutoffFormData((current) => ({
                      ...current,
                      autoDispatch: value === true,
                    }))
                  }
                />
                <Label htmlFor="auto-dispatch">Activer l'expedition automatique</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCutoffDialogOpen(false)}
                disabled={cutoffSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={cutoffSubmitting || !organisationId}>
                {selectedCutoff ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cutoffDeleteDialogOpen} onOpenChange={setCutoffDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette configuration ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible et supprimera la configuration cutoff active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cutoffSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCutoff} disabled={cutoffSubmitting}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={carrierDialogOpen} onOpenChange={setCarrierDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{selectedCarrier ? "Modifier le transporteur" : "Creer un transporteur"}</DialogTitle>
            <DialogDescription>
              Renseignez les informations du compte transporteur.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCarrier} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="carrier-name">Nom</Label>
                <Input
                  id="carrier-name"
                  value={carrierFormData.nom}
                  onChange={(event) =>
                    setCarrierFormData((current) => ({
                      ...current,
                      nom: event.target.value,
                    }))
                  }
                  placeholder="Compte Colissimo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrier-type">Type</Label>
                <Input
                  id="carrier-type"
                  value={carrierFormData.type}
                  onChange={(event) =>
                    setCarrierFormData((current) => ({
                      ...current,
                      type: event.target.value,
                    }))
                  }
                  placeholder="COLISSIMO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrier-contract">Numero de contrat</Label>
                <Input
                  id="carrier-contract"
                  value={carrierFormData.contractNumber}
                  onChange={(event) =>
                    setCarrierFormData((current) => ({
                      ...current,
                      contractNumber: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrier-label-format">Format etiquette</Label>
                <Input
                  id="carrier-label-format"
                  value={carrierFormData.labelFormat}
                  onChange={(event) =>
                    setCarrierFormData((current) => ({
                      ...current,
                      labelFormat: event.target.value,
                    }))
                  }
                  placeholder="PDF"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier-password">
                Mot de passe{selectedCarrier ? " (laisser vide pour conserver)" : ""}
              </Label>
              <Input
                id="carrier-password"
                type="password"
                value={carrierFormData.password}
                onChange={(event) =>
                  setCarrierFormData((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required={!selectedCarrier}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="carrier-active"
                checked={carrierFormData.isActive}
                onCheckedChange={(value) =>
                  setCarrierFormData((current) => ({
                    ...current,
                    isActive: value === true,
                  }))
                }
              />
              <Label htmlFor="carrier-active">Compte actif</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCarrierDialogOpen(false)}
                disabled={carrierSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={carrierSubmitting || !organisationId}>
                {selectedCarrier ? "Mettre a jour" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={carrierDeleteDialogOpen} onOpenChange={setCarrierDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce transporteur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera definitivement le compte transporteur selectionne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={carrierSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCarrier} disabled={carrierSubmitting}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
